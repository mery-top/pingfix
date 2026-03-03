package utils

import (
	"regexp"
	"strings"
	"unicode"
)

// Sanitize strips HTML tags and potentially dangerous characters from a string.
// It allows basic punctuation while removing SQL meta-characters and script tags.
func Sanitize(input string) string {
	if input == "" {
		return ""
	}

	// 1. Remove script tags and their content
	reScript := regexp.MustCompile(`(?i)<script.*?>.*?</script>`)
	input = reScript.ReplaceAllString(input, "")

	// 2. Remove all HTML tags
	reHTML := regexp.MustCompile(`<[^>]*>`)
	input = reHTML.ReplaceAllString(input, "")

	// 3. Remove inline JS events (onmouseover, onclick, etc.)
	reEvents := regexp.MustCompile(`(?i)on\w+\s*=\s*(['"][^'"]*['"]|[^>\s]+)`)
	input = reEvents.ReplaceAllString(input, "")

	// 4. Remove javascript: URIs
	reJSURI := regexp.MustCompile(`(?i)javascript:[^'"]*`)
	input = reJSURI.ReplaceAllString(input, "")

	// 5. Remove SQL injection characters (', ", ;, --, #, /*, */)
	// We replace them with safe equivalents or remove them
	input = strings.ReplaceAll(input, "'", "")
	input = strings.ReplaceAll(input, "\"", "")
	input = strings.ReplaceAll(input, ";", "")
	input = strings.ReplaceAll(input, "--", "")
	input = strings.ReplaceAll(input, "#", "")
	input = strings.ReplaceAll(input, "/*", "")
	input = strings.ReplaceAll(input, "*/", "")

	return strings.TrimSpace(input)
}

// SanitizeSlice applies Sanitize to each string in a slice.
func SanitizeSlice(inputs []string) []string {
	sanitized := make([]string, len(inputs))
	for i, input := range inputs {
		sanitized[i] = Sanitize(input)
	}
	return sanitized
}


// sanitizeFileName replaces spaces and removes unsafe chars
func SanitizeFileName(name string) string {
    name = strings.Map(func(r rune) rune {
        if unicode.IsSpace(r) {
            return '_'
        }
        return r
    }, name)
    re := regexp.MustCompile(`[^a-zA-Z0-9._-]`)
    return re.ReplaceAllString(name, "")
}