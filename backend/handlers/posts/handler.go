package posts

import (
	"backend/database/db"
	dbhandler "backend/database/handlers"
    models "backend/models"
	utils "backend/utils"
	"encoding/json"
	"net/http"
	"strconv"
	"fmt"
    "io"
    "os"
	"github.com/gorilla/mux"
)

func CreatePost(w http.ResponseWriter, r *http.Request){
	session, _:= db.Store.Get(r,"session")
	userID, ok:= session.Values["user_id"].(uint)

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
	content := r.FormValue("content")
	links := r.Form["links"]
	tags := r.Form["tags"]

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
		defer file.Close()

		filePath := "./uploads/" + fileHeader.Filename
		dst, err := os.Create(filePath)
		if err != nil {
			continue
		}
		defer dst.Close()

		io.Copy(dst, file)

		imagePaths = append(imagePaths, filePath)
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
	fmt.Println("MyPosts Endpoint")

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
		Where("groups.creator_id = ?", userID).
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


	response := map[string]interface{}{
		"pagination": map[string]interface{}{
			"page":  page,
			"limit": limit,
			"total": total,
			"pages": (total + int64(limit) - 1) / int64(limit),
		},
		"posts": posts,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func DeletePost(w http.ResponseWriter, r *http.Request) {
	fmt.Println("DeletePost Endpoint")

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

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(post)
}

