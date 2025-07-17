package main

import (
	"backend/config"
	"backend/internal/middleware"
	"backend/internal/routes"
	"log"
	"net/http"
)

func main(){
	config.LoadEnv()

	router:= routes.SetupRouter()
	csrfRouter:= middleware.CSRF(router)
	
	log.Println("Server started at 8080")
	log.Fatal(http.ListenAndServe(":8080",csrfRouter))
}