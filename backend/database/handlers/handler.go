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

func CreatePost(
	groupID uint,
	userID uint,
	content string,
	images []string,
	links []string,
	tags []string,
) error {

	post := models.Post{
		GroupID: groupID,
		UserID:  userID,
		Content: content,
	}

	// Save post first
	if err := db.DB.Create(&post).Error; err != nil {
		return err
	}

	// Save Images
	for _, img := range images {
		image := models.PostImage{
			PostID: post.ID,
			URL:    img,
		}
		if err := db.DB.Create(&image).Error; err != nil {
			return err
		}
	}

	// Save Links
	for _, link := range links {
		postLink := models.PostLink{
			PostID: post.ID,
			URL:    link,
		}
		if err := db.DB.Create(&postLink).Error; err != nil {
			return err
		}
	}

	// Handle Tags (Many-to-Many)
	for _, tagName := range tags {
		var tag models.Tag

		// Create tag if not exists
		if err := db.DB.FirstOrCreate(&tag, models.Tag{Name: tagName}).Error; err != nil {
			return err
		}

		// Attach tag to post
		if err := db.DB.Model(&post).Association("Tags").Append(&tag); err != nil {
			return err
		}
	}

	return nil
}