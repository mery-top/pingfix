import React, { useState } from 'react'
import { CheckStatusAPI } from '../api/AuthAPI'
import { Navigate } from "react-router-dom";

function ProtectedRoute({children}) {
  try{
    const[isAuthenticated, setAuthenticated] = useState(null)
    const HandleStatus = async ()=>{
        const res = await CheckStatusAPI()
        if(res.status === 200){
            setAuthenticated(true)
        }else{
            setAuthenticated(false)
        }
    }

  }catch(error){
    setAuthenticated(false)
    console.log(error)
  }
  
  return (
    isAuthenticated? children: <Navigate to="/"/>
  )
}

export default ProtectedRoute