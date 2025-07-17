package auth

import(
	"net/http"
	"github.com/gorilla/sessions"
)

var Store = sessions.NewCookieStore([]byte("secret"))

func SessionInit(){
	Store.MaxAge(86000 * 30)
	Store.Options.Path = "/"
	Store.Options.HttpOnly = true
	Store.Options.SameSite = http.SameSiteNoneMode
	Store.Options.Secure = false
}