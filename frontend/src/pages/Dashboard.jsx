import React from 'react'
import { LogoutAPI } from '../api/LogoutAPI'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const navigate = useNavigate()

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
      <button onClick={LogoutHandler}>
        Logout
      </button>
    </div>
  )
}

export default Dashboard