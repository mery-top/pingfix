import { useState } from 'react'
import { Route, Routes, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Secure from './pages/Secure'
import Register from './pages/Register'
import ProtectedRoute from './wrapper/ProtectedRoute'

function App() {
  return (
    <>
 
  <Routes>
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>}></Route>
    <Route path="/login" element={<Login/>}></Route>
    <Route path="/register" element={<Register/>}></Route>
    <Route path="/secure" element={<Secure/>}></Route>
  </Routes>
    </>
  )
}

export default App
