package utils

import (
	"backend/config"
	"errors"
	"strings"

	"gopkg.in/gomail.v2"
)

func SendEmail(to, subject, body string) error{
	from := strings.TrimSpace(config.Get("EMAIL"))
	appPassword := strings.TrimSpace(config.Get("EMAIL_APP_PASSWORD"))
	if from == "" || appPassword == "" {
		return errors.New("email credentials are not configured")
	}

	m:= gomail.NewMessage()
	m.SetHeader("From", from)
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)
	m.SetBody("text/plain", body)

	d:= gomail.NewDialer("smtp.gmail.com",587, from, appPassword)
	return d.DialAndSend(m)
}
