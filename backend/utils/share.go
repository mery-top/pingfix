
package utils

import (
	"crypto/rand"
	"encoding/base64"
)

func GenerateShareToken() string {
	b := make([]byte, 9)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}