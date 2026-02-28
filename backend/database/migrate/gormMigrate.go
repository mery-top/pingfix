package migrate

import (
	"backend/database/db"
	"backend/models"
)

func Migrate(){
	db.DB.AutoMigrate(
		&models.User{},
		&models.Group{},
		&models.GroupData{},   // for group_data join table
		&models.Post{},
		&models.Tag{},
		&models.PostImage{},
		&models.PostLink{},
	)
}