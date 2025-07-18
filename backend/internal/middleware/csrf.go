package middleware

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/csrf"
)

//SamesiteLax check
func CSRF(next http.Handler) http.Handler{
	csrfMiddleware:= csrf.Protect(
		[]byte("32-byte-long-auth-key"),
		csrf.Secure(false), 
		csrf.SameSite(csrf.SameSiteNoneMode),
		csrf.Path("/"),

	)

	return csrfMiddleware(next)
}

func GetCSRFToken(w http.ResponseWriter, r *http.Request){
	token:= csrf.Token(r)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"csrfToken":token,
	})
}