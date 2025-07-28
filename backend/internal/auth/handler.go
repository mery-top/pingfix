package auth

import (
	"backend/database/db"
	"backend/models"
	"backend/utils"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"
	"fmt"
	"github.com/markbates/goth/gothic"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func BeginAuth(w http.ResponseWriter, r *http.Request){
	gothic.BeginAuthHandler(w,r)
}

func Callback(w http.ResponseWriter, r *http.Request){
	user, err:=gothic.CompleteUserAuth(w, r)

	if err!= nil{
		log.Println("Google auth error:", err)
		http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
		return
	}

	var LogUser models.User
	result:= db.DB.First(&LogUser, "email=?", user.Email)
	if result.Error !=nil{
		if errors.Is(result.Error, gorm.ErrRecordNotFound){
			hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("Google2025#"), bcrypt.DefaultCost)
			db.CreateUser(user.Name, user.Email, string(hashedPassword))
		}else{
			http.Error(w, "Something went wrong", http.StatusInternalServerError)
            return
		}
	}

	session, _ := db.Store.Get(r,"session")
	session.Values["user_id"] = LogUser.ID
	session.Values["authenticated"] = true
	
	session.Save(r,w)
	http.Redirect(w,r, "http://localhost:5173/dashboard",http.StatusTemporaryRedirect)
	w.WriteHeader(http.StatusOK)

}

func Register(w http.ResponseWriter, r *http.Request){
	var user struct{
		Name string `json:"name"`
		Email string `json:"email"`
		Password string `json:"password"`
	}
	log.Println("Register endpoint hit")


	json.NewDecoder(r.Body).Decode(&user)
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)

	var existingUser models.User

	result:= db.DB.First(&existingUser, "email = ?", user.Email)

	if result.Error ==nil{
		http.Error(w, "User Already Exists", http.StatusConflict)
		return
	}

	db.CreateUser(user.Name, user.Email, string(hashedPassword))
	
	w.WriteHeader(http.StatusCreated)
}

func Login(w http.ResponseWriter, r *http.Request){
	fmt.Println("Login Endpoint hit")
	var body struct{
		Email string `json:"email"`
		Password string `json:"password"`
	}

	errr:=json.NewDecoder(r.Body).Decode(&body)
	if errr!=nil{
		fmt.Println("Error parsing JSON")
	}

	fmt.Printf("Parsed body: %+v\n", body)

	var user models.User

	if !utils.ValidEmail(body.Email){
		fmt.Println("Email Missmatch")
		http.Error(w, "Invalid Email", http.StatusUnauthorized)
		return
	}
	email := strings.TrimSpace(body.Email)
    password := strings.TrimSpace(body.Password)
	result:= db.DB.First(&user, "email = ?", email)

	if result.Error!=nil{
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	err:= bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err!=nil{
		fmt.Println("PASSWORD NOT MATCH")
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	session, err := db.Store.Get(r,"session")
	if err!=nil{
		fmt.Println(err)
	}
	session.Values["user_id"] = user.ID
	session.Values["authenticated"] = true
	session.Save(r,w)

	w.WriteHeader(http.StatusOK)
	
}

func GLogout(w http.ResponseWriter, r *http.Request){
	gothic.Logout(w,r)
	w.Write([]byte("Successfully Logged Out"))
}

func Logout(w http.ResponseWriter, r *http.Request){
	session, _:= db.Store.Get(r, "session")
	session.Options.MaxAge = -1
	
	delete(session.Values, "user_id")
	session.Save(r,w)
	w.Write([]byte("Logged OUT"))
}


func CheckAuthStatus(w http.ResponseWriter, r *http.Request){
	fmt.Println("Check Status Endpoint Hit")
	session, err:= db.Store.Get(r, "session")
	if(err!=nil){
		log.Fatal("Session Error", err)
		return
	}
	auth, ok:= session.Values["authenticated"].(bool)
	fmt.Println("Session authenticated:", auth, "ok:", ok)

	if auth && ok{
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Authenticated"))
	}else{
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

}