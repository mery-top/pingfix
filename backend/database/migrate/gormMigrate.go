package migrate

import(
	"backend/database/db"
	"backend/models"
)

func Migrate(name, email, hashedPassword string){
	db.DB.AutoMigrate(&models.User{})

	newUser := models.User{
		Name:     name,
		Email:    email,
		Password: hashedPassword,
	}
	
	db.DB.Create(&newUser)
	
}