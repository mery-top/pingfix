package feed

import (
	"backend/database/db"
	"backend/models"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"gorm.io/gorm"

)

func Feed(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Feed Endpoint")

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 10
	}

	offset := (page - 1) * limit

	// Get session
	session, _ := db.Store.Get(r, "session")
	userID, ok := session.Values["user_id"].(uint)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var posts []models.Post

	baseQuery := db.DB.
	Model(&models.Post{}).
	Preload("User").
	Preload("Group").
	Preload("Images").
	Preload("Links").
	Preload("Tags").
	Joins("LEFT JOIN group_data gd ON gd.group_id = posts.group_id").
	Joins("LEFT JOIN groups g ON g.id = posts.group_id").
	Where("gd.user_id = ? OR g.creator_id = ?", userID, userID).
	Order("posts.created_at DESC")

	// Count
	var total int64
	if err := baseQuery.Session(&gorm.Session{}).Count(&total).Error; err != nil {
		http.Error(w, "Error counting feed", http.StatusInternalServerError)
		return
	}

	// Fetch
	if err := baseQuery.Session(&gorm.Session{}).
		Limit(limit).
		Offset(offset).
		Find(&posts).Error; err != nil {

		http.Error(w, "Error fetching feed", http.StatusInternalServerError)
		return
	}


	var responsePosts []models.PostResponse

	for _, post := range posts {

		var upvotes int64
		var downvotes int64
		var commentCount int64

		db.DB.Model(&models.PostVote{}).
			Where("post_id = ? AND vote_type = 1", post.ID).
			Count(&upvotes)

		db.DB.Model(&models.PostVote{}).
			Where("post_id = ? AND vote_type = -1", post.ID).
			Count(&downvotes)

		db.DB.Model(&models.Comment{}).
			Where("post_id = ?", post.ID).
			Count(&commentCount)

		responsePosts = append(responsePosts, models.PostResponse{
			Post:      post,
			Upvotes:   upvotes,
			Downvotes: downvotes,
			Comments:  commentCount,
			ShareURL:  "http://localhost:8080/public/post/" + post.ShareToken,
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