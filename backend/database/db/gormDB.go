package db

import (
	"fmt"
	"log"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"backend/config"
)

var DB *gorm.DB

func DBInit() {

	host := config.Get("DB_HOST")
	user := config.Get("DB_USER")
	password := config.Get("DB_PASSWORD")
	name := config.Get("DB_NAME")
	port := config.Get("DB_PORT")
	sslmode := config.Get("DB_SSLMODE")

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
		host, user, password, name, port, sslmode,
	)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})

	if err != nil {
		log.Fatal("Gorm FAILED:", err)
	}

	fmt.Println("Connected DB Gorm")
} 