package auth

import (
	"backend/database/db"
	dbhandler "backend/database/handlers"
	"backend/models"
	"backend/utils"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
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

func BeginAuth(w http.ResponseWriter, r *http.Request) {
	gothic.BeginAuthHandler(w, r)
}

func Callback(w http.ResponseWriter, r *http.Request) {
	user, err := gothic.CompleteUserAuth(w, r)

	if err != nil {
		log.Println("Google auth error:", err)
		http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
		return
	}

	var LogUser models.User
	result := db.DB.First(&LogUser, "email=?", user.Email)

	//signup
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("Google2025#"), bcrypt.DefaultCost)
			dbhandler.CreateUser(user.Name, user.Email, string(hashedPassword))

			session, _ := db.Store.Get(r, "session")
			session.Options.MaxAge = -1
			session.Save(r, w)

			newSession, _ := db.Store.New(r, "session")
			newSession.Values["authenticated"] = true
			newSession.Values["user_id"] = LogUser.ID
			newSession.Save(r, w)

			http.Redirect(w, r, "http://localhost:5173/dashboard", http.StatusTemporaryRedirect)
			return
		} else {
			http.Error(w, "Something went wrong", http.StatusInternalServerError)
			return
		}
		//login
	} else if result.Error == nil {
		session, _ := db.Store.Get(r, "session")
		session.Options.MaxAge = -1
		session.Save(r, w)

		newSession, _ := db.Store.New(r, "session")
		newSession.Values["authenticated"] = true
		newSession.Values["user_id"] = LogUser.ID
		newSession.Save(r, w)

		http.Redirect(w, r, "http://localhost:5173/dashboard", http.StatusTemporaryRedirect)
		return
	}

	http.Redirect(w, r, "http://localhost:5173/home", http.StatusTemporaryRedirect)
}

func Register(w http.ResponseWriter, r *http.Request) {
	var user struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	log.Println("Register endpoint hit")

	json.NewDecoder(r.Body).Decode(&user)
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)

	var existingUser models.User

	result := db.DB.First(&existingUser, "email = ?", user.Email)

	if result.Error == nil {
		http.Error(w, "User Already Exists", http.StatusConflict)
		return
	}

	dbhandler.CreateUser(user.Name, user.Email, string(hashedPassword))

	w.WriteHeader(http.StatusCreated)
}

func Login(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Login Endpoint hit")
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	errr := json.NewDecoder(r.Body).Decode(&body)
	if errr != nil {
		fmt.Println("Error parsing JSON")
	}

	var user models.User

	if !utils.ValidEmail(body.Email) {
		fmt.Println("Email Missmatch")
		http.Error(w, "Invalid Email", http.StatusUnauthorized)
		return
	}
	email := strings.TrimSpace(body.Email)
	password := strings.TrimSpace(body.Password)
	result := db.DB.First(&user, "email = ?", email)

	if result.Error != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	loginLock.Lock()
	if loginAttempts[email] >= 5 {
		loginLock.Unlock()
		http.Error(w, "Too many login attempts. Please try again later.", http.StatusTooManyRequests)
		return
	}
	loginLock.Unlock()

	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		loginLock.Lock()
		loginAttempts[email]++
		// Simple window reset after 10 minutes
		go func(e string) {
			time.Sleep(10 * time.Minute)
			loginLock.Lock()
			delete(loginAttempts, e)
			loginLock.Unlock()
		}(email)
		loginLock.Unlock()

		fmt.Println("PASSWORD NOT MATCH")
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	loginLock.Lock()
	delete(loginAttempts, email)
	loginLock.Unlock()

	session, _ := db.Store.Get(r, "session")
	session.Options.MaxAge = -1
	session.Save(r, w)

	newSession, _ := db.Store.New(r, "session")
	newSession.Values["authenticated"] = true
	newSession.Values["user_id"] = user.ID
	newSession.Save(r, w)

	w.WriteHeader(http.StatusOK)

}

func GLogout(w http.ResponseWriter, r *http.Request) {
	gothic.Logout(w, r)
	w.Write([]byte("Successfully Logged Out"))
}

func Logout(w http.ResponseWriter, r *http.Request) {
	session, _ := db.Store.Get(r, "session")
	session.Options.MaxAge = -1

	delete(session.Values, "user_id")
	session.Save(r, w)
	w.Write([]byte("Logged OUT"))
}

func CheckAuthStatus(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Check Status Endpoint Hit")
	session, err := db.Store.Get(r, "session")
	if err != nil {
		log.Fatal("Session Error", err)
		return
	}
	auth, ok := session.Values["authenticated"].(bool)
	fmt.Println("Session authenticated:", auth, "ok:", ok)

	if auth && ok {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Authenticated"))
	} else {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

}
