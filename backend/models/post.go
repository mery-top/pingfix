package models

import (
	"gorm.io/gorm"
)

type Tag struct {
	gorm.Model
	Name  string `gorm:"unique;not null"`
	Posts []Post `gorm:"many2many:post_tags"`
}

type PostImage struct {
	gorm.Model
	PostID uint   `gorm:"not null;index"` // INDEX
	URL    string `gorm:"not null"`
}

type PostLink struct {
	gorm.Model
	PostID uint   `gorm:"not null;index"` // INDEX
	URL    string `gorm:"not null"`
}

type PostVote struct {
	gorm.Model
	PostID uint `gorm:"not null;index;uniqueIndex:idx_post_user_vote"` // INDEX + UNIQUE COMBO
	UserID uint `gorm:"not null;index;uniqueIndex:idx_post_user_vote"` // INDEX + UNIQUE COMBO

	VoteType int `gorm:"not null;index"` // INDEX (filtering)

	Post Post `gorm:"foreignKey:PostID"`
	User User `gorm:"foreignKey:UserID"`
}

type PostResolve struct {
	gorm.Model
	PostID uint `gorm:"not null;index;uniqueIndex:idx_post_user_resolve"`
	UserID uint `gorm:"not null;index;uniqueIndex:idx_post_user_resolve"`

	Post Post `gorm:"foreignKey:PostID"`
	User User `gorm:"foreignKey:UserID"`
}

type Comment struct {
	gorm.Model
	PostID  uint   `gorm:"not null;index"` // INDEX
	UserID  uint   `gorm:"not null;index"` // INDEX
	Content string `gorm:"type:text;not null"`

	Post Post `gorm:"foreignKey:PostID"`
	User User `gorm:"foreignKey:UserID"`
}

type Post struct {
	gorm.Model

	GroupID uint  `gorm:"not null;index"` // INDEX
	Group   Group `gorm:"foreignKey:GroupID"`

	UserID uint `gorm:"not null;index"` // INDEX
	User   User `gorm:"foreignKey:UserID"`

	Content string `gorm:"type:text;not null"`

	Tags   []Tag       `gorm:"many2many:post_tags"`
	Images []PostImage `gorm:"constraint:OnDelete:CASCADE"`
	Links  []PostLink  `gorm:"constraint:OnDelete:CASCADE"`

	Votes    []PostVote    `gorm:"constraint:OnDelete:CASCADE"`
	Comments []Comment     `gorm:"constraint:OnDelete:CASCADE"`
	Resolves []PostResolve `gorm:"constraint:OnDelete:CASCADE"`

	Resolved   bool   `gorm:"default:false;index"` // INDEX
	ShareToken string `gorm:"uniqueIndex"`         // UNIQUE

}

type PostResponse struct {
	Post         Post   `json:"post"`
	Upvotes      int64  `json:"upvotes"`
	Downvotes    int64  `json:"downvotes"`
	Comments     int64  `json:"comments"`
	ResolveCount int64  `json:"resolve_count"`
	UserResolved bool   `json:"user_resolved"`
	ShareURL     string `json:"share_url"`
}