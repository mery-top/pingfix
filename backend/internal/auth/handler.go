package auth

import(
	"log"
	"net/http"
	"github.com/markbates/goth/gothic"
	"backend/database/migrate"
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

func Logout(w http.ResponseWriter, r *http.Request){
	gothic.Logout(w,r)
	w.Write([]byte("Successfully Logged Out"))
}

