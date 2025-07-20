package utils

import (
	"gopkg.in/gomail.v2"
)

func SendEmail(to, subject, body string) error{
	m:= gomail.NewMessage()
	m.SetHeader("From", "example")
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)
	m.SetBody("text/plain", body)

	d:= gomail.NewDialer("smtp.gmail.com",587, "your_email@gmail.com", "your_app_password")
	return d.DialAndSend(m)
}