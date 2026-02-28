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

	"backend/utils"
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

func LeaveGroup(w http.ResponseWriter, r *http.Request) {
	fmt.Println("LeaveGroup Endpoint")

	var req struct {
		GroupID uint `json:"groupID"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	session, _ := db.Store.Get(r, "session")
	userID, ok := session.Values["user_id"].(uint)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Check if group exists
	var group models.Group
	if err := db.DB.First(&group, req.GroupID).Error; err != nil {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	// Prevent creator from leaving
	if group.CreatorID == userID {
		http.Error(w, "Creator cannot leave their own group", http.StatusForbidden)
		return
	}

	tx := db.DB.Begin()

	// Delete from group_data
	if err := tx.Where("user_id = ? AND group_id = ?", userID, req.GroupID).
		Delete(&models.GroupData{}).Error; err != nil {

		tx.Rollback()
		http.Error(w, "Failed to leave group", http.StatusInternalServerError)
		return
	}

	// Decrement subscriber_count
	if err := tx.Model(&models.Group{}).
		Where("id = ?", req.GroupID).
		UpdateColumn("subscriber_count", gorm.Expr("CASE WHEN subscriber_count > 0 THEN subscriber_count - 1 ELSE 0 END")).Error; err != nil {

		tx.Rollback()
		http.Error(w, "Failed to update subscriber count", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit().Error; err != nil {
		http.Error(w, "Transaction commit failed", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Successfully left group"))
}


func RequestDeleteGroup(w http.ResponseWriter, r *http.Request) {
	fmt.Println("RequestDeleteGroup Endpoint")

	var req struct {
		GroupID uint `json:"groupID"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	session, _ := db.Store.Get(r, "session")
	userID, ok := session.Values["user_id"].(uint)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Fetch group
	var group models.Group
	if err := db.DB.First(&group, req.GroupID).Error; err != nil {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	// Only creator allowed
	if group.CreatorID != userID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	// Get creator email
	var user models.User
	if err := db.DB.First(&user, userID).Error; err != nil {
		http.Error(w, "User not found", http.StatusInternalServerError)
		return
	}

	// Generate OTP
	otp := utils.GenerateOTP()

	otpStore, _ := db.Store.Get(r, "otp")
	otpStore.Values[user.Email+"_delete_"+fmt.Sprint(req.GroupID)] = otp
	otpStore.Save(r, w)

	// Send Email
	err := utils.SendEmail(user.Email,
		"Confirm Group Deletion",
		"Your OTP to delete group '"+group.Name+"' is: "+otp)

	if err != nil {
		http.Error(w, "Failed to send OTP", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func ConfirmDeleteGroup(w http.ResponseWriter, r *http.Request) {
	fmt.Println("ConfirmDeleteGroup Endpoint")

	var req struct {
		GroupID uint   `json:"groupID"`
		OTP     string `json:"otp"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	session, _ := db.Store.Get(r, "session")
	userID, ok := session.Values["user_id"].(uint)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get user email
	var user models.User
	if err := db.DB.First(&user, userID).Error; err != nil {
		http.Error(w, "User not found", http.StatusInternalServerError)
		return
	}

	otpStore, _ := db.Store.Get(r, "otp")
	key := user.Email + "_delete_" + fmt.Sprint(req.GroupID)

	storedOTP, ok := otpStore.Values[key]
	if !ok || storedOTP != req.OTP {
		http.Error(w, "Invalid OTP", http.StatusUnauthorized)
		return
	}

	delete(otpStore.Values, key)
	otpStore.Save(r, w)

	tx := db.DB.Begin()

	// Delete post images
	tx.Exec(`
		DELETE FROM post_images 
		WHERE post_id IN (SELECT id FROM posts WHERE group_id = ?)`, req.GroupID)

	// Delete post links
	tx.Exec(`
		DELETE FROM post_links 
		WHERE post_id IN (SELECT id FROM posts WHERE group_id = ?)`, req.GroupID)

	// Delete post tags
	tx.Exec(`
		DELETE FROM post_tags 
		WHERE post_id IN (SELECT id FROM posts WHERE group_id = ?)`, req.GroupID)

	// Delete posts
	tx.Where("group_id = ?", req.GroupID).Delete(&models.Post{})

	// Delete group members
	tx.Where("group_id = ?", req.GroupID).Delete(&models.GroupData{})

	// Delete group itself
	if err := tx.Delete(&models.Group{}, req.GroupID).Error; err != nil {
		tx.Rollback()
		http.Error(w, "Failed to delete group", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit().Error; err != nil {
		http.Error(w, "Transaction failed", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Group deleted successfully"))
}

func ViewGroup(w http.ResponseWriter, r *http.Request) {
    // Get groupID from query
    groupIDStr := r.URL.Query().Get("groupID")
    if groupIDStr == "" {
        http.Error(w, "groupID is required", http.StatusBadRequest)
        return
    }

    groupID, err := strconv.Atoi(groupIDStr)
    if err != nil {
        http.Error(w, "Invalid groupID", http.StatusBadRequest)
        return
    }

    session, _ := db.Store.Get(r, "session")
    userID, ok := session.Values["user_id"].(uint)
    if !ok {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    // Fetch group with creator info
    var group models.Group
    if err := db.DB.Preload("Creator").First(&group, groupID).Error; err != nil {
        http.Error(w, "Group not found", http.StatusNotFound)
        return
    }

    // Check if current user has joined
    var isJoined bool
    var gd models.GroupData
    if err := db.DB.Where("group_id = ? AND user_id = ?", groupID, userID).First(&gd).Error; err == nil {
        isJoined = true
    }

    // Fetch subscribers (basic info)
    var subscribers []models.User
    if err := db.DB.Model(&group).Association("Subscribers").Find(&subscribers); err != nil {
        log.Println("Failed to fetch subscribers:", err)
    }

    // Fetch posts with related data
    var posts []models.Post
    if err := db.DB.Preload("Tags").
        Preload("Images").
        Preload("Links").
        Preload("Votes").
        Preload("Comments").
        Where("group_id = ?", groupID).
        Order("created_at DESC").
        Find(&posts).Error; err != nil {
        log.Println("Failed to fetch posts:", err)
    }

    // Prepare posts response
    postResponses := []map[string]interface{}{}
    for _, post := range posts {
        var upvotes, downvotes int64
        for _, v := range post.Votes {
            if v.VoteType == 1 {
                upvotes++
            } else if v.VoteType == -1 {
                downvotes++
            }
        }
        postResponses = append(postResponses, map[string]interface{}{
            "post":      post,
            "upvotes":   upvotes,
            "downvotes": downvotes,
            "comments":  len(post.Comments),
            "share_url": fmt.Sprintf("/share/%s", post.ShareToken),
        })
    }

    // Response JSON
    response := map[string]interface{}{
        "group": map[string]interface{}{
            "id":               group.ID,
            "name":             group.Name,
            "handle":           group.Handle,
            "description":      group.Description,
            "type":             group.Type,
            "country":          group.Country,
            "state":            group.State,
            "city":             group.City,
            "authorityEmail":   group.AuthorityEmail,
            "creator": map[string]interface{}{
                "id":    group.Creator.ID,
                "name":  group.Creator.Name,
                "email": group.Creator.Email,
            },
            "subscriberCount": group.SubscriberCount,
            "isJoined":        isJoined,
        },
        "subscribers": subscribers,
        "posts":       postResponses,
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(response)
}