package models

import "gorm.io/gorm"

type User struct{
	gorm.Model
	Name     string
	Email    string `gorm:"unique"`
	Password string
	OTP string
}

type Group struct{
	gorm.Model
	Name string `gorm:"not null"`
	Description string
	Handle string `gorm:"uniqueIndex;not null"`
	Location string
	AuthorityEmail string
	CreatorID uint
}

type Subscription struct{
	gorm.Model
	UserID uint
	GroupID uint
}

type Post struct{
	gorm.Model
	Title string
	Content string
	GroupID uint
	UserID uint
}