package models
import "gorm.io/gorm"

type Group struct{
	gorm.Model
	Name string `gorm:"not null"`
	Description string
	Handle string `gorm:"uniqueIndex;not null"`
	Country string
	State string
	City string
	AuthorityEmail string
	CreatorID uint `gorm:"not null"`
	Creator User `gorm:"foreignKey:CreatorID"`
	Subscribers    []User `gorm:"many2many:group_data"`
}


