package utils

import (
	"crypto/rand"
	"net/http"
	"backend/database/db"
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

func VerifyOTP(){

}


func SendOTP( w http.ResponseWriter, r *http.Request, email string) error{
	//OTP
	otp:= GenerateOTP()
	session, err := db.Store.Get(r,"otp")
	if err!=nil{
		fmt.Println(err)
	}
	session.Values[email] = otp

	otp_err:= SendEmail(email, "Your OTP Code", "Your OTP is"+otp)

	if otp_err != nil {
		log.Println("Error sending OTP:", err)
		http.Error(w, "Failed to send OTP", http.StatusInternalServerError)
		return otp_err
	}

	return nil
}