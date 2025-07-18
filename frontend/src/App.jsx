import { useState } from 'react'
import { Route, Routes, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Secure from './pages/Secure'
import Register from './pages/Register'

function App() {
  const LoginWithGoogle = () =>{
    window.location.href = "/auth/google"
  }

  return (
    <>
  <div>
    <button onClick={LoginWithGoogle}>
      Login
    </button>
  </div>
  <Routes>
    <Route path="/dashboard" element={<Dashboard/>}></Route>
    <Route path="/login" element={<Login/>}></Route>
    <Route path="/register" element={<Register/>}></Route>
    <Route path="/secure" element={<Secure/>}></Route>
  </Routes>
    </>
  )
}

export default App
