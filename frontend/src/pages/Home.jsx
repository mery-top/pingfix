import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import '../styles/home.css'
function Home() {
  const navigate = useNavigate()
  const goToLogin = () =>{
    navigate('/login')
  }

  const goToRegister = () =>{
    navigate('/register')
  }
  return (
    <>
    <div>Home</div>
    <button onClick={goToLogin}>Login</button>
    <button onClick={goToRegister}>Register</button>
    </>
    
  )
}

export default Home