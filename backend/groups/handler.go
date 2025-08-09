package groups

import (
	"backend/database/db"
	"backend/models"
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"gorm.io/gorm"
)

func GroupRegister(w http.ResponseWriter, r *http.Request){
	var group struct{
		Name string `json:"name"`
		Description string `json:"description"`
		Handle string `json:"handle"`
		Country string `json:"country"`
		State string `json:"state"`
		City string `json:"city"`
		AuthorityEmail string `json:"authorityEmail"`
		CreatorID uint
	}

	log.Println("Group Register Endpoint HIT")
	if err := json.NewDecoder(r.Body).Decode(&group); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}
	
	var existingGroup models.Group
	result:= db.DB.First(&existingGroup, "handle = ?", group.Handle)

	if result.Error == nil{
		http.Error(w, "Handle Already Exists", http.StatusConflict)
		return
	}

	session, _:= db.Store.Get(r, "session")
	group.CreatorID = session.Values["user_id"].(uint)

	db.CreateGroup(group.Name, group.Description, group.Handle, group.Country, group.State, group.City, group.AuthorityEmail, int(group.CreatorID))

	w.WriteHeader(http.StatusCreated)
}

func SearchGroups(w http.ResponseWriter, r *http.Request){

	handle := r.URL.Query().Get("handle")
	country := r.URL.Query().Get("country")
	state := r.URL.Query().Get("state")
	city := r.URL.Query().Get("city")

	page, _:= strconv.Atoi(r.URL.Query().Get("page"))
	limit, _:= strconv.Atoi(r.URL.Query().Get("limit"))

	if page <= 0{
		page = 1
	}

	if limit <=0{
		limit = 10
	}

	offset:= (page -1) * limit

	var groups []models.Group
	query:= db.DB.Model(&models.Group{})

	if handle != "" {
		query = query.Where("handle LIKE ?", "%"+handle+"%")
	}
	if country != "" {
		query = query.Where("country LIKE ?", "%"+country+"%")
	}
	if state != "" {
		query = query.Where("state LIKE ?", "%"+state+"%")
	}
	if city != "" {
		query = query.Where("city LIKE ?", "%"+city+"%")
	}

	var total int64
	query.Count(&total)


	err:= query.Offset(offset).Limit(limit).Find(&groups).Error

	if err !=nil && err != gorm.ErrRecordNotFound{
		http.Error(w, "Error fetching groups", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"data": groups,
		"pagination": map[string]interface{}{
			"page":  page,
			"limit": limit,
			"total": total,
			"pages": (total + int64(limit) - 1) / int64(limit),
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)

}

