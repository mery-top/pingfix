package routes

import (
	"net/http"

	"backend/handlers/groups"
	"backend/handlers/posts"
	"backend/handlers/user"
	"backend/internal/auth"
	"backend/handlers/feed"
	"backend/internal/middleware"
	"backend/utils"

	"github.com/gorilla/mux"
)

func SetupRouter() *mux.Router{
	auth.InitProviders()
	r:= mux.NewRouter()
	r.Use(middleware.CORS)

	r.HandleFunc("/auth/{provider}", auth.BeginAuth).Methods("GET")
	r.HandleFunc("/auth/{provider}/callback", auth.Callback).Methods("GET", "POST")
	r.HandleFunc("/glogout", auth.GLogout).Methods("GET")
	r.HandleFunc("/api/login", auth.Login).Methods("POST")
	r.HandleFunc("/api/register", auth.Register).Methods("POST")
	r.HandleFunc("/api/logout", auth.Logout).Methods("POST")
	r.HandleFunc("/api/status", auth.CheckAuthStatus).Methods("GET")
	r.HandleFunc("/api/send-otp", utils.SendOTP).Methods("POST")
	r.HandleFunc("/api/verify-otp", utils.VerifyOTP).Methods("POST")
	r.HandleFunc("/api/user", user.GetCurrentUser).Methods("GET")
	r.HandleFunc("/api/group/register", groups.GroupRegister).Methods("POST")
	r.HandleFunc("/api/group/search", groups.SearchGroups).Methods("GET")
	r.HandleFunc("/api/group/mygroups", groups.MyGroups).Methods("GET")
	r.HandleFunc("/api/group/join", groups.JoinGroup).Methods("POST")
	r.HandleFunc("/api/group/leave", groups.LeaveGroup).Methods("POST")
	r.HandleFunc("/api/group/delete/request", groups.RequestDeleteGroup).Methods("POST")
	r.HandleFunc("/api/group/delete/confirm", groups.ConfirmDeleteGroup).Methods("POST")
	r.HandleFunc("/api/post/create", posts.CreatePost).Methods("POST")
	r.HandleFunc("/api/post/myposts", posts.MyPosts).Methods("GET")
	r.HandleFunc("/api/post/feed", feed.Feed).Methods("GET")
	r.HandleFunc("/api/post/delete", posts.DeletePost).Methods("DELETE")
	r.HandleFunc("/api/post/vote", posts.VotePost).Methods("POST")
	r.HandleFunc("/api/post/comment", posts.AddComment).Methods("POST")
	r.HandleFunc("/api/post/comment/{id}", posts.DeleteComment).Methods("DELETE")
	r.HandleFunc("/api/comment/edit/{id}", posts.EditComment).Methods("PUT")
	r.HandleFunc("/public/post/{token}", posts.GetSharedPost).Methods("GET")
	// r.HandleFunc("/api/secure", auth.SecureHandler).Methods("POST")
	// r.HandleFunc("/api/csrf-token", middleware.GetCSRFToken).Methods("GET")
	r.HandleFunc("/api/public", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Public Route is Working"))
	}).Methods("GET")
	
	return r
}