package auth

import(
	"github.com/markbates/goth"
	"github.com/markbates/goth/providers/google"
	"github.com/gorilla/sessions"
	"github.com/markbates/goth/gothic"
	"backend/config"
)

var Store = sessions.NewCookieStore([]byte("secret"))

func InitProviders(){
	gothic.Store = Store
	goth.UseProviders(
		google.New(
			config.Get("GOOGLE_CLIENT_ID"),
			config.Get("GOOGLE_CLIENT_SECRET"),
			config.Get("CALLBACK_URL"),
			"email", "profile",
		),
	)
}
