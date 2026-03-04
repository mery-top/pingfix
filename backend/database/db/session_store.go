package db

import (
	"context"
	"encoding/gob"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/gorilla/sessions"
	"github.com/redis/go-redis/v9"
	"github.com/markbates/goth/gothic"

)

var (
	Rdb   *redis.Client
	Store *sessions.CookieStore // fallback signing
	ctx   = context.Background()
)

func InitRedis() {

	redisHost := os.Getenv("REDIS_HOST")
	redisPassword := os.Getenv("REDIS_PASSWORD")
	sessionSecret := os.Getenv("SESSION_SECRET")

	if redisHost == "" {
		log.Fatal("REDIS_HOST not set")
	}
	if sessionSecret == "" {
		log.Fatal("SESSION_SECRET not set")
	}

	// Register types for session storage
	gob.Register(map[string]interface{}{})

	Rdb = redis.NewClient(&redis.Options{
		Addr:     redisHost,
		Password: redisPassword,
		DB:       0,
	})

	// Test connection
	_, err := Rdb.Ping(ctx).Result()
	if err != nil {
		log.Fatal("Redis connection failed:", err)
	}

	log.Println("Connected to Redis (go-redis v9)")

	appEnv := strings.ToLower(strings.TrimSpace(os.Getenv("APP_ENV")))
	secureCookies := appEnv == "production"
	if secureOverride := strings.TrimSpace(os.Getenv("COOKIE_SECURE")); secureOverride != "" {
		if parsed, err := strconv.ParseBool(secureOverride); err == nil {
			secureCookies = parsed
		}
	}

	sameSite := http.SameSiteLaxMode
	if appEnv == "production" {
		sameSite = http.SameSiteNoneMode
	}
	switch strings.ToLower(strings.TrimSpace(os.Getenv("COOKIE_SAMESITE"))) {
	case "none":
		sameSite = http.SameSiteNoneMode
	case "lax":
		sameSite = http.SameSiteLaxMode
	case "strict":
		sameSite = http.SameSiteStrictMode
	}

	cookieDomain := strings.TrimSpace(os.Getenv("COOKIE_DOMAIN"))

	// Cookie store for signing only
	Store = sessions.NewCookieStore([]byte(sessionSecret))
	Store.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   172800,
		Domain:   cookieDomain,
		HttpOnly: true,
		Secure:   secureCookies,
		SameSite: sameSite,
	}

	gothic.Store = Store
}
