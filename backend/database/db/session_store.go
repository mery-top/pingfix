package db

import (
	"context"
	"encoding/gob"
	"log"
	"net/http"
	"os"

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

	// Cookie store for signing only
	Store = sessions.NewCookieStore([]byte(sessionSecret))
	Store.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   172800,
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
	}

	gothic.Store = Store
}