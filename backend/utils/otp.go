package utils

import (
	"crypto/rand"

	"fmt"
	"log"
	"math/big"
)

func GenerateOTP() string{
	otp, err := rand.Int(rand.Reader, big.NewInt(1000000))
	if err!=nil{
		log.Print(err)
	}
	return fmt.Sprintf("%06d", otp.Int64())
}


