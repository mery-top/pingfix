package main

import(
	"log"
	"net/http"
	"backend/config"
	"backend/internal/routes"
)

func main(){
	config.LoadEnv()

	r:= routes.SetupRouter()
	log.Println("Server started at 8080")
	log.Fatal(http.ListenAndServe(":8080",r))
}