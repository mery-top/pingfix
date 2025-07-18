import React, { useState } from 'react'
import { RegisterAPI } from '../api/RegisterAPI'

function Register() {
  const[email, setEmail] = useState("")
  const[password, setPassword]= useState("")
  const[name, setName] = useState("")

  const handleRegister = async () =>{
    try{
        const response = await RegisterAPI(name, email, password)
    }catch(error){
        console.error("Register error", error)
    }
  }

  return (
    <>
    
    </>
  )
}

export default Register