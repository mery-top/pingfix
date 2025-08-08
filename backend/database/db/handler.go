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

func CreateGroup(name, description, handle, location, authorityEmail string, userID int){
	newGroup:= models.Group{
		Name: name,
		Description: description,
		Handle: handle,
		Location: location,
		AuthorityEmail: authorityEmail,
		CreatorID: uint(userID),
	}

	DB.Create(&newGroup)
}