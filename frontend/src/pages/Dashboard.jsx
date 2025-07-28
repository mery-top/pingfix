import React, { useEffect, useState } from 'react'
import { LogoutAPI } from '../api/AuthAPI'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const navigate = useNavigate()
  const [name, setName] = useState("")

  useEffect(() => {
    const email = localStorage.getItem("email");
    setName(email || "");
  }, []);
  
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
      <p>{name}</p>
      <button onClick={LogoutHandler}>
        Logout
      </button>
    </div>
  )
}

export default Dashboard