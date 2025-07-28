import { useState } from 'react'
import { Route, Routes, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedRoute from './wrapper/ProtectedRoute'
import Home from './pages/Home'
import PublicRoute from './wrapper/PublicRoute'

function App() {
  return (
    <>
    
  <Routes>
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>}></Route>
    <Route path="/login" element={<PublicRoute><Login/></PublicRoute>}></Route>
    <Route path="/register" element={<PublicRoute><Register/></PublicRoute>}></Route>
    <Route path="/" element={<Home/>}></Route>
  </Routes>
    </>
  )
}

export default App
