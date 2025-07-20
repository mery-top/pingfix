package utils

import (
	"backend/database/db"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"net/http"
)

func GenerateOTP() string{
	otp, err := rand.Int(rand.Reader, big.NewInt(1000000))
	if err!=nil{
		log.Print(err)
	}
	return fmt.Sprintf("%06d", otp.Int64())
}


func VerifyOTP(w http.ResponseWriter, r *http.Request) error{
	var req struct{
		Email string `json:"email"`
		OTP   string `json:"otp"`
	}

	if err:= json.NewDecoder(r.Body).Decode(&req); err!=nil{
		http.Error(w,"Invalid Request" ,http.StatusBadRequest)
		return err
	}

	otpStore, err:= db.Store.Get(r, "otp")
	if err!=nil{
		http.Error(w, "Session Error", http.StatusInternalServerError)
		return err
	}

	storedOTP, ok:= otpStore.Values[req.Email]

	if !ok{
		http.Error(w, "Invalid Session", http.StatusUnauthorized)
		return err
	}

	if storedOTP != req.OTP{
		http.Error(w, "Invalid OTP", http.StatusUnauthorized)
		return err
	}

	delete(otpStore.Values, req.Email)
	otpStore.Save(r,w)

	w.WriteHeader(http.StatusOK)

	return nil
}


func SendOTP( w http.ResponseWriter, r *http.Request, email string) error{
	//OTP
	otp:= GenerateOTP()
	otpStore, err := db.Store.Get(r,"otp")
	if err!=nil{
		fmt.Println(err)
	}
	otpStore.Values[email] = otp
	otpStore.Save(r,w)

	otp_err:= SendEmail(email, "Your OTP Code", "Your OTP is"+otp)

	if otp_err != nil {
		log.Println("Error sending OTP:", err)
		http.Error(w, "Failed to send OTP", http.StatusInternalServerError)
		return otp_err
	}

	return nil
}