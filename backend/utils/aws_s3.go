package utils

import (
	"bytes"
	"context"
	"fmt"
	"mime/multipart"

	"backend/config"
	_ "image/png"
	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"

)

var S3Bucket = config.S3Bucket
var S3Region = config.AWSRegion 


func UploadToS3(file multipart.File, fileName string) (string, error) {
	// Compress and resize image to ~100 KB
	compressedData, contentType, err := CompressImage(file, fileName, 100)
	if err != nil {
		return "", err
	}

	// Load AWS config
	cfg, err := awsconfig.LoadDefaultConfig(context.TODO(), awsconfig.WithRegion(S3Region))
	if err != nil {
		return "", fmt.Errorf("unable to load AWS SDK config: %v", err)
	}

	client := s3.NewFromConfig(cfg)
	key := "posts/" + fileName

	_, err = client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket:      aws.String(S3Bucket),
		Key:         aws.String(key),
		Body:        bytes.NewReader(compressedData),
		ContentType: aws.String(contentType),
	})
	if err != nil {
		return "", err
	}

	url := fmt.Sprintf("https://%s.s3.%s.amazonaws.com/%s", S3Bucket, S3Region, key)
	return url, nil
}