package feed

import (
	"backend/database/db"
	"backend/models"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

)

type FeedResponse struct {
	Posts      []models.PostResponse `json:"posts"`
	NextCursor string                `json:"next_cursor,omitempty"`
}

func Feed(w http.ResponseWriter, r *http.Request) {
	limit := 20
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 50 {
			limit = parsed
		}
	}

	cursor := r.URL.Query().Get("cursor") // ISO timestamp
	session, _ := db.Store.Get(r, "session")
	userID, ok := session.Values["user_id"].(uint)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Step 1: Get user's group IDs
	var groupIDs []uint
	db.DB.Model(&models.GroupData{}).
		Where("user_id = ?", userID).
		Pluck("group_id", &groupIDs)

	if len(groupIDs) == 0 {
		json.NewEncoder(w).Encode(FeedResponse{Posts: []models.PostResponse{}})
		return
	}

	// Step 2: Fetch posts with cursor pagination
	var posts []models.Post
	query := db.DB.
		Preload("User").
		Preload("Group").
		Preload("Images").
		Preload("Links").
		Preload("Tags").
		Where("group_id IN ?", groupIDs).
		Order("created_at DESC").
		Limit(limit)

	if cursor != "" {
		if t, err := time.Parse(time.RFC3339, cursor); err == nil {
			query = query.Where("created_at < ?", t)
		}
	}

	if err := query.Find(&posts).Error; err != nil {
		http.Error(w, "Error fetching feed", http.StatusInternalServerError)
		return
	}

	// Step 3: Build response
	var responsePosts []models.PostResponse
	for _, post := range posts {
		responsePosts = append(responsePosts, models.PostResponse{
			Post:         post,
			Upvotes:      post.UpvoteCount,
			Downvotes:    post.DownvoteCount,
			Comments:     post.CommentCount,
			ResolveCount: post.ResolveCount,
			UserResolved: false, // Optional: can check if user resolved in batch query
			ShareURL:     "http://localhost:8080/public/post/" + post.ShareToken,
		})
	}

	nextCursor := ""
	if len(posts) > 0 {
		nextCursor = posts[len(posts)-1].CreatedAt.Format(time.RFC3339)
	}

	resp := FeedResponse{
		Posts:      responsePosts,
		NextCursor: nextCursor,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}