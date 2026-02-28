package models
import (
	"gorm.io/gorm"

)

type Tag struct {
    gorm.Model
    Name  string  `gorm:"unique;not null"` // e.g., "roads", "animals"
    Posts []Post  `gorm:"many2many:post_tags"`
}

type PostImage struct {
	gorm.Model
	PostID uint   `gorm:"not null"`
	URL    string `gorm:"not null"` // stored image path
}
type PostLink struct {
	gorm.Model
	PostID uint   `gorm:"not null"`
	URL    string `gorm:"not null"`
}

type PostVote struct {
	gorm.Model
	PostID uint `gorm:"not null"`
	UserID uint `gorm:"not null"`

	// 1 = upvote, -1 = downvote
	VoteType int `gorm:"not null"`

	Post Post `gorm:"foreignKey:PostID"`
	User User `gorm:"foreignKey:UserID"`

	// Prevent duplicate voting
	// One user can vote once per post
}

type Comment struct {
	gorm.Model
	PostID uint   `gorm:"not null"`
	UserID uint   `gorm:"not null"`
	Content string `gorm:"type:text;not null"`

	Post Post `gorm:"foreignKey:PostID"`
	User User `gorm:"foreignKey:UserID"`
}


type Post struct {
	gorm.Model

	GroupID uint   `gorm:"not null"`
	Group   Group  `gorm:"foreignKey:GroupID"`

	UserID  uint   `gorm:"not null"`
	User    User   `gorm:"foreignKey:UserID"`

	Content string `gorm:"type:text;not null"`

	Tags   []Tag        `gorm:"many2many:post_tags"`
	Images []PostImage  `gorm:"constraint:OnDelete:CASCADE"`
	Links  []PostLink   `gorm:"constraint:OnDelete:CASCADE"`

	Votes    []PostVote   `gorm:"constraint:OnDelete:CASCADE"`
	Comments []Comment    `gorm:"constraint:OnDelete:CASCADE"`
	ShareToken string `gorm:"uniqueIndex"`
}