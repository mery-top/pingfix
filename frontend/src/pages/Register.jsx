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

  const handleRegister = async () => {
    if (!name.trim()) {
      setMessage("Name is required");
      return;
    }
  
    if (!/^[A-Za-z\s]+$/.test(name)) {
      setMessage("Name can only contain letters and spaces");
      return;
    }
  
    if (!email.trim()) {
      setMessage("Email is required");
      return;
    }
  
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage("Invalid email format");
      return;
    }
  
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters long");
      return;
    }
  
    try {
      const res = await RegisterAPI(name, email, password);
      const message = await res.text();
  
      if (res.status === 201) {
        setMessage("Registered Successfully");
        navigate("/login");
      } else {
        setMessage(message || "Registration failed");
      }
    } catch (error) {
      console.error("Register error", error);
      setMessage("Something went wrong");
    }
  };
  

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
         <button onClick={handleVerifyOTP}>VerifyOTP </button>
         <button onClick={handleRegister}>Register</button>
         <button onClick={LoginWithGoogle}>SignUp with Google</button>
         <p>{message}</p>
    </>
  )
}

export default Register