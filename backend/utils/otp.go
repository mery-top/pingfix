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


func VerifyOTP(w http.ResponseWriter, r *http.Request){
	var req struct{
		Email string `json:"email"`
		OTP   string `json:"otp"`
	}

	if err:= json.NewDecoder(r.Body).Decode(&req); err!=nil{
		http.Error(w,"Invalid Request" ,http.StatusBadRequest)
		return 
	}

	otpStore, err:= db.Store.Get(r, "otp")
	if err!=nil{
		http.Error(w, "Session Error", http.StatusInternalServerError)
		return 
	}

	storedOTP, ok:= otpStore.Values[req.Email]

	if !ok{
		http.Error(w, "Invalid Session", http.StatusUnauthorized)
		return 
	}

	if storedOTP != req.OTP{
		http.Error(w, "Invalid OTP", http.StatusUnauthorized)
		return 
	}

	delete(otpStore.Values, req.Email)
	otpStore.Save(r,w)

	w.WriteHeader(http.StatusOK)

	return 
}


func SendOTP( w http.ResponseWriter, r *http.Request){
	//OTP
	var body struct{
		Email string `json:"email"`
	}

	if err:=json.NewDecoder(r.Body).Decode(&body); err!=nil{
		http.Error(w, "Invalid Reuqest", http.StatusBadRequest)
		return 
	}

	otp:= GenerateOTP()
	otpStore, err := db.Store.Get(r,"otp")
	if err!=nil{
		fmt.Println(err)
	}
	otpStore.Values[body.Email] = otp
	otpStore.Save(r,w)

	otp_err:= SendEmail(body.Email, "Your OTP Code", "Your OTP is: "+otp)

	if otp_err != nil {
		log.Println("Error sending OTP:", err)
		http.Error(w, "Failed to send OTP", http.StatusInternalServerError)
		return 
	}

	return 
}

/*
The idea here is to combine the sendOTP into register and make it as one endpoint 
and verifyOTP at another endpoint

*/