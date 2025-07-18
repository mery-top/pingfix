package auth

import(
	"backend/database/db"
	"github.com/markbates/goth"
	"github.com/markbates/goth/providers/google"
	"github.com/markbates/goth/gothic"
	"backend/config"
)


func InitProviders(){
	gothic.Store = db.Store
	goth.UseProviders(
		google.New(
			config.Get("GOOGLE_CLIENT_ID"),
			config.Get("GOOGLE_CLIENT_SECRET"),
			config.Get("CALLBACK_URL"),
			"email", "profile",
		),
	)
}
