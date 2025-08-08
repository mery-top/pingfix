package models
import "gorm.io/gorm"

type Group struct{
	gorm.Model
	Name string `gorm:"not null"`
	Description string
	Handle string `gorm:"uniqueIndex;not null"`
	Location string
	AuthorityEmail string
	CreatorID uint
}
