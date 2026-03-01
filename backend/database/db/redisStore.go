package db

import (
	"fmt"
	"log"
	"net/http"

	"backend/config"

	"github.com/boj/redistore"
	"github.com/gorilla/sessions"
	"github.com/markbates/goth/gothic"
)

var Store *redistore.RediStore

func StoreInit() {

	redisHost := config.Get("REDIS_HOST")
	redisPassword := config.Get("REDIS_PASSWORD")
	redisSecret := config.Get("REDIS_DB_SECRET")
	sessionSecret := config.Get("SESSION_SECRET")

	var err error
	Store, err = redistore.NewRediStore(
		10,                 // pool size
		"tcp",              
		redisHost,          
		redisPassword,      
		redisSecret,        
		[]byte(sessionSecret),
	)

	if err != nil {
		log.Fatal("RedisStore FAILED:", err)
	}

	fmt.Println("Connected RedisStore")

	Store.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   172800, // 2 days
		HttpOnly: true,
		Secure:   false, // change to true in production (HTTPS)
		SameSite: http.SameSiteLaxMode,
	}

	gothic.Store = Store
}