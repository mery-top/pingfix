import React, { useState, useEffect } from 'react'
import { CheckStatusAPI } from '../api/AuthAPI'
import { Navigate } from "react-router-dom";

function PublicRoute({children}) {
    const[isAuthenticated, setAuthenticated] = useState(null)
    useEffect(()=>{
      const HandleStatus = async ()=>{
      try{
          const res = await CheckStatusAPI()
          if(res.status === 200){
              setAuthenticated(true)
          }else{
              setAuthenticated(false)
          }
      }catch(error){
        console.log(error)
      }
    }

    HandleStatus()
    },[])

    if (isAuthenticated == null){
      return <div>Loading...</div>
    }

  return (
    isAuthenticated? <Navigate to="/dashboard"/> : children 
  )
}

export default PublicRoute