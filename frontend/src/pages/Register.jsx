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
    <h2>Register</h2>
    <input type="name"
        placeholder='Name'
        value={name}
        onChange={e => setName(e.target.value)}
         /><br/>
        <input type="email"
        placeholder='Email'
        value={email}
        onChange={e => setEmail(e.target.value)}
         /><br/>
        <input type="password"
        placeholder='Password'
        value={password}
        onChange={e => setPassword(e.target.value)}
         /><br/>
         <button onClick={handleRegister}>Register</button>
    </>
  )
}

export default Register