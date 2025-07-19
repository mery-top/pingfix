package main

import (
	"backend/config"
	"backend/database/db"
	"backend/internal/middleware"
	"backend/internal/routes"
	"log"
	"net/http"
)

func main(){
	config.LoadEnv()
	db.DBInit()
	db.StoreInit()
	router:= routes.SetupRouter()
	corsRouter:= middleware.CORS(router)
	// csrfRouter:= middleware.CSRF(corsRouter)
	
	log.Println("Server started at 8080")
	log.Fatal(http.ListenAndServe(":8080",corsRouter))
}