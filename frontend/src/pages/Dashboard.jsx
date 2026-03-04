import React, { useEffect, useState } from 'react'
import { LogoutAPI } from '../api/AuthAPI'
import { useNavigate, Link } from 'react-router-dom'
import { GetCurrentUserAPI } from '../api/UserAPI'
import Feed from './Feed';   // adjust path if needed
import TopHeader from '../components/TopHeader';
import { FiMenu, FiX } from 'react-icons/fi';

function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState({ name: "", email: "" })
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      const res = await GetCurrentUserAPI()
      if (res.ok) {
        const data = await res.json()
        setUser({ name: data.name, email: data.email })
      } else {
        console.error("User not Authenticated")
      }
    }
    fetchUser()
  }, [])

  const LogoutHandler = async () => {
    try {
      const res = await LogoutAPI()
      navigate("/login")
    } catch (error) {
    }
  }

  const goToGroups = () => {
    navigate('/group/register')
  }

  const goToSearch = () => {
    navigate('/group/search')
  }

  const goToRegisterGroup = () => {
    navigate('/group/register')
  }

  const goToCreatePosts = () => {
    navigate('/post/createpost')
  }

  const goToMyPosts = () => {
    navigate('/post/mypost')
  }

  return (
    <div className="tg-layout">
      {/* Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      {/* Left Sidebar */}
      <div className={`tg-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="tg-sidebar-close-container">
          <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)}>
            <FiX size={24} />
          </button>
        </div>

        <div className="tg-sidebar-header">
          <div className="tg-avatar">
            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div style={{ overflow: "hidden" }}>
            <h3 style={{ margin: 0, color: "#fff", fontSize: "1.1em", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{user.name || "Loading..."}</h3>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: "0.85em", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{user.email}</p>
          </div>
        </div>

        <div className="tg-menu-list">
          <button className="tg-menu-item active" onClick={() => setIsSidebarOpen(false)}>Dashboard Feed</button>
          <button className="tg-menu-item" onClick={() => { goToRegisterGroup(); setIsSidebarOpen(false); }}>Register Group</button>
          <button className="tg-menu-item" onClick={() => { goToMyPosts(); setIsSidebarOpen(false); }}>My Posts</button>
          <hr style={{ borderColor: "rgba(255,255,255,0.05)", margin: "10px 0" }} />
          <button className="tg-menu-item" style={{ color: "#ff4d4f" }} onClick={LogoutHandler}>Logout</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="tg-content">
        <TopHeader user={user} onToggleSidebar={() => setIsSidebarOpen(true)} />
        <Feed />
      </div>
    </div>
  );
}

export default Dashboard