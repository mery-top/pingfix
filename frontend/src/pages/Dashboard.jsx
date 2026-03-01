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

  const goToMyGroups = () => {
    navigate('/group/mygroups')
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

      {/* Toggle Button */}
      <div style={{ position: 'fixed', top: '15px', left: '15px', zIndex: 2001 }}>
        <button className="sidebar-toggle-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Left Sidebar */}
      <div className={`tg-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="tg-menu-list">
          <button className="tg-menu-item active" onClick={() => setIsSidebarOpen(false)}>Dashboard Feed</button>
          <button className="tg-menu-item" onClick={() => { goToMyGroups(); setIsSidebarOpen(false); }}>My Groups</button>
          <button className="tg-menu-item" onClick={() => { goToMyPosts(); setIsSidebarOpen(false); }}>My Posts</button>
          <hr style={{ borderColor: "rgba(255,255,255,0.05)", margin: "10px 0" }} />
          <button className="tg-menu-item" style={{ color: "#ff4d4f" }} onClick={LogoutHandler}>Logout</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="tg-content">
        <TopHeader user={user} />
        <Feed />
      </div>
    </div>
  );
}

export default Dashboard