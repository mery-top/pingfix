package config

import "os"

var (
	AWSRegion string
	S3Bucket  string
)

func Init() {
	AWSRegion = os.Getenv("AWS_REGION")
	S3Bucket = os.Getenv("AWS_S3_BUCKET")
}

func AWSGet(key string) string {
	return os.Getenv(key)
}