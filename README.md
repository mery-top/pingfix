# PingFix 🚀

PingFix is a community-driven issue resolution and social interaction platform. It empowers users to report issues, collaborate within community groups, and track the progress of resolutions through a democratic voting and verification system.

## Live Deployment

- (Vercel): [https://pingfix.vercel.app](https://pingfix.vercel.app)

## 🌟 Core Features

- **🔐 User Authentication**: Secure login and registration for users and group administrators.
- **👥 Community Groups**: Join or create groups focused on specific locations or interests.
- **📝 Post Creation & Feed**: Share updates, report issues, and view a dynamic feed of community activities.
- **🗜️ Image Compression (100KB)**: Uploaded images are compressed to around **100KB** for faster loading and reduced bandwidth usage.
- **👍 Vote & Comment System**: Engage with posts through upvotes, downvotes, and detailed discussions.
- **✅ Smart Resolution Logic**: Posts are automatically marked as "Resolved" once a **65% community threshold** is reached, ensuring verified outcomes.
- **🔍 Search Functionality**: Easily find groups, posts, and users across the platform.
- **⚡ Optimized Data Access**: Query flow is optimized for faster feed/search access with efficient SQL patterns (filtering, pagination, and reduced heavy lookups).

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React](https://reactjs.org/) (Vite)
- **Styling**: [React Bootstrap](https://react-bootstrap.github.io/)
- **Icons**: [React Icons](https://react-icons.github.io/react-icons/)
- **Routing**: [React Router](https://reactrouter.com/)

### Backend
- **Language**: [Go (Golang)](https://golang.org/)
- **ORM**: [GORM](https://gorm.io/)
- **Web Toolkit**: [Gorilla Mux](https://github.com/gorilla/mux) & [Gorilla Sessions](https://github.com/gorilla/sessions)
- **Caching**: [Redis](https://redis.io/)
- **Query Optimization**: SQL query optimization for feed/search performance (optimized filters, pagination, and leaner DB access paths)

### Infrastructure
- **Database**: Supabase
- **Storage**: [AWS S3](https://aws.amazon.com/s3/)
- **Frontend Hosting**: [Vercel](https://vercel.com/)
- **Backend Hosting**: Linux server with Nginx reverse proxy + HTTPS (Certbot)

### Demo Video

Watch here: https://youtu.be/pxOwVjbPHu0

---

## 📱 Demo Gallery

### Web Experience
Explore the desktop interface designed for high productivity and detailed community management.

| | | |
|:---:|:---:|:---:|
| ![Dashboard](demo/c1.png) | ![Feed](demo/c2.png) | ![Search](demo/c3.png) |
| ![Group Details](demo/c4.png) | ![Create Post](demo/c5.png) | ![My Groups](demo/c6.png) |
| ![Settings](demo/c7.png) | ![Auth](demo/c8.png) | ![Profile](demo/c9.png) |
| ![Verification](demo/c10.png) | ![Admin Sidebar](demo/c11.png) | ![Group Search](demo/c12.png) |

### Mobile Experience
Stay connected on the go with our fully responsive mobile design.

| | | |
|:---:|:---:|:---:|
| ![Mobile Home](demo/m1.png) | ![Mobile Feed](demo/m2.png) | ![Mobile Search](demo/m3.png) |
| ![Mobile Group](demo/m4.png) | ![Mobile Post](demo/m5.png) | ![Mobile Profile](demo/m6.png) |
| ![Mobile Menu](demo/m7.png) | ![Mobile Auth](demo/m8.png) | ![Mobile Settings](demo/m9.png) |
| ![Mobile Resolution](demo/m10.png) | ![Mobile Sidebar](demo/m11.png) | ![Mobile Search](demo/m12.png) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js & npm
- Go (1.23+)
- PostgreSQL
- Redis

### Backend Setup
1. Navigate to the `backend` directory.
2. Create a `.env` file with your configuration.
3. Run the server:
   ```bash
   go run cmd/server/main.go
   ```

### Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```


Built with ❤️ for better communities.
