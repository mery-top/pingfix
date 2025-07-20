import React, { useState } from 'react'
import { LoginWithGoogle, RegisterAPI } from '../api/AuthAPI'
import { useNavigate } from 'react-router-dom'

function Register() {
  const[email, setEmail] = useState("")
  const[password, setPassword]= useState("")
  const[name, setName] = useState("")
  const[message, setMessage] = useState("")
  const navigate = useNavigate()

  const handleRegister = async () =>{
    try{
      const res = await LoginAPI(email, password)
      if(res.status === 201){
            setMessage("Registered Success")
            navigate("/login")
      }else{
            setMessage("Enter Correct Details, Register Failed")
      }
    }catch(error){
        setMessage("Enter Valid Details")
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
         <button onClick={LoginWithGoogle}>SignUp with Google</button>
    </>
  )
}

export default Register