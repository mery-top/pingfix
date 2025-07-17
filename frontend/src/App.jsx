import { useState } from 'react'
import { Route, Routes, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'

function App() {
  const LoginWithGoogle = () =>{
    window.location.href = "http://localhost:8080/auth/google"
  }

  return (
    <>
  <div>
    <button onClick={LoginWithGoogle}>
      Login
    </button>
  </div>
  <Routes>

  </Routes>
    </>
  )
}

export default App
