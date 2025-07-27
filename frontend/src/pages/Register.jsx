import React, { useState } from 'react'
import { LoginWithGoogle, RegisterAPI, SendOTPAPI, VerifyOTPAPI } from '../api/AuthAPI'
import { useNavigate } from 'react-router-dom'

function Register() {
  const[email, setEmail] = useState("")
  const[password, setPassword]= useState("")
  const[name, setName] = useState("")
  const[otp, setOTP] = useState("")
  const[message, setMessage] = useState("")
  const navigate = useNavigate()

  const handleRegister = async () =>{
    try{
      const res = await RegisterAPI(name,email, password)
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

  const handleSendOTP = async() =>{
    try{
      const res = await SendOTPAPI(email)
      if(res.status === 200){
        setMessage("Sent OTP")
      }else{
            setMessage("Enter Correct Details, Register Failed")
      }
    }catch(error){
        setMessage("OTP Not Sent")
        console.error("Register error", error)
    }
  }

  const handleVerifyOTP = async() =>{
    try{
      const res = await VerifyOTPAPI(email,otp)
      if(res.status === 200){
        setMessage("OTP Verified Success")
      }else{
            setMessage("Enter Correct Details, Register Failed")
      }
    }catch(error){
        setMessage("OTP Not Verified")
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
         <input type="number"
        placeholder='OTP'
        value={otp}
        onChange={e => setOTP(e.target.value)}
         /><br/>
         <button onClick={handleSendOTP}>SendOTP</button>
         <button onClick={handleVerifyOTP}>VerifyOTP</button>
         <button onClick={handleRegister}>Register</button>
         <button onClick={LoginWithGoogle}>SignUp with Google</button>
    </>
  )
}

export default Register