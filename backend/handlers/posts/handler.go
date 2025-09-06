package posts

import (
	"backend/database/db"
	dbhandler "backend/database/handlers"
	"encoding/json"
	"net/http"
	"strconv"
	"fmt"
)

func CreatePost(w http.ResponseWriter, r *http.Request){
	session, _:= db.Store.Get(r,"session")
	userID, ok:= session.Values["user_id"].(uint)

	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct{
		GroupID []uint `json:"groupID"`
		Content string `json:"content"`

	}

	if err:= json.NewDecoder(r.Body).Decode(&req); err!=nil{
		http.Error(w, "Invalid Request Payload", http.StatusBadRequest)
		return
	}

	if len(req.GroupID) == 0 {
        http.Error(w, "No groups selected", http.StatusBadRequest)
        return
    }

	for _, groupID := range req.GroupID {
        dbhandler.CreatePost(int(groupID), int(userID), req.Content)
    }


	w.WriteHeader(http.StatusCreated)
}


func MyPosts(w http.ResponseWriter, r *http.Request) {
    fmt.Println("MyPosts Endpoint")

    // Parse pagination params
    page, _ := strconv.Atoi(r.URL.Query().Get("page"))
    limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
    if page <= 0 {
        page = 1
    }
    if limit <= 0 {
        limit = 10
    }
    offset := (page - 1) * limit

    // Get user session
    session, _ := db.Store.Get(r, "session")
    userID, ok := session.Values["user_id"].(uint)
    if !ok {
        http.Error(w, "Status Unauthorized", http.StatusUnauthorized)
        return
    }

    // Fetch posts from groups created by this user
    createdPosts := []map[string]interface{}{}
    if err := db.DB.Table("posts").
        Select(`posts.id, posts.content, posts.created_at, 
                groups.id as group_id, groups.name as group_name, groups.handle as group_handle,
                users.id as user_id, users.username as username`).
        Joins("JOIN groups ON posts.group_id = groups.id").
        Joins("JOIN users ON posts.user_id = users.id").
        Where("groups.creator_id = ?", userID).
        Limit(limit).Offset(offset).
        Find(&createdPosts).Error; err != nil {
        fmt.Println(err)
        http.Error(w, "Error fetching created posts", http.StatusInternalServerError)
        return
    }

    // Fetch posts from groups joined by this user (not created by them)
    joinedPosts := []map[string]interface{}{}
    if err := db.DB.Table("posts").
        Select(`posts.id, posts.content, posts.created_at, 
                groups.id as group_id, groups.name as group_name, groups.handle as group_handle,
                users.id as user_id, users.username as username`).
        Joins("JOIN groups ON posts.group_id = groups.id").
        Joins("JOIN users ON posts.user_id = users.id").
        Joins("JOIN group_data gd ON groups.id = gd.group_id").
        Where("gd.user_id = ? AND groups.creator_id <> ?", userID, userID).
        Limit(limit).Offset(offset).
        Find(&joinedPosts).Error; err != nil {
        fmt.Println(err)
        http.Error(w, "Error fetching joined posts", http.StatusInternalServerError)
        return
    }

    // Count totals
    var totalCreated int64
    db.DB.Table("posts").
        Joins("JOIN groups ON posts.group_id = groups.id").
        Where("groups.creator_id = ?", userID).
        Count(&totalCreated)

    var totalJoined int64
    db.DB.Table("posts").
        Joins("JOIN groups ON posts.group_id = groups.id").
        Joins("JOIN group_data gd ON groups.id = gd.group_id").
        Where("gd.user_id = ? AND groups.creator_id <> ?", userID, userID).
        Count(&totalJoined)

    total := totalCreated + totalJoined

    // Response
    response := map[string]interface{}{
        "pagination": map[string]interface{}{
            "page":          page,
            "limit":         limit,
            "total_created": totalCreated,
            "total_joined":  totalJoined,
            "pages":         (total + int64(limit) - 1) / int64(limit),
        },
        "created": createdPosts,
        "joined":  joinedPosts,
    }

    w.Header().Set("Content-Type", "application/json")
    if err := json.NewEncoder(w).Encode(response); err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
}


