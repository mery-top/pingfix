package utils

import (
	"bytes"
	"context"
	"fmt"
	"mime/multipart"

	"backend/config"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"

)

var S3Bucket = config.S3Bucket
var S3Region = config.AWSRegion 


func UploadToS3(file multipart.File, fileName string) (string, error) {
	// Load AWS SDK config from env
	fmt.Println("AWS Region:", S3Region)
	fmt.Println("Bucket: ", S3Bucket)
	cfg, err := awsconfig.LoadDefaultConfig(context.TODO(),
    awsconfig.WithRegion(config.AWSRegion),
)
	if err != nil {
		return "", fmt.Errorf("unable to load AWS SDK config: %v", err)
	}

	client := s3.NewFromConfig(cfg)

	buf := new(bytes.Buffer)
	_, err = buf.ReadFrom(file)
	if err != nil {
		return "", err
	}

	key := "posts/" + fileName

	_, err = client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket: aws.String(S3Bucket),
		Key:    aws.String(key),
		Body:   bytes.NewReader(buf.Bytes()),
		ContentType: aws.String("image/jpeg"),  // detect dynamically if needed
	})
	if err != nil {
		return "", err
	}

	// Return public URL
	url := fmt.Sprintf("https://%s.s3.%s.amazonaws.com/%s", S3Bucket, S3Region, key)
	return url, nil
}