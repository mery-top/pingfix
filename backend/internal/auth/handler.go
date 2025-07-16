package auth

import(
	"fmt"
	"net/http"
	"github.com/markbates/goth/gothic"
)

func BeginAuth(w http.ResponseWriter, r *http.Request){
	gothic.BeginAuthHandler(w,r)
}

func Callback(w http.ResponseWriter, r *http.Request){
	user, err:=gothic.CompleteUserAuth(w, r)
	if err!= nil{
		http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
		return
	}
	fmt.Fprintf(w, "Welcome %s: %s", user.Name, user.Email)
}

func Logout(w http.ResponseWriter, r *http.Request){
	gothic.Logout(w,r)
	w.Write([]byte("Successfully Logged Out"))
}