package utils

import (
	"regexp"
)

func ValidEmail(email string) bool{
	re:= regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	return re.MatchString(email)
}

func ValidName(name string) bool {
	re := regexp.MustCompile(`^[a-zA-Z]{2,}$`)
	return re.MatchString(name)
}

func ValidPassword(password string) bool {
	re := regexp.MustCompile(`^[a-zA-Z0-9._%+\-]{6,}$`)
	return re.MatchString(password)
}