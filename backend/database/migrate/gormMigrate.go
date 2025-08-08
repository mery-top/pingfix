package migrate

import (
	"backend/database/db"
	"backend/models"
)

func Migrate(){
	db.DB.AutoMigrate(&models.User{}, &models.Group{}, &models.Post{})
}