package auth

import(
	"net/http"
	"github.com/markbates/goth"
	"github.com/markbates/goth/providers/google"
	"github.com/gorilla/sessions"
	"github.com/markbates/goth/gothic"
	"backend/config"
)

var store = sessions.NewCookieStore([]byte("secret"))

func InitProviders(){
	store.MaxAge(86000 * 30)
	store.Options.Path = "/"
	store.Options.HttpOnly = true
	store.Options.SameSite = http.SameSiteNoneMode
	store.Options.Secure = false

	gothic.Store = store
	goth.UseProviders(
		google.New(
			config.Get("GOOGLE_CLIENT_ID"),
			config.Get("GOOGLE_CLIENT_SECRET"),
			config.Get("CALLBACK_URL"),
			"email", "profile",
		),
	)
}
