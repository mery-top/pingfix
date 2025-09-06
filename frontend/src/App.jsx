import { useState } from 'react'
import { Route, Routes, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedRoute from './wrapper/ProtectedRoute'
import Home from './pages/Home'
import PublicRoute from './wrapper/PublicRoute'
import GroupRegister from './pages/GroupRegister'
import Search from './pages/Search'
import MyGroups from './pages/MyGroups'
import CreatePost from './pages/CreatePost'

function App() {
  return (
    <>
    
  <Routes>
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>}></Route>
    <Route path="/group/register" element={<ProtectedRoute><GroupRegister/></ProtectedRoute>}></Route>
    <Route path="/group/search" element={<ProtectedRoute><Search/></ProtectedRoute>}></Route>
    <Route path="/group/mygroups" element={<ProtectedRoute><MyGroups/></ProtectedRoute>}></Route>
    <Route path="/group/posts/createpost" element={<ProtectedRoute><CreatePost/></ProtectedRoute>}></Route>
    <Route path="/login" element={<PublicRoute><Login/></PublicRoute>}></Route>
    <Route path="/register" element={<PublicRoute><Register/></PublicRoute>}></Route>
    <Route path="/" element={<Home/>}></Route>
  </Routes>
    </>
  )
}

export default App
