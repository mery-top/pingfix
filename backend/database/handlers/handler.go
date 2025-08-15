package dbhandler

import (
	"backend/models"
	"backend/database/db"
)

func CreateUser(name, email, hashedPassword string){
	newUser := models.User{
		Name:     name,
		Email:    email,
		Password: hashedPassword,
	}
	
	db.DB.Create(&newUser)
}

func CreateGroup(name, description, handle,groupType, country, state, city , authorityEmail string, userID int){
	newGroup:= models.Group{
		Name: name,
		Description: description,
		Handle: handle,
		Type: groupType,
		Country: country,
		State: state,
		City: city,
		AuthorityEmail: authorityEmail,
		CreatorID: uint(userID),
	}

	db.DB.Create(&newGroup)
}

func CreatePost(groupID, userID int, content string){
	posts:= models.Post{
		GroupID: uint(groupID),
		UserID: uint(userID),
		Content: content,
	}
	db.DB.Create(&posts)
}