package routes

import(
	"net/http"

	"github.com/gorilla/mux"
	"backend/internal/auth"
	"backend/internal/middleware"
)

func SetupRouter() *mux.Router{
	auth.InitProviders()
	r:= mux.NewRouter()
	r.Use(middleware.CORS)

	r.HandleFunc("/auth/{provider}", auth.BeginAuth).Methods("GET")
	r.HandleFunc("/auth/{provider}/callback", auth.Callback).Methods("GET", "POST")
	r.HandleFunc("/logout", auth.Logout).Methods("GET")

	r.HandleFunc("/api/public", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Public Route is Working"))
	}).Methods("GET")

	return r

}