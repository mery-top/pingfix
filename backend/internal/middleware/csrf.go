package middleware

import (
	"net/http"

	"github.com/gorilla/csrf"
)

func CSRFProtection(next http.Handler) http.Handler{

	csrfMiddleware:= csrf.Protect(
		[]byte("32-byte-long-auth-key"),
		csrf.Secure(false), 
		csrf.SameSite(csrf.SameSiteLaxMode),
	)

	return csrfMiddleware(next)
}