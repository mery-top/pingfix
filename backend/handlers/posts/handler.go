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
    posts := []map[string]interface{}{}
    if err := db.DB.Table("posts").
        Select(`posts.id, posts.content, posts.created_at, 
                groups.id as group_id, groups.name as group_name, groups.handle as group_handle,
                users.id as user_id, users.name as username`).
        Joins("JOIN groups ON posts.group_id = groups.id").
        Joins("JOIN users ON posts.user_id = users.id").
        Where("groups.creator_id = ?", userID).
        Order("posts.created_at DESC").
        Limit(limit).Offset(offset).
        Find(&posts).Error; err != nil {
        fmt.Println(err)
        http.Error(w, "Error fetching posts", http.StatusInternalServerError)
        return
    }

    // Count total posts
    var total int64
    db.DB.Table("posts").
        Joins("JOIN groups ON posts.group_id = groups.id").
        Where("groups.creator_id = ?", userID).
        Count(&total)

    // Response
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
    if err := json.NewEncoder(w).Encode(response); err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
}



