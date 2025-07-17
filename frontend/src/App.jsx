import { useState } from 'react'
import { Route, Routes, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'

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
  </Routes>
    </>
  )
}

export default App
