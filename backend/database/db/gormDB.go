package db

import (
	"fmt"
	"log"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)


var DB *gorm.DB

func DBInit(){
	dsn:= "host=localhost user=myuser password=mypassword dbname=pingfix port=5433 sslmode=disable"
	var err error
	DB, err = gorm.Open(postgres.Open(dsn),&gorm.Config{})
	
	if err!=nil{
		log.Fatal("Gorm FAILED")
	}
	fmt.Println("Connected DBGorm")
} 