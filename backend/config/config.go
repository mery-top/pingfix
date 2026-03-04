package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

func LoadEnv() {
	// Only try loading .env if running locally (optional)
	if os.Getenv("DOCKER_ENV") == "" {
		err := godotenv.Load()
		if err != nil {
			log.Println("No .env file found, using system environment variables")
		}
	}
}

func Get(key string) string {
	return os.Getenv(key)
}