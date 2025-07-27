package utils

import (
	"backend/config"

	"gopkg.in/gomail.v2"
)

func SendEmail(to, subject, body string) error{
	m:= gomail.NewMessage()
	m.SetHeader("From", config.Get("EMAIL"))
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)
	m.SetBody("text/plain", body)

	d:= gomail.NewDialer("smtp.gmail.com",587, config.Get("EMAIL"), config.Get("EMAIL_APP_PASSWORD"))
	return d.DialAndSend(m)
}