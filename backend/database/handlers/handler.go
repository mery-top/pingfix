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

	tx := db.DB.Begin()

	post := models.Post{
		GroupID: groupID,
		UserID:  userID,
		Content: content,
	}

	// Create Post
	if err := tx.Create(&post).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Save Images
	for _, img := range images {
		image := models.PostImage{
			PostID: post.ID,
			URL:    img,
		}
		if err := tx.Create(&image).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	// Save Links
	for _, link := range links {
		postLink := models.PostLink{
			PostID: post.ID,
			URL:    link,
		}
		if err := tx.Create(&postLink).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	// Save Tags (Many-to-Many)
	for _, tagName := range tags {
		var tag models.Tag

		// Create tag if it doesn't exist
		if err := tx.FirstOrCreate(&tag, models.Tag{Name: tagName}).Error; err != nil {
			tx.Rollback()
			return err
		}

		// Attach tag to post
		if err := tx.Model(&post).Association("Tags").Append(&tag); err != nil {
			tx.Rollback()
			return err
		}
	}

	tx.Commit()
	return nil
}