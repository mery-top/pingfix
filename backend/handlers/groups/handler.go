package groups

import (
	"backend/database/db"
	dbhandler "backend/database/handlers"
	"backend/models"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"gorm.io/gorm"
	"github.com/gorilla/mux"
	"backend/utils"
	"time"
)

func GroupRegister(w http.ResponseWriter, r *http.Request) {
	var group struct {
		Name           string `json:"name"`
		Description    string `json:"description"`
		Handle         string `json:"handle"`
		Type           string `json:"type"`
		Country        string `json:"country"`
		State          string `json:"state"`
		City           string `json:"city"`
		AuthorityEmail string `json:"authorityEmail"`
		CreatorID      uint
	}

	if err := json.NewDecoder(r.Body).Decode(&group); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	var existingGroup models.Group
	result := db.DB.First(&existingGroup, "handle = ?", group.Handle)

	if result.Error == nil {
		http.Error(w, "Handle Already Exists", http.StatusConflict)
		return
	}

	session, _ := db.Store.Get(r, "session")
	group.CreatorID = session.Values["user_id"].(uint)

	dbhandler.CreateGroup(
		utils.Sanitize(group.Name),
		utils.Sanitize(group.Description),
		utils.Sanitize(group.Handle),
		group.Type,
		group.Country,
		group.State,
		utils.Sanitize(group.City),
		utils.Sanitize(group.AuthorityEmail),
		int(group.CreatorID),
	)

	w.WriteHeader(http.StatusCreated)
}

func SearchGroups(w http.ResponseWriter, r *http.Request) {

	handle := r.URL.Query().Get("handle")
	country := r.URL.Query().Get("country")
	state := r.URL.Query().Get("state")
	city := r.URL.Query().Get("city")

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

	if page <= 0 {
		page = 1
	}

	if limit <= 0 {
		limit = 10
	}

	offset := (page - 1) * limit

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

	query := db.DB.Table("groups").
		Select(`groups.id, groups.name, groups.handle, groups.country, groups.state, groups.city, groups.description, groups.type, groups.subscriber_count,
        CASE WHEN gd.user_id is NOT NULL THEN true ELSE false END AS is_joined`).
		Joins("LEFT JOIN group_data as gd ON gd.group_id = groups.id AND gd.user_id = ?", userID).
		Where("groups.deleted_at IS NULL")

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

	err := query.Offset(offset).Limit(limit).Find(&groups).Error

	if err != nil && err != gorm.ErrRecordNotFound {
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

func JoinGroup(w http.ResponseWriter, r *http.Request) {
	var req struct {
		GroupID uint `json:"groupID"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	session, _ := db.Store.Get(r, "session")
	userID := session.Values["user_id"].(uint)

	tx := db.DB.Begin()

	if err := tx.Create(&models.GroupData{
		UserID:  userID,
		GroupID: req.GroupID,
	}).Error; err != nil {
		tx.Rollback()
		http.Error(w, "Failed to Create Join Group", http.StatusInternalServerError)
		return
	}

	if err := tx.Model(&models.Group{}).Where("id = ?", req.GroupID).UpdateColumn("subscriber_count", gorm.Expr("subscriber_count + ?", 1)).Error; err != nil {
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

func MyGroups(w http.ResponseWriter, r *http.Request) {

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 10
	}

	offset := (page - 1) * limit

	session, _ := db.Store.Get(r, "session")
	userID, ok := session.Values["user_id"].(uint)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	type GroupResponse struct {
		ID              uint   `json:"id"`
		Name            string `json:"name"`
		Description     string `json:"description"`
		Handle          string `json:"handle"`
		Country         string `json:"country"`
		State           string `json:"state"`
		City            string `json:"city"`
		SubscriberCount int    `json:"subscriber_count"`
		IsJoined        bool   `json:"is_joined"`
		IsCreator       bool   `json:"is_creator"`
	}

	var groups []GroupResponse

	// ---------------- Combined Query ----------------
	err := db.DB.Raw(`
		SELECT 
			g.id,
			g.name,
			g.description,
			g.handle,
			g.country,
			g.state,
			g.city,
			g.subscriber_count,
			true AS is_joined,
			true AS is_creator
		FROM groups g
		WHERE g.creator_id = ? AND g.deleted_at IS NULL

		UNION ALL

		SELECT 
			g.id,
			g.name,
			g.description,
			g.handle,
			g.country,
			g.state,
			g.city,
			g.subscriber_count,
			true AS is_joined,
			false AS is_creator
		FROM groups g
		JOIN group_data gd ON gd.group_id = g.id
		WHERE gd.user_id = ? 
		  AND g.creator_id <> ?
		  AND g.deleted_at IS NULL

		ORDER BY id DESC
		LIMIT ? OFFSET ?
	`, userID, userID, userID, limit, offset).Scan(&groups).Error

	if err != nil {
		http.Error(w, "Error fetching groups", http.StatusInternalServerError)
		return
	}

	// ---------------- Total Count (2 fast indexed counts) ----------------
	var totalCreated int64
	db.DB.Model(&models.Group{}).
		Where("creator_id = ? AND deleted_at IS NULL", userID).
		Count(&totalCreated)

	var totalJoined int64
	db.DB.Table("group_data").
		Where("user_id = ?", userID).
		Count(&totalJoined)

	total := totalCreated + totalJoined

	response := map[string]interface{}{
		"pagination": map[string]interface{}{
			"page":          page,
			"limit":         limit,
			"total_created": totalCreated,
			"total_joined":  totalJoined,
			"pages":         (total + int64(limit) - 1) / int64(limit),
		},
		"groups": groups,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func LeaveGroup(w http.ResponseWriter, r *http.Request) {

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

	// ---------- Get Group ID ----------
	vars := mux.Vars(r)
	groupID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid group id", http.StatusBadRequest)
		return
	}

	// ---------- Session ----------
	session, _ := db.Store.Get(r, "session")
	userID, ok := session.Values["user_id"].(uint)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// ---------- Pagination ----------
	limit := 20
	offset := 0

	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}
	if o := r.URL.Query().Get("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	// ============================================================
	// 1️GROUP QUERY (Fast + Flat)
	// ============================================================

	type GroupResponse struct {
		ID              uint   `json:"id"`
		Name            string `json:"name"`
		Handle          string `json:"handle"`
		Description     string `json:"description"`
		Type            string `json:"type"`
		Country         string `json:"country"`
		State           string `json:"state"`
		City            string `json:"city"`
		AuthorityEmail  string `json:"authorityEmail"`
		SubscriberCount int64  `json:"subscriberCount"`
		IsJoined        bool   `json:"isJoined"`

		CreatorID    uint   `json:"-"`
		CreatorName  string `json:"-"`
		CreatorEmail string `json:"-"`
	}

	var group GroupResponse

	err = db.DB.
		Table("groups g").
		Select(`
			g.id,
			g.name,
			g.handle,
			g.description,
			g.type,
			g.country,
			g.state,
			g.city,
			g.authority_email,
			g.subscriber_count,
			u.id   as creator_id,
			u.name as creator_name,
			u.email as creator_email
		`).
		Joins("LEFT JOIN users u ON u.id = g.creator_id").
		Where("g.id = ? AND g.deleted_at IS NULL", groupID).
		Scan(&group).Error

	if err != nil || group.ID == 0 {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	// ---------- Check Join (Index Fast) ----------
	var exists bool
	db.DB.
		Table("group_data").
		Select("1").
		Where("group_id = ? AND user_id = ?", groupID, userID).
		Limit(1).
		Scan(&exists)

	group.IsJoined = exists

	// ============================================================
	// 2️POSTS QUERY (NO MORE N+1 🔥)
	// ============================================================

	type PostResponse struct {
		ID           uint      `json:"id"`
		Content      string    `json:"content"`
		UserID       uint      `json:"user_id"`
		UserName     string    `json:"user_name"`
		GroupID      uint      `json:"group_id"`
		CreatedAt    time.Time `json:"created_at"`
		ShareToken   string    `json:"share_token"`
		Upvotes      int64     `json:"upvotes"`
		Downvotes    int64     `json:"downvotes"`
		ResolveCount int64     `json:"resolve_count"`
		CommentCount int64     `json:"comment_count"`
	}

	var posts []PostResponse

	err = db.DB.
		Table("posts p").
		Select(`
			p.id,
			p.content,
			p.user_id,
			p.group_id,
			p.created_at,
			p.share_token,
			u.name as user_name,

			COALESCE(SUM(CASE WHEN v.vote_type = 1 THEN 1 ELSE 0 END),0) as upvotes,
			COALESCE(SUM(CASE WHEN v.vote_type = -1 THEN 1 ELSE 0 END),0) as downvotes,
			COUNT(DISTINCT r.id) as resolve_count,
			COUNT(DISTINCT c.id) as comment_count
		`).
		Joins("LEFT JOIN users u ON u.id = p.user_id").
		Joins("LEFT JOIN post_votes v ON v.post_id = p.id AND v.deleted_at IS NULL").
		Joins("LEFT JOIN post_resolves r ON r.post_id = p.id AND r.deleted_at IS NULL").
		Joins("LEFT JOIN comments c ON c.post_id = p.id AND c.deleted_at IS NULL").
		Where("p.group_id = ? AND p.deleted_at IS NULL", groupID).
		Group("p.id, u.name").
		Order("p.created_at DESC").
		Limit(limit).
		Offset(offset).
		Scan(&posts).Error

	if err != nil {
		log.Println("Post fetch error:", err)
		http.Error(w, "Failed to fetch posts", http.StatusInternalServerError)
		return
	}

	// ============================================================
	// 3️ Final JSON
	// ============================================================

	response := map[string]interface{}{
		"group": group,
		"posts": posts,
		"pagination": map[string]interface{}{
			"limit":  limit,
			"offset": offset,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}