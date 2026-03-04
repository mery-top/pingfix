package auth

import (
	"backend/database/db"
	dbhandler "backend/database/handlers"
	"backend/models"
	"backend/utils"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/markbates/goth/gothic"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var (
	loginAttempts = make(map[string]int)
	loginLock     sync.Mutex
)

// -------------------- Google OAuth --------------------
func BeginAuth(w http.ResponseWriter, r *http.Request) {
	gothic.BeginAuthHandler(w, r)
}

func Callback(w http.ResponseWriter, r *http.Request) {
	oauthUser, err := gothic.CompleteUserAuth(w, r)
	if err != nil {
		log.Println("Google auth error:", err)
		http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
		return
	}

	email := strings.TrimSpace(oauthUser.Email)
	googleID := oauthUser.UserID // unique Google ID
	name := oauthUser.Name

	var dbUser models.User
	result := db.DB.First(&dbUser, "email = ? OR oauth_id = ?", email, googleID)

	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		// Create new OAuth user WITHOUT password
		dbUser = dbhandler.CreateUser(name, email, "", "google", googleID)
	} else if result.Error != nil {
		log.Println("DB error:", result.Error)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Create session
	session, _ := db.Store.New(r, "session")
	session.Values["authenticated"] = true
	session.Values["user_id"] = dbUser.ID
	session.Save(r, w)

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173" // fallback
	}
	http.Redirect(w, r, frontendURL+"/dashboard", http.StatusTemporaryRedirect)
}

func GLogout(w http.ResponseWriter, r *http.Request) {
	gothic.Logout(w, r)
	w.Write([]byte("Successfully Logged Out"))
}

// -------------------- Local registration/login --------------------
func Register(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.Password = strings.TrimSpace(req.Password)

	if !utils.ValidEmail(req.Email) {
		http.Error(w, "Invalid email", http.StatusBadRequest)
		return
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)

	var existing models.User
	if err := db.DB.First(&existing, "email = ?", req.Email).Error; err == nil {
		http.Error(w, "User already exists", http.StatusConflict)
		return
	}

	dbhandler.CreateUser(req.Name, req.Email, string(hashedPassword), "local", "")
	w.WriteHeader(http.StatusCreated)
}

func Login(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	password := strings.TrimSpace(req.Password)

	if !utils.ValidEmail(email) {
		http.Error(w, "Invalid email", http.StatusBadRequest)
		return
	}

	var user models.User
	if err := db.DB.First(&user, "email = ? AND auth_provider = ?", email, "local").Error; err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	// Rate limiting
	loginLock.Lock()
	if loginAttempts[email] >= 5 {
		loginLock.Unlock()
		http.Error(w, "Too many login attempts. Try later", http.StatusTooManyRequests)
		return
	}
	loginLock.Unlock()

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		loginLock.Lock()
		loginAttempts[email]++
		go func(e string) {
			time.Sleep(10 * time.Minute)
			loginLock.Lock()
			delete(loginAttempts, e)
			loginLock.Unlock()
		}(email)
		loginLock.Unlock()

		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	// Reset login attempts on success
	loginLock.Lock()
	delete(loginAttempts, email)
	loginLock.Unlock()

	session, _ := db.Store.New(r, "session")
	session.Values["authenticated"] = true
	session.Values["user_id"] = user.ID
	session.Save(r, w)

	w.WriteHeader(http.StatusOK)
}

// -------------------- Logout / Session check --------------------
func Logout(w http.ResponseWriter, r *http.Request) {
	session, _ := db.Store.Get(r, "session")
	session.Options.MaxAge = -1
	delete(session.Values, "user_id")
	session.Save(r, w)
	w.Write([]byte("Logged OUT"))
}

func CheckAuthStatus(w http.ResponseWriter, r *http.Request) {
	session, err := db.Store.Get(r, "session")
	if err != nil {
		http.Error(w, "Session error", http.StatusInternalServerError)
		return
	}

	auth, ok := session.Values["authenticated"].(bool)
	if auth && ok {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Authenticated"))
		return
	}

	http.Error(w, "Unauthorized", http.StatusUnauthorized)
}
