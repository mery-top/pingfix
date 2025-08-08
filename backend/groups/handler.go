package groups

import (
	"backend/models"
	"encoding/json"
	"log"
	"net/http"
	"backend/database/db"
)

func GroupRegister(w http.ResponseWriter, r *http.Request){
	var group struct{
		Name string `json:"name"`
		Description string `json:"description"`
		Handle string `json:"handle"`
		Location string `json:"location"`
		AuthorityEmail string `json:"authorityEmail"`
		CreatorID uint
	}

	log.Println("Group Register Endpoint HIT")
	var existingGroup models.Group
	result:= db.DB.First(&existingGroup, "handle = ?", group.Handle)

	if result.Error == nil{
		http.Error(w, "Handle Already Exists", http.StatusConflict)
		return
	}

	session, _:= db.Store.Get(r, "session")
	group.CreatorID = session.Values["user_id"].(uint)

	json.NewDecoder(r.Body).Decode(&group)

	db.CreateGroup(group.Name, group.Description, group.Handle, group.Location, group.AuthorityEmail, int(group.CreatorID))
	
	w.WriteHeader(http.StatusCreated)
}

