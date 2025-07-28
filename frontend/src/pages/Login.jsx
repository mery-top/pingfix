import React, { useState } from 'react'
import { LoginAPI, LoginWithGoogle } from '../api/AuthAPI'

import { useNavigate } from 'react-router-dom'

function Login() {
  const[email, setEmail] = useState("")
  const[password, setPassword]= useState("")
  const[message, setMessage] = useState("")
  const[isAuthenticated, setAuthenticated] = useState("")
  const navigate = useNavigate()

  const HandleLogin = async () =>{
    try{
        const res = await LoginAPI(email, password)
        if(res.status === 200){
              setAuthenticated("Login Success")
              navigate("/dashboard")
        }else{
              setAuthenticated("Enter Correct Details, Login Failed")
        }

    }catch(error){
        console.error("Login Error", error)
        setMessage("Enter Correct Details, Login Failed")
    }
  }


  return (
    <>
    <div>
        <h2>Login with Email</h2>
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
         <button onClick={HandleLogin}>Login</button>
         <p>{message}</p>
         <button onClick={LoginWithGoogle}>Login with Google</button>
    </div>
    </>
  )
}

export default Login