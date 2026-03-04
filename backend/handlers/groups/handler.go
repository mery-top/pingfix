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

	"backend/utils"
	"strings"

	"github.com/gorilla/mux"
	"gorm.io/gorm"
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
	cursor := r.URL.Query().Get("cursor")
	limit := 10

	session, _ := db.Store.Get(r, "session")
	userID, ok := session.Values["user_id"].(uint)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	type GroupResponse struct {
		ID              uint    `json:"ID"`
		Name            string  `json:"Name"`
		Handle          string  `json:"Handle"`
		Country         string  `json:"Country"`
		State           string  `json:"State"`
		City            string  `json:"City"`
		Description     string  `json:"Description"`
		Type            string  `json:"Type"`
		SubscriberCount int     `json:"SubscriberCount"`
		IsJoined        bool    `json:"isJoined"`
		Rank            float64 `json:"-"`
	}

	query := db.DB.Table("groups g").
		Joins("LEFT JOIN group_data gd ON gd.group_id = g.id AND gd.user_id = ?", userID).
		Where("g.deleted_at IS NULL")

	// ---------- Search Ranking ----------
	if handle != "" {
		query = query.
			Select(`
				g.id,
				g.name,
				g.handle,
				g.country,
				g.state,
				g.city,
				g.description,
				g.type,
				g.subscriber_count,
				CASE WHEN gd.user_id IS NOT NULL THEN true ELSE false END AS is_joined,
				similarity(g.handle, ?) as rank
			`, handle).
			Where("g.handle ILIKE ?", "%"+handle+"%").
			Order("rank DESC, g.subscriber_count DESC")
	} else {
		query = query.
			Select(`
				g.id,
				g.name,
				g.handle,
				g.country,
				g.state,
				g.city,
				g.description,
				g.type,
				g.subscriber_count,
				CASE WHEN gd.user_id IS NOT NULL THEN true ELSE false END AS is_joined
			`).
			Order("g.subscriber_count DESC")
	}

	if country != "" {
		query = query.Where("g.country ILIKE ?", "%"+country+"%")
	}
	if state != "" {
		query = query.Where("g.state ILIKE ?", "%"+state+"%")
	}
	if city != "" {
		query = query.Where("g.city ILIKE ?", "%"+city+"%")
	}

	// -------- Keyset Pagination --------
	if cursor != "" {
		parts := strings.Split(cursor, ",")
		if len(parts) == 2 {
			lastCount, _ := strconv.Atoi(parts[0])
			lastID, _ := strconv.Atoi(parts[1])
			query = query.Where("(g.subscriber_count, g.id) < (?, ?)", lastCount, lastID)
		}
	}

	var groups []GroupResponse
	err := query.
		Limit(limit).
		Scan(&groups).Error

	if err != nil {
		http.Error(w, "Error fetching groups", http.StatusInternalServerError)
		return
	}

	// ---------- Next Cursor ----------
	var nextCursor string
	if len(groups) == limit {
		last := groups[len(groups)-1]
		nextCursor = fmt.Sprintf("%d,%d", last.SubscriberCount, last.ID)
	}

	response := map[string]interface{}{
		"data":       groups,
		"nextCursor": nextCursor,
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
	userID, ok := session.Values["user_id"].(uint)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	tx := db.DB.Begin()

	// --------------------------------------------------
	// 1️ Insert with ON CONFLICT DO NOTHING
	// --------------------------------------------------

	result := tx.Exec(`
		INSERT INTO group_data (group_id, user_id, joined_at)
		VALUES (?, ?, NOW())
		ON CONFLICT (group_id, user_id) DO NOTHING
	`, req.GroupID, userID)

	if result.Error != nil {
		tx.Rollback()
		http.Error(w, "Failed to join group", http.StatusInternalServerError)
		return
	}

	// --------------------------------------------------
	// 2️ Only update count if new row inserted
	// --------------------------------------------------

	if result.RowsAffected > 0 {
		if err := tx.Exec(`
			UPDATE groups
			SET subscriber_count = subscriber_count + 1
			WHERE id = ?
		`, req.GroupID).Error; err != nil {
			tx.Rollback()
			http.Error(w, "Failed to update subscriber count", http.StatusInternalServerError)
			return
		}
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

	tx := db.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Get only creator_id (no full struct load)
	var creatorID uint
	err := tx.Model(&models.Group{}).
		Select("creator_id").
		Where("id = ?", req.GroupID).
		Take(&creatorID).Error

	if err != nil {
		tx.Rollback()
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	// Prevent creator leaving
	if creatorID == userID {
		tx.Rollback()
		http.Error(w, "Creator cannot leave their own group", http.StatusForbidden)
		return
	}

	// Delete membership (returns affected rows)
	result := tx.
		Where("user_id = ? AND group_id = ?", userID, req.GroupID).
		Delete(&models.GroupData{})

	if result.Error != nil {
		tx.Rollback()
		http.Error(w, "Failed to leave group", http.StatusInternalServerError)
		return
	}

	// If user was not a member → do nothing
	if result.RowsAffected == 0 {
		tx.Rollback()
		http.Error(w, "Not a member of this group", http.StatusBadRequest)
		return
	}

	// Atomic decrement (no negative values)
	err = tx.Model(&models.Group{}).
		Where("id = ?", req.GroupID).
		UpdateColumn("subscriber_count",
			gorm.Expr("GREATEST(subscriber_count - 1, 0)")).Error

	if err != nil {
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
	// 1️⃣ Fetch group info + creator
	// ============================================================
	type CreatorInfo struct {
		ID    uint   `json:"id"`
		Name  string `json:"name"`
		Email string `json:"email"`
	}

	type GroupResponse struct {
		ID              uint        `json:"id"`
		Name            string      `json:"name"`
		Handle          string      `json:"handle"`
		Description     string      `json:"description"`
		Type            string      `json:"type"`
		Country         string      `json:"country"`
		State           string      `json:"state"`
		City            string      `json:"city"`
		AuthorityEmail  string      `json:"authorityEmail"`
		SubscriberCount int         `json:"subscriberCount"`
		IsJoined        bool        `json:"isJoined"`
		CreatorID       uint        `json:"-"`
		CreatorName     string      `json:"-"`
		CreatorEmail    string      `json:"-"`
		Creator         CreatorInfo `json:"creator" gorm:"-"`
	}

	var group GroupResponse

	// Fetch group + creator info
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
			u.id as creator_id,
			COALESCE(u.name,'Unknown') as creator_name,
			COALESCE(u.email,'') as creator_email,
			g.subscriber_count
		`).
		Joins("LEFT JOIN users u ON u.id = g.creator_id AND u.deleted_at IS NULL").
		Where("g.id = ? AND g.deleted_at IS NULL", groupID).
		Scan(&group).Error

	if err != nil || group.ID == 0 {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	// ---------- Check if current user is joined ----------
	var count int64
	db.DB.Table("group_data").Where("group_id = ? AND user_id = ?", groupID, userID).Count(&count)
	group.IsJoined = count > 0

	// Map creator info explicitly
	group.Creator = CreatorInfo{
		ID:    group.CreatorID,
		Name:  group.CreatorName,
		Email: group.CreatorEmail,
	}

	// ============================================================
	// 2️⃣ Fetch posts efficiently
	// ============================================================
	var rawPosts []models.Post
	err = db.DB.
		Preload("User").
		Preload("Group").
		Preload("Images").
		Preload("Links").
		Preload("Tags").
		Where("group_id = ?", groupID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&rawPosts).Error

	if err != nil {
		log.Println("Failed to fetch posts:", err)
		http.Error(w, "Failed to fetch posts", http.StatusInternalServerError)
		return
	}

	var posts []models.PostResponse
	for _, p := range rawPosts {
		posts = append(posts, models.PostResponse{
			Post:         p,
			Upvotes:      p.UpvoteCount,
			Downvotes:    p.DownvoteCount,
			Comments:     p.CommentCount,
			ResolveCount: p.ResolveCount,
			UserResolved: false,
			ShareURL:     utils.BuildShareURL(p.ShareToken),
		})
	}

	// ============================================================
	// 3️⃣ Send response (frontend-friendly)
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
