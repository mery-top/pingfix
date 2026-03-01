package posts

import (
	"backend/database/db"
	dbhandler "backend/database/handlers"
	models "backend/models"
	utils "backend/utils"
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"
	"unicode"

	"github.com/gorilla/mux"
)

func CreatePost(w http.ResponseWriter, r *http.Request) {
	session, _ := db.Store.Get(r, "session")
	userID, ok := session.Values["user_id"].(uint)

	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	err := r.ParseMultipartForm(10 << 20) // 10MB
	if err != nil {
		http.Error(w, "Cannot parse form", http.StatusBadRequest)
		return
	}

	groupIDs := r.Form["groupID"]
	content := utils.Sanitize(r.FormValue("content"))
	links := utils.SanitizeSlice(r.Form["links"])
	tags := utils.SanitizeSlice(r.Form["tags"])

	if len(groupIDs) == 0 {
		http.Error(w, "No groups selected", http.StatusBadRequest)
		return
	}

	// Handle uploaded files
	files := r.MultipartForm.File["images"]
	imagePaths := []string{}

	for _, fileHeader := range files {
		file, err := fileHeader.Open()
		if err != nil {
			continue
		}

		// Replace whitespace with underscore
		safeFileName := strings.Map(func(r rune) rune {
			if unicode.IsSpace(r) {
				return '_'
			}
			return r
		}, fileHeader.Filename)

		// Remove unsafe characters
		re := regexp.MustCompile(`[^a-zA-Z0-9._-]`)
		safeFileName = re.ReplaceAllString(safeFileName, "")

		// Add timestamp for uniqueness
		safeFileName = fmt.Sprintf("%d_%s", time.Now().UnixNano(), safeFileName)

		url, err := utils.UploadToS3(file, safeFileName)
		file.Close()

		if err != nil {
			fmt.Println("S3 upload failed for", safeFileName, err)
			continue
		}

		imagePaths = append(imagePaths, url)
	}

	shareToken := utils.GenerateShareToken()

	for _, idStr := range groupIDs {
		groupID, _ := strconv.Atoi(idStr)

		err := dbhandler.CreatePost(
			uint(groupID),
			userID,
			content,
			imagePaths,
			links,
			tags,
			shareToken,
		)

		if err != nil {
			http.Error(w, "Failed to create post", http.StatusInternalServerError)
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
		http.Error(w, "Status Unauthorized", http.StatusUnauthorized)
		return
	}

	var posts []models.Post

	query := db.DB.
		Preload("User").
		Preload("Group").
		Preload("Images").
		Preload("Links").
		Preload("Tags").
		Joins("JOIN groups ON posts.group_id = groups.id").
		Where("groups.creator_id = ? AND groups.deleted_at IS NULL", userID).
		Order("posts.created_at DESC")

	// Count total
	var total int64
	query.Model(&models.Post{}).Count(&total)

	// Fetch paginated
	if err := query.
		Limit(limit).
		Offset(offset).
		Find(&posts).Error; err != nil {
		http.Error(w, "Error fetching posts", http.StatusInternalServerError)
		return
	}

	var responsePosts []models.PostResponse
	for _, post := range posts {
		var upvotes, downvotes, commentCount, resolveCount int64

		db.DB.Model(&models.PostVote{}).Where("post_id = ? AND vote_type = 1", post.ID).Count(&upvotes)
		db.DB.Model(&models.PostVote{}).Where("post_id = ? AND vote_type = -1", post.ID).Count(&downvotes)
		db.DB.Model(&models.Comment{}).Where("post_id = ?", post.ID).Count(&commentCount)
		db.DB.Model(&models.PostResolve{}).Where("post_id = ?", post.ID).Count(&resolveCount)

		responsePosts = append(responsePosts, models.PostResponse{
			Post:         post,
			Upvotes:      upvotes,
			Downvotes:    downvotes,
			Comments:     commentCount,
			ResolveCount: resolveCount,
			ShareURL:     "http://localhost:8080/public/post/" + post.ShareToken,
		})
	}

	response := map[string]interface{}{
		"pagination": map[string]interface{}{
			"page":  page,
			"limit": limit,
			"total": total,
			"pages": (total + int64(limit) - 1) / int64(limit),
		},
		"posts": responsePosts,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
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
	fmt.Printf("DEBUG: New Content for comment %d: %s\n", commentID, req.Content)

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
