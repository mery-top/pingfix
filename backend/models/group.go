package models
import (
	"gorm.io/gorm"
	"time"

)

type Group struct{
	gorm.Model
	Name string `gorm:"not null"`
	Description string
	Handle string `gorm:"uniqueIndex;not null"`
	Type string
	Country string
	State string
	City string
	AuthorityEmail string
	CreatorID uint `gorm:"not null"`
	Creator User `gorm:"foreignKey:CreatorID"`
	Subscribers    []User `gorm:"many2many:group_data"`
	SubscriberCount int `gorm:"default:0"`
	IsJoined bool `gorm:"-" json:"isJoined"`
}

type GroupData struct {
    GroupID uint `gorm:"primaryKey"`
    UserID  uint `gorm:"primaryKey"`
    JoinedAt time.Time
}