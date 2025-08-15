package posts

import (
	"backend/database/db"
	dbhandler "backend/database/handlers"
	"encoding/json"
	"net/http"
)

func CreatePost(w http.ResponseWriter, r *http.Request){
	session, _:= db.Store.Get(r,"session")
	userID, ok:= session.Values["user_id"].(uint)

	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct{
		GroupID uint `json:"groupID"`
		Content string `json:"content"`

	}

	if err:= json.NewDecoder(r.Body).Decode(&req); err!=nil{
		http.Error(w, "Invalid Request Payload", http.StatusBadRequest)
		return
	}

	dbhandler.CreatePost(int(req.GroupID), int(userID), req.Content)

	w.WriteHeader(http.StatusCreated)
}

