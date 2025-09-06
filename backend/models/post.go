package models
import (
	"gorm.io/gorm"
	"time"

)

type Tag struct {
    gorm.Model
    Name  string  `gorm:"unique;not null"` // e.g., "roads", "animals"
    Posts []Post  `gorm:"many2many:post_tags"`
}

type Post struct{
	gorm.Model
	GroupID uint   `gorm:"not null"`
	Group   Group  `gorm:"foreignKey:GroupID"`
	UserID  uint   `gorm:"not null"`
	User    User   `gorm:"foreignKey:UserID"`
	Content string `gorm:"type:text;not null"`
	Tags      []Tag `gorm:"many2many:post_tags"`
	CreatedAt time.Time
}