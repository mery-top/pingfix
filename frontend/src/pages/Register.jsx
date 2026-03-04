import React, { useState } from 'react'
import { RegisterAPI, SendOTPAPI, VerifyOTPAPI, LoginWithGoogle } from '../api/AuthAPI'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'
import { sanitizeInput } from '../utils/sanitizer'

function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [otp, setOTP] = useState("")
  const [message, setMessage] = useState("")
  const [isSuccessModalOpen, setSuccessModalOpen] = useState(false)
  const navigate = useNavigate()

  const validatePassword = (pwd) => {
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/
    return regex.test(pwd)
  }

  const handleRegister = async () => {
    if (!name.trim()) {
      setMessage("Name is required")
      return
    }

    if (!/^[A-Za-z\s]+$/.test(name)) {
      setMessage("Name can only contain letters and spaces")
      return
    }

    if (!email.trim()) {
      setMessage("Email is required")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setMessage("Invalid email format")
      return
    }

    if (!password) {
      setMessage("Password is required")
      return
    }

    if (!validatePassword(password)) {
      setMessage("Password must be at least 8 characters long, contain one uppercase letter, one number, and one special character")
      return
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match")
      return
    }

    try {
      const res = await RegisterAPI(name, email, password)
      const messageText = await res.text()

      if (res.status === 201) {
        setSuccessModalOpen(true)
        setMessage("")
      } else {
        setMessage(messageText || "Registration failed")
      }
    } catch (error) {
      console.error("Register error", error)
      setMessage("Something went wrong")
    }
  }

  const handleSendOTP = async () => {
    try {
      const res = await SendOTPAPI(email)
      if (res.status === 200) setMessage("Sent OTP")
      else setMessage("Enter Correct Details, Register Failed")
    } catch (error) {
      setMessage("OTP Not Sent")
      console.error(error)
    }
  }

  const handleVerifyOTP = async () => {
    try {
      const res = await VerifyOTPAPI(email, otp)
      if (res.status === 200) setMessage("OTP Verified Successfully")
      else setMessage("Enter Correct Details, Register Failed")
    } catch (error) {
      setMessage("OTP Not Verified")
      console.error(error)
    }
  }

  return (
    <div className="ig-auth-container">
      <div className="ig-auth-card" style={{ position: 'relative' }}>
        <button onClick={() => navigate('/')} style={{ position: 'absolute', top: '15px', left: '15px', background: 'none', border: 'none', color: '#F47D34', cursor: 'pointer', fontSize: '1em' }}>
          ←
        </button>
        <h2>Register</h2>

        <input type="text"
          className="ig-input"
          placeholder='Name'
          value={name}
          onChange={e => setName(sanitizeInput(e.target.value, { allowSpace: true }))}
        />

        <input type="email"
          className="ig-input"
          placeholder='Email'
          value={email}
          onChange={e => setEmail(sanitizeInput(e.target.value))}
        />

        <input
          type="password"
          className="ig-input"
          placeholder='Password'
          value={password}
          onChange={e => setPassword(e.target.value)}
        />


        <input
          type="password"
          className="ig-input"
          placeholder='Confirm Password'
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
        />

        <ul style={{
                fontSize: '0.6em',       // readable size
                color: '#555',   // indent bullets
                lineHeight: '1.4',
                listStylePosition: 'inside', // align bullets with text
                textAlign: 'left',
                marginBottom: '5px',        // ensures left alignment
              }}>
                <li>8 characters long</li>
                <li>One uppercase letter</li>
                <li>One number</li>
                <li>One special character (e.g., !@#$%^&*)</li>
              </ul>


        <input type="text"
          className="ig-input"
          placeholder='OTP'
          value={otp}
          onChange={e => setOTP(sanitizeInput(e.target.value))}
        />

        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button className="ig-btn" style={{ flex: 1 }} onClick={handleSendOTP}>Send OTP</button>
          <button className="ig-btn" style={{ flex: 1 }} onClick={handleVerifyOTP}>Verify OTP</button>
        </div>

        <button className="ig-btn" onClick={handleRegister}>Register</button>

        {message && <p style={{ color: '#F47D34', marginTop: '15px', fontSize: '0.9em' }}>{message}</p>}

        <div className="ig-divider">OR</div>

        <button className="ig-btn-outline" onClick={LoginWithGoogle}>
          <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" alt="G" style={{ width: '18px', height: '18px' }} />
          Sign In with Google
        </button>
      </div>

      <Modal
        isOpen={isSuccessModalOpen}
        title="Account Created!"
        message="Welcome! Your account has been created successfully."
        confirmText="Login Now"
        onConfirm={() => navigate("/login")}
        onClose={() => navigate("/login")}
      />
    </div>
  )
}

export default Register