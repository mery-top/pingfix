package db

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"
)

func SaveSession(w http.ResponseWriter, r *http.Request, data map[string]interface{}) error {

	sessionID := uuid.NewString()

	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}

	err = Rdb.Set(context.Background(), "session:"+sessionID, jsonData, 48*time.Hour).Err()
	if err != nil {
		return err
	}

	cookie := &http.Cookie{
		Name:     "session_id",
		Value:    sessionID,
		Path:     "/",
		HttpOnly: true,
		MaxAge:   172800,
	}

	http.SetCookie(w, cookie)
	return nil
}

func GetSession(r *http.Request) (map[string]interface{}, error) {

	cookie, err := r.Cookie("session_id")
	if err != nil {
		return nil, err
	}

	val, err := Rdb.Get(context.Background(), "session:"+cookie.Value).Result()
	if err != nil {
		return nil, err
	}

	var data map[string]interface{}
	err = json.Unmarshal([]byte(val), &data)
	return data, err
}