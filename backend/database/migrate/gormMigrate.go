package migrate

import(
	"backend/database/db"
	"backend/models"
)

func Migrate(name, email string){
	db.DBConnect()
	db.DB.AutoMigrate(&models.User{})

	newUser := models.User{
		Name:     name,
		Email:    email,
		Password: "123456",
	}
	
	db.DB.Create(&newUser)
	
}