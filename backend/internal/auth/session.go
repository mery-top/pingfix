package auth

import(
	"net/http"
	"backend/database/db"
)


func SessionInit(){
	db.StoreInit()
	var Store = db.Store
	Store.Options.MaxAge= 86000 * 30
	Store.Options.Path = "/"
	Store.Options.HttpOnly = true
	Store.Options.SameSite = http.SameSiteNoneMode
	Store.Options.Secure = false
}