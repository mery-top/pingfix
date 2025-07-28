import React, { useEffect, useState } from 'react'
import { LogoutAPI } from '../api/AuthAPI'
import { useNavigate } from 'react-router-dom'
import { GetCurrentUserAPI } from '../api/UserAPI'

function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState({name:"", email:""})

  useEffect(()=>{
    async function fetchUser(){
      const res = await GetCurrentUserAPI()
      if(res.ok){
        const data = await res.json()
        setUser({name: data.name, email:data.email})
      }else{
        console.error("User not Authenticated")
      }
    }
    fetchUser()
  },[])

  const LogoutHandler = async () =>{
    try{
      const res = await LogoutAPI()
      navigate("/login")
    }catch(error){
      console.log(error)
    }
  }


  return (
    <div>Dashboard
      <p>Welcome, {user.name}</p>
      <p> {user.email}</p>
      <button onClick={LogoutHandler}>
        Logout
      </button>
    </div>
  )
}

export default Dashboard