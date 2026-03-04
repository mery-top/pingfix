
package utils

import (
	"crypto/rand"
	"encoding/base64"
	"os"
	"strings"
)

func GenerateShareToken() string {
	b := make([]byte, 9)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}

func BuildShareURL(token string) string {
	baseURL := strings.TrimSpace(os.Getenv("PUBLIC_BASE_URL"))
	if baseURL == "" {
		baseURL = "https://www.pingfix.vercel.app"
	}
	baseURL = strings.TrimRight(baseURL, "/")
	return baseURL + "/public/post/" + token
}
