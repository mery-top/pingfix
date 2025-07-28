package db

import (
	"backend/models"
)

func CreateUser(name, email, hashedPassword string){
	newUser := models.User{
		Name:     name,
		Email:    email,
		Password: hashedPassword,
	}
	
	DB.Create(&newUser)
}