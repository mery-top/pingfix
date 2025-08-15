package models
import (
	"gorm.io/gorm"
	"time"

)

type Post struct{
	gorm.Model
	GroupID uint   `gorm:"not null"`
	Group   Group  `gorm:"foreignKey:GroupID"`
	UserID  uint   `gorm:"not null"`
	User    User   `gorm:"foreignKey:UserID"`
	Content string `gorm:"type:text;not null"`
	CreatedAt time.Time
}