package db

import (
	"fmt"
	"log"
	"net/http"

	"github.com/boj/redistore"
	"github.com/gorilla/sessions"
	"github.com/markbates/goth/gothic"
)

var Store *redistore.RediStore

func StoreInit() {
	var err error
	Store, err = redistore.NewRediStore(10, "tcp", "localhost:6379", "", "myredis", []byte("SECRET"))
	if err != nil {
		log.Printf("%v", err)
	}
	fmt.Printf("Connected RedisStore\n")

	Store.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   172800, // 2 days
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
	}
	gothic.Store = Store
}
