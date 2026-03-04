package main

import (
	"backend/config"
	"backend/database/db"
	//"backend/database/migrate"
	"backend/internal/routes"
	"log"
	"net/http"
)

func main(){
	config.LoadEnv()
	db.InitRedis()
	db.DBInit()
	//migrate.Migrate()
	r:= routes.SetupRouter()

	log.Println("Server started at 8080")
	log.Fatal(http.ListenAndServe(":8080",r))
}