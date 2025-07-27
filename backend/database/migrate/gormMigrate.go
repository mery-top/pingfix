package migrate

import (
	"backend/database/db"
	"backend/models"
	"fmt"
)

func Migrate(name, email, hashedPassword string){
	var user models.User
	err:= db.DB.First(&user, "email=?", email)
	if err!=nil{
		fmt.Println("User Already exists")
		return
	}

	newUser := models.User{
		Name:     name,
		Email:    email,
		Password: hashedPassword,
	}
	
	db.DB.Create(&newUser)
	
}