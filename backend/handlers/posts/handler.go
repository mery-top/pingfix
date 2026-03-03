package posts

import (
	"backend/database/db"
	dbhandler "backend/database/handlers"
	models "backend/models"
	utils "backend/utils"
	"encoding/json"
	"fmt"
	"net/http"

	"strconv"

	"time"

	"github.com/gorilla/mux"
)

func CreatePost(w http.ResponseWriter, r *http.Request) {
    session, _ := db.Store.Get(r, "session")
    userID, ok := session.Values["user_id"].(uint)
    if !ok {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    if err := r.ParseMultipartForm(20 << 20); err != nil { // 20MB
        http.Error(w, "Cannot parse form: "+err.Error(), http.StatusBadRequest)
        return
    }

    groupIDs := r.Form["groupID"]
    if len(groupIDs) == 0 {
        http.Error(w, "No groups selected", http.StatusBadRequest)
        return
    }

    content := utils.Sanitize(r.FormValue("content"))
    links := utils.SanitizeSlice(r.Form["links"])
    tags := utils.SanitizeSlice(r.Form["tags"])

    // ----------------- Handle images -----------------
    files := r.MultipartForm.File["images"]
    imagePaths := []string{}

    for _, fh := range files {
        file, err := fh.Open()
        if err != nil {
            http.Error(w, "Failed to read image: "+fh.Filename, http.StatusBadRequest)
            return
        }

        safeName := fmt.Sprintf("%d_%s", time.Now().UnixNano(), utils.SanitizeFileName(fh.Filename))
        url, err := utils.UploadToS3(file, safeName)
        file.Close()
        if err != nil {
            http.Error(w, "S3 upload failed: "+safeName, http.StatusInternalServerError)
            return
        }
        imagePaths = append(imagePaths, url)
    }

    shareToken := utils.GenerateShareToken()

    for _, idStr := range groupIDs {
        groupID, err := strconv.Atoi(idStr)
        if err != nil {
            http.Error(w, "Invalid group ID: "+idStr, http.StatusBadRequest)
            return
        }

        if err := dbhandler.CreatePost(uint(groupID), userID, content, imagePaths, links, tags, shareToken); err != nil {
            http.Error(w, "Failed to create post: "+err.Error(), http.StatusInternalServerError)
            return
        }
    }

    w.WriteHeader(http.StatusCreated)
}


func MyPosts(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 10
	}
	offset := (page - 1) * limit

	session, _ := db.Store.Get(r, "session")
	userID, ok := session.Values["user_id"].(uint)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	resolved := r.URL.Query().Get("resolved")
	resolvedFilter := ""
	if resolved == "true" {
		resolvedFilter = "AND posts.resolved = true"
	} else if resolved == "false" {
		resolvedFilter = "AND posts.resolved = false"
	}

	// -----------------------
	// Single optimized query
	// -----------------------
	sql := fmt.Sprintf(`
	SELECT 
		posts.id, posts.content, posts.share_token, posts.resolved, posts.created_at,
		json_build_object('id', users.id, 'name', users.name) AS user,
		json_build_object('id', groups.id, 'name', groups.name) AS "group",
		COALESCE(upvotes.count, 0) AS upvotes,
		COALESCE(downvotes.count, 0) AS downvotes,
		COALESCE(comments.count, 0) AS comments,
		COALESCE(resolves.count, 0) AS resolve_count,
		COALESCE(user_resolved.user_id IS NOT NULL, false) AS user_resolved,
		COALESCE(imgs.images, '[]') AS images,
		COALESCE(links.links, '[]') AS links,
		COALESCE(tags.tags, '[]') AS tags
	FROM posts
	JOIN groups ON posts.group_id = groups.id
	JOIN users ON posts.user_id = users.id
	LEFT JOIN (
		SELECT post_id, COUNT(*) AS count FROM post_votes WHERE vote_type=1 GROUP BY post_id
	) AS upvotes ON upvotes.post_id = posts.id
	LEFT JOIN (
		SELECT post_id, COUNT(*) AS count FROM post_votes WHERE vote_type=-1 GROUP BY post_id
	) AS downvotes ON downvotes.post_id = posts.id
	LEFT JOIN (
		SELECT post_id, COUNT(*) AS count FROM comments GROUP BY post_id
	) AS comments ON comments.post_id = posts.id
	LEFT JOIN (
		SELECT post_id, COUNT(*) AS count FROM post_resolves GROUP BY post_id
	) AS resolves ON resolves.post_id = posts.id
	LEFT JOIN (
		SELECT post_id, user_id FROM post_resolves WHERE user_id=? 
	) AS user_resolved ON user_resolved.post_id = posts.id
	LEFT JOIN (
		SELECT post_id, json_agg(url) AS images FROM post_images GROUP BY post_id
	) AS imgs ON imgs.post_id = posts.id
	LEFT JOIN (
		SELECT post_id, json_agg(url) AS links FROM post_links GROUP BY post_id
	) AS links ON links.post_id = posts.id
	LEFT JOIN (
		SELECT post_id, json_agg(name) AS tags FROM post_tags GROUP BY post_id
	) AS tags ON tags.post_id = posts.id
	WHERE groups.creator_id=? AND groups.deleted_at IS NULL %s
	ORDER BY posts.created_at DESC
	LIMIT ? OFFSET ?;
	`, resolvedFilter)

	var posts []models.PostResponse

	if err := db.DB.Raw(sql, userID, userID, limit, offset).Scan(&posts).Error; err != nil {
		http.Error(w, "Error fetching posts: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Total posts count
	var total int64
	db.DB.Model(&models.Post{}).
		Joins("JOIN groups ON posts.group_id = groups.id").
		Where("groups.creator_id = ? AND groups.deleted_at IS NULL", userID).
		Count(&total)

	// Add share URL
	for i := range posts {
		posts[i].ShareURL = "http://localhost:8080/public/post/" 
	}

	// Response
	resp := map[string]interface{}{
		"pagination": map[string]interface{}{
			"page":  page,
			"limit": limit,
			"total": total,
			"pages": (total + int64(limit) - 1) / int64(limit),
		},
		"posts": posts,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func DeletePost(w http.ResponseWriter, r *http.Request) {

	session, _ := db.Store.Get(r, "session")
	userID, ok := session.Values["user_id"].(uint)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get post ID from URL
	postIDStr := r.URL.Query().Get("id")
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}

	var post models.Post

	// Find post with group
	err = db.DB.
		Preload("Group").
		First(&post, postID).Error

	if err != nil {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	// Authorization: only group creator can delete
	if post.Group.CreatorID != userID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	// Soft delete (because you have deleted_at)
	if err := db.DB.Delete(&post).Error; err != nil {
		http.Error(w, "Failed to delete post", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Post deleted successfully"))
}

func GetSharedPost(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	token := vars["token"]

	if token == "" {
		http.Error(w, "Invalid token", http.StatusBadRequest)
		return
	}

	var post models.Post

	err := db.DB.
		Preload("User").
		Preload("Group").
		Preload("Images").
		Preload("Links").
		Preload("Tags").
		Where("share_token = ?", token).
		First(&post).Error

	if err != nil {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	var upvotes, downvotes, commentCount, resolveCount int64
	db.DB.Model(&models.PostVote{}).Where("post_id = ? AND vote_type = 1", post.ID).Count(&upvotes)
	db.DB.Model(&models.PostVote{}).Where("post_id = ? AND vote_type = -1", post.ID).Count(&downvotes)
	db.DB.Model(&models.Comment{}).Where("post_id = ?", post.ID).Count(&commentCount)
	db.DB.Model(&models.PostResolve{}).Where("post_id = ?", post.ID).Count(&resolveCount)

	response := models.PostResponse{
		Post:         post,
		Upvotes:      upvotes,
		Downvotes:    downvotes,
		Comments:     commentCount,
		ResolveCount: resolveCount,
		ShareURL:     "http://localhost:8080/public/post/" + post.ShareToken,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func VotePost(w http.ResponseWriter, r *http.Request) {

	session, _ := db.Store.Get(r, "session")
	userID, ok := session.Values["user_id"].(uint)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		PostID   uint `json:"post_id"`
		VoteType int  `json:"vote_type"` // 1 or -1
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.VoteType != 1 && req.VoteType != -1 {
		http.Error(w, "Invalid vote type", http.StatusBadRequest)
		return
	}

	var existingVote models.PostVote

	err := db.DB.
		Where("post_id = ? AND user_id = ?", req.PostID, userID).
		First(&existingVote).Error

	// If vote exists → update
	if err == nil {
		existingVote.VoteType = req.VoteType
		db.DB.Save(&existingVote)
	} else {
		// Create new vote
		newVote := models.PostVote{
			PostID:   req.PostID,
			UserID:   userID,
			VoteType: req.VoteType,
		}
		db.DB.Create(&newVote)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

func ResolvePost(w http.ResponseWriter, r *http.Request) {

	session, _ := db.Store.Get(r, "session")
	userID, ok := session.Values["user_id"].(uint)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		PostID uint `json:"post_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	var existingResolve models.PostResolve

	err := db.DB.
		Where("post_id = ? AND user_id = ?", req.PostID, userID).
		First(&existingResolve).Error

	// If resolve exists → remove it (toggle off)
	if err == nil {
		db.DB.Delete(&existingResolve)
	} else {
		// Create new resolve (toggle on)
		newResolve := models.PostResolve{
			PostID: req.PostID,
			UserID: userID,
		}
		db.DB.Create(&newResolve)
	}

	// ============================
	// 🔥 CHECK 65% RULE
	// ============================

	var post models.Post
	if err := db.DB.Preload("Group").First(&post, req.PostID).Error; err != nil {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	// Total group members
	var totalMembers int64
	db.DB.Model(&models.GroupData{}).
		Where("group_id = ?", post.GroupID).
		Count(&totalMembers)

	// Total resolves
	var resolveCount int64
	db.DB.Model(&models.PostResolve{}).
		Where("post_id = ?", post.ID).
		Count(&resolveCount)

	// Calculate percentage
	if totalMembers > 0 {
		percentage := (float64(resolveCount) / float64(totalMembers)) * 100

		if percentage >= 65 {
			post.Resolved = true
		} else {
			post.Resolved = false
		}

		db.DB.Save(&post)
	}


	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}


func AddComment(w http.ResponseWriter, r *http.Request) {

	session, _ := db.Store.Get(r, "session")
	userID, ok := session.Values["user_id"].(uint)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		PostID  uint   `json:"post_id"`
		Content string `json:"content"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.Content == "" {
		http.Error(w, "Comment cannot be empty", http.StatusBadRequest)
		return
	}

	comment := models.Comment{
		PostID:  req.PostID,
		UserID:  userID,
		Content: utils.Sanitize(req.Content),
	}

	if err := db.DB.Create(&comment).Error; err != nil {
		http.Error(w, "Error adding comment", http.StatusInternalServerError)
		return
	}

	// Preload User for the response
	db.DB.Preload("User").First(&comment, comment.ID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(comment)
}

func DeleteComment(w http.ResponseWriter, r *http.Request) {

	session, _ := db.Store.Get(r, "session")
	userID, ok := session.Values["user_id"].(uint)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	commentID, _ := strconv.Atoi(vars["id"])

	var comment models.Comment

	if err := db.DB.First(&comment, commentID).Error; err != nil {
		http.Error(w, "Comment not found", http.StatusNotFound)
		return
	}

	// Only comment owner can delete
	if comment.UserID != userID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	if err := db.DB.Delete(&comment).Error; err != nil {
		http.Error(w, "Error deleting comment", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

func EditComment(w http.ResponseWriter, r *http.Request) {
	// Get session and user
	session, _ := db.Store.Get(r, "session")
	userID, ok := session.Values["user_id"].(uint)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get comment ID from URL
	vars := mux.Vars(r)
	commentID, err := strconv.Atoi(vars["id"])
	fmt.Printf("DEBUG: Editing comment ID: %v from URL vars\n", vars["id"])
	if err != nil {
		fmt.Printf("DEBUG: Invalid comment ID: %v\n", err)
		http.Error(w, "Invalid comment ID", http.StatusBadRequest)
		return
	}

	// Decode new content from request body
	var req struct {
		Content string `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.Content == "" {
		http.Error(w, "Comment content cannot be empty", http.StatusBadRequest)
		return
	}
	
	// Find the comment
	var comment models.Comment
	if err := db.DB.First(&comment, commentID).Error; err != nil {
		http.Error(w, "Comment not found", http.StatusNotFound)
		return
	}

	// Check ownership
	if comment.UserID != userID {
		fmt.Printf("DEBUG: Forbidden - User %d tried to edit comment of User %d\n", userID, comment.UserID)
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}
	fmt.Printf("DEBUG: Ownership verified for User %d\n", userID)

	// Update comment
	comment.Content = utils.Sanitize(req.Content)
	if err := db.DB.Save(&comment).Error; err != nil {
		http.Error(w, "Error updating comment", http.StatusInternalServerError)
		return
	}

	// Preload User for the response
	db.DB.Preload("User").First(&comment, comment.ID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(comment)
}

func GetComments(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	postIDStr := vars["post_id"]
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}

	// Pagination query params
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 5
	}
	offset := (page - 1) * limit

	var comments []models.Comment
	query := db.DB.
		Preload("User").
		Where("post_id = ?", postID).
		Order("created_at ASC") // oldest first for chat-like order

	var total int64
	query.Model(&models.Comment{}).Count(&total)

	if err := query.Limit(limit).Offset(offset).Find(&comments).Error; err != nil {
		http.Error(w, "Error fetching comments", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"pagination": map[string]interface{}{
			"page":  page,
			"limit": limit,
			"total": total,
			"pages": (total + int64(limit) - 1) / int64(limit),
		},
		"comments": comments,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
