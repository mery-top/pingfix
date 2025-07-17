package auth

import(
	"log"
	"net/http"
	"github.com/markbates/goth/gothic"
)

func BeginAuth(w http.ResponseWriter, r *http.Request){
	gothic.BeginAuthHandler(w,r)
}

func Callback(w http.ResponseWriter, r *http.Request){
	_, err:=gothic.CompleteUserAuth(w, r)
	if err!= nil{
		log.Fatal(err)
		http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
		return
	}
	http.Redirect(w, r, "http://localhost:5173/dashboard", http.StatusSeeOther)

}

func Logout(w http.ResponseWriter, r *http.Request){
	gothic.Logout(w,r)
	w.Write([]byte("Successfully Logged Out"))
}