package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

var (
	AWSRegion string
	S3Bucket  string
)

func init() {
	err := godotenv.Load("../../.env")
	if err != nil {
		log.Println("Error loading .env file")
	}

	AWSRegion = os.Getenv("AWS_REGION")
	S3Bucket = os.Getenv("AWS_S3_BUCKET")
}

func AWSGet(key string) string {
	return os.Getenv(key)
}