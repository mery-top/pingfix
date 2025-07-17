package auth

import(
	"net/http"
	"github.com/gorilla/sessions"
)

var store = sessions.NewCookieStore([]byte("secret"))

func SessionInit(){
	store.MaxAge(86000 * 30)
	store.Options.Path = "/"
	store.Options.HttpOnly = true
	store.Options.SameSite = http.SameSiteNoneMode
	store.Options.Secure = false
}