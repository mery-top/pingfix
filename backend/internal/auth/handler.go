package auth

import (
	"backend/database/db"
	"backend/database/migrate"
	"backend/models"
	"backend/utils"
	"encoding/json"
	"errors"
	"log"
	"net/http"
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
			migrate.Migrate(LogUser.Name, LogUser.Email, string(hashedPassword))
			w.Write([]byte("Sign IN SUCCESS"))
			return
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
	w.Write([]byte("Logged IN SUCCESS"))

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

	if !utils.ValidEmail(user.Email){
		http.Error(w, "Invalid Email", http.StatusUnauthorized)
		return
	}

	if !utils.ValidName(user.Name){
		http.Error(w, "Invalid Name", http.StatusUnauthorized)
		return
	}

	var existingUser models.User

	result:= db.DB.First(&existingUser, "email = ?", user.Email)

	if result.Error ==nil{
		http.Error(w, "Invalid credentials", http.StatusConflict)
		return
	}

	err:= utils.SendOTP(w,r, user.Email)
	if err!=nil{
		http.Error(w, "Error Sending OTP", http.StatusInternalServerError)
		return
	}

	otpError:= utils.VerifyOTP(w,r)
	if otpError!=nil{
		http.Error(w, "Error Verifying OTP", http.StatusInternalServerError)
		return
	}
	
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

	if !utils.ValidEmail(body.Email){
		http.Error(w, "Invalid Email", http.StatusUnauthorized)
		return
	}

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
	// csrfToken:= csrf.Token(r)

	session, err := db.Store.Get(r,"session")
	if err!=nil{
		fmt.Println(err)
	}
	session.Values["user_id"] = user.ID
	session.Values["authenticated"] = true
	// session.Values["csrf"] = csrfToken
	session.Save(r,w)

	// w.Header().Set("X-CSRF-Token",csrfToken )
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Logged IN SUCCESS"))

	
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

// func SecureHandler(w http.ResponseWriter, r *http.Request){
// 	session, _:= db.Store.Get(r, "session")
// 	if auth, ok:= session.Values["authenticated"].(bool); !ok || !auth{
// 		http.Error(w, "Unauthorized", http.StatusUnauthorized)
// 		return
// 	}

// 	csrfToken:= r.Header.Get("X-CSRF-Token")
// 	expectedToken, _:= session.Values["csrf"].(string)

// 	if csrfToken != expectedToken{
// 		http.Error(w, "Unauthorized", http.StatusUnauthorized)
// 		return
// 	}
// 	w.Write([]byte("Secure Content Accessed"))
// }

func CheckAuthStatus(w http.ResponseWriter, r *http.Request){
	fmt.Println("Check Status Endpoint Hit")
	session, err:= db.Store.Get(r, "session")
	if(err!=nil){
		log.Fatal("Session Error", err)
		return
	}
	auth, ok:= session.Values["authenticated"].(bool)

	if auth && ok{
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Authenticated"))
	}else{
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

}