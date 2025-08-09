package user

import (
	"backend/database/db"
	"backend/models"
	"encoding/json"
	"net/http"
)

func GetCurrentUser(w http.ResponseWriter, r *http.Request){
	session, _:= db.Store.Get(r, "session")
	auth, ok:= session.Values["authenticated"].(bool)
	if !ok || !auth {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	userID:= session.Values["user_id"].(uint)
	var user models.User
	db.DB.First(&user, userID)
	json.NewEncoder(w).Encode(map[string]string{
		"name": user.Name,
		"email": user.Email,
	})
}