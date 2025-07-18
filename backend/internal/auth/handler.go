package auth

import (
	"backend/database/db"
	"backend/database/migrate"
	"backend/models"
	"encoding/json"
	"log"
	"net/http"

	"github.com/markbates/goth/gothic"
	"golang.org/x/crypto/bcrypt"
)

func BeginAuth(w http.ResponseWriter, r *http.Request){
	gothic.BeginAuthHandler(w,r)
}

func Callback(w http.ResponseWriter, r *http.Request){
	user, err:=gothic.CompleteUserAuth(w, r)
	if err!= nil{
		log.Fatal(err)
		http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
		return
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("Google2025#"), bcrypt.DefaultCost)

	migrate.Migrate(user.Name, user.Email, string(hashedPassword))
	
	http.Redirect(w, r, "http://localhost:5173/dashboard", http.StatusSeeOther)

}

func Register(w http.ResponseWriter, r *http.Request){
	var user struct{
		Name string `json:"name"`
		Email string `json:"email"`
		Password string `json:"password"`
	}

	json.NewDecoder(r.Body).Decode(&user)
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)

	migrate.Migrate(user.Name, user.Email, string(hashedPassword))

	w.WriteHeader(http.StatusCreated)
}

func Login(w http.ResponseWriter, r *http.Request){
	var body struct{
		Email string `json:"email"`
		Password string `json:"password"`
	}

	json.NewDecoder(r.Body).Decode(&body)

	var user models.User
	result:= db.DB.First(&user, "email = ?", body.Email)

	if result.Error!=nil{
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	err:= bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(body.Password))
	if err!=nil{
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	session, _ := db.Store.Get(r,"session")
	session.Values["user_id"] = user.ID
	session.Save(r,w)

	w.Write([]byte("Logged IN SUCCESS"))
}



func GLogout(w http.ResponseWriter, r *http.Request){
	gothic.Logout(w,r)
	w.Write([]byte("Successfully Logged Out"))
}

func Logout(w http.ResponseWriter, r *http.Request){
	session, _:= db.Store.Get(r, "session")
	delete(session.Values, "user_id")
	session.Save(r,w)
	w.Write([]byte("Logged OUT"))
}