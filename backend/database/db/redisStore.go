package db

import (
	"log"

	"github.com/boj/redistore"
)

var Store *redistore.RediStore

func StoreInit(){
	var err error
	Store, err= redistore.NewRediStore(10, "tcp", "localhost:6379", "", "myredis",[]byte("SECRET"))
	if err!=nil{
		log.Printf(err.Error())
	}
}