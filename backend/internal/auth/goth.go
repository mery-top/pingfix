package auth

import(
	"github.com/markbates/goth"
	"github.com/markbates/goth/providers/google"
	"backend/config"
)


func InitProviders(){
	
	goth.UseProviders(
		google.New(
			config.Get("GOOGLE_CLIENT_ID"),
			config.Get("GOOGLE_CLIENT_SECRET"),
			config.Get("CALLBACK_URL"),
			"email", "profile",
		),
	)
}
