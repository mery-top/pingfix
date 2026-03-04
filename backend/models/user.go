package models

import "gorm.io/gorm"


//group_data will create an intermediate table 1 -2 groupID and user ID
type User struct{
	gorm.Model
	Name         string  `gorm:"not null"`
	Email        string  `gorm:"unique"`
	Password     string  `json:"-"`
	AuthProvider string  // "local" or "google"
	OAuthID      string  `gorm:"uniqueIndex;null" json:"-"`
	Groups       []Group `gorm:"many2many:group_data" json:"-"`
}
