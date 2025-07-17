package config

import(
	"log"
	"os"

	"github.com/joho/godotenv"
)

func LoadEnv(){
	err:= godotenv.Load("../../.env")
	if err!=nil{
		log.Println("Error Loading env")
	}
}

func Get(key string) string{
	return os.Getenv(key)
}