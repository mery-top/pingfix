package utils

import (
	"bytes"
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
	"mime/multipart"
	"strings"
	"github.com/chai2010/webp"
	"github.com/nfnt/resize"
)

// ---------------- Helper ---------------- //
func detectContentType(fileName string) string {
	switch {
	case strings.HasSuffix(fileName, ".png"):
		return "image/png"
	case strings.HasSuffix(fileName, ".webp"):
		return "image/webp"
	default:
		return "image/jpeg"
	}
}

// ---------------- Image Compression / Resize ---------------- //

// CompressImage compresses and resizes an image to ~targetSizeKB (e.g., 100 KB)
// Supports JPEG, PNG, and WebP
func CompressImage(file multipart.File, fileName string, targetSizeKB int) ([]byte, string, error) {
	lowerName := strings.ToLower(fileName)
	var img image.Image
	var decodeErr error

	// Decode image
	if strings.HasSuffix(lowerName, ".png") {
		img, decodeErr = png.Decode(file)
	} else if strings.HasSuffix(lowerName, ".webp") {
		img, decodeErr = webp.Decode(file)
	} else {
		img, _, decodeErr = image.Decode(file) // JPEG fallback
	}

	if decodeErr != nil {
		return nil, "", fmt.Errorf("failed to decode image: %v", decodeErr)
	}

	// Resize to max width 1024px (maintain aspect ratio)
	resizedImg := resize.Resize(1024, 0, img, resize.Lanczos3)

	// Compress to target size
	buf := new(bytes.Buffer)
	quality := 90

	for {
		buf.Reset()
		if strings.HasSuffix(lowerName, ".png") {
			encoder := png.Encoder{CompressionLevel: png.BestCompression}
			if err := encoder.Encode(buf, resizedImg); err != nil {
				return nil, "", fmt.Errorf("failed to encode PNG: %v", err)
			}
		} else if strings.HasSuffix(lowerName, ".webp") {
			if err := webp.Encode(buf, resizedImg, &webp.Options{Lossless: false, Quality: float32(quality)}); err != nil {
				return nil, "", fmt.Errorf("failed to encode WebP: %v", err)
			}
		} else {
			if err := jpeg.Encode(buf, resizedImg, &jpeg.Options{Quality: quality}); err != nil {
				return nil, "", fmt.Errorf("failed to encode JPEG: %v", err)
			}
		}

		if buf.Len() <= targetSizeKB*1024 || quality <= 10 {
			break
		}
		quality -= 5
	}

	return buf.Bytes(), detectContentType(lowerName), nil
}