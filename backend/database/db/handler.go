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

func CreateGroup(name, description, handle,country, state, city , authorityEmail string, userID int){
	newGroup:= models.Group{
		Name: name,
		Description: description,
		Handle: handle,
		Country: country,
		State: state,
		City: city,
		AuthorityEmail: authorityEmail,
		CreatorID: uint(userID),
	}

	DB.Create(&newGroup)
}