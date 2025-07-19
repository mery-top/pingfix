package db

import (
	"log"
	"fmt"
	"github.com/gorilla/sessions"
	"github.com/boj/redistore"
	"net/http"
	"github.com/markbates/goth/gothic"
)

var Store *redistore.RediStore

func StoreInit(){
	var err error
	Store, err= redistore.NewRediStore(10, "tcp", "localhost:6379", "", "myredis",[]byte("SECRET"))
	if err!=nil{
		log.Printf(err.Error())
	}
	fmt.Printf("Connected RedisStore\n")

	Store.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   86400 * 7,
		HttpOnly: true,
		Secure:   false, 
		SameSite: http.SameSiteLaxMode,
	}
	gothic.Store = Store
}