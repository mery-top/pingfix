package groups

import (
	"backend/database/db"
	"backend/database/handlers"
	"backend/models"
	"encoding/json"
	"fmt"
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
		Type string `json:"type"`
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

	dbhandler.CreateGroup(group.Name, group.Description, group.Handle, group.Type, group.Country, group.State, group.City, group.AuthorityEmail, int(group.CreatorID))

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

	var groups []struct {
        ID              uint   `json:"ID"`
        Name            string `json:"Name"`
        Handle          string `json:"Handle"`
        Country         string `json:"Country"`
        State           string `json:"State"`
        City            string `json:"City"`
        Description     string `json:"Description"`
        Type            string `json:"Type"`
        SubscriberCount int    `json:"SubscriberCount"`
        IsJoined        bool   `json:"isJoined"`
    }

	session, _ := db.Store.Get(r, "session")
	userID := session.Values["user_id"].(uint)

	query:= db.DB.Table("groups").
			Select(`groups.id, groups.name, groups.handle, groups.country, groups.state, groups.city, groups.description, groups.type, groups.subscriber_count,
			CASE WHEN gd.user_id is NOT NULL THEN true ELSE false END AS is_joined `).
			Joins("LEFT JOIN group_data as gd ON gd.group_id = groups.id AND gd.user_id = ?", userID)

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

func JoinGroup(w http.ResponseWriter, r *http.Request){
	var req struct{
		GroupID uint `json:"groupID"`
	}
	if err:= json.NewDecoder(r.Body).Decode(&req); err!=nil{
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	session, _ := db.Store.Get(r, "session")
	userID := session.Values["user_id"].(uint)

	tx:= db.DB.Begin()

	if err:= tx.Create(&models.GroupData{
		UserID: userID,
		GroupID: req.GroupID,
	}).Error; err!=nil{
		tx.Rollback()
		http.Error(w, "Failed to Create Join Group", http.StatusInternalServerError)
		return
	}

	if err:= tx.Model(&models.Group{}).Where("id = ?", req.GroupID).UpdateColumn("subscriber_count", gorm.Expr("subscriber_count + ?", 1)).Error; err!=nil{
		tx.Rollback()
		http.Error(w, "Failed to update subscriber count", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit().Error; err != nil {
		http.Error(w, "Transaction commit failed", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)

}
/*--------------------------------------------------
NEED TO APPLY UNION HERE
----------------------------------------------------
*/
func MyGroups(w http.ResponseWriter, r *http.Request){

	fmt.Println("MyGroups Endpoint")

	page, _:= strconv.Atoi(r.URL.Query().Get("page"))
	limit, _:= strconv.Atoi(r.URL.Query().Get("limit"))

	if page <= 0{
		page = 1
	}

	if limit <=0{
		limit = 10
	}

	offset:= (page -1) * limit


	session, _ := db.Store.Get(r, "session")
	userID, ok := session.Values["user_id"].(uint)

	if !ok{
		http.Error(w, "Status Unauthorized", http.StatusUnauthorized)
		return
	}

	createdGroups :=[]map[string]interface{}{}
	fmt.Println("Reached Created Groups")
	if err:= db.DB.Table("groups").Where("creator_id = ?", userID).Select(`groups.id, groups.name, groups.description, groups.handle, groups.country, groups.state, groups.city, groups.subscriber_count,
                true AS is_joined`).Limit(limit).Offset(offset).Find(&createdGroups).Error; err!=nil{
		fmt.Println(err)
		http.Error(w, "Error fetching created groups", http.StatusInternalServerError)
        return
	}

	
	joinedGroups := []map[string]interface{}{}
	fmt.Println("Reached Joined Groups")
	if err:= db.DB.Table("groups").
			Select(`groups.id, groups.name, groups.description, groups.handle, groups.country, groups.state, groups.city, groups.subscriber_count,
                CASE WHEN gd.user_id IS NOT NULL THEN true ELSE false END AS is_joined`).
			Joins("JOIN group_data gd on groups.id = gd.group_id").
			Where("gd.user_id = ? AND groups.creator_id <> ?", userID, userID).
			Limit(limit).Offset(offset).Find(&joinedGroups).Error; err!=nil{
		fmt.Println(err)
		http.Error(w, "Error fetching created groups", http.StatusInternalServerError)
        return
	}


	var totalCreated int64
    db.DB.Model(&models.Group{}).Where("creator_id = ?", userID).Count(&totalCreated)

    var totalJoined int64
    db.DB.Table("groups").
        Joins("JOIN group_data gd ON gd.group_id = groups.id").
        Where("gd.user_id = ? AND groups.creator_id <> ?", userID, userID).
        Count(&totalJoined)

	total:= totalCreated + totalJoined

	response:= map[string]interface{}{
		"pagination": map[string]interface{}{
            "page":           page,
			"limit": 			limit,
            "total_created":  totalCreated,
            "total_joined":   totalJoined,
			"pages": (total + int64(limit) - 1) / int64(limit),
        },
		"groups": joinedGroups,
		"created": createdGroups,
	}

	w.Header().Set("Content-Type", "application/json")
	if err:= json.NewEncoder(w).Encode(response); err!=nil{
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return 
	}
}
