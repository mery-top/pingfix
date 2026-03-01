import React, { useState } from 'react'
import { LoginWithGoogle, RegisterAPI, SendOTPAPI, VerifyOTPAPI } from '../api/AuthAPI'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'
import { sanitizeInput } from '../utils/sanitizer'

function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [otp, setOTP] = useState("")
  const [message, setMessage] = useState("")
  const [isSuccessModalOpen, setSuccessModalOpen] = useState(false)
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
        setSuccessModalOpen(true);
        setMessage("");
      } else {
        setMessage(message || "Registration failed");
      }
    } catch (error) {
      console.error("Register error", error);
      setMessage("Something went wrong");
    }
  };


  const handleSendOTP = async () => {
    try {
      const res = await SendOTPAPI(email)
      if (res.status === 200) {
        setMessage("Sent OTP")
      } else {
        setMessage("Enter Correct Details, Register Failed")
      }
    } catch (error) {
      setMessage("OTP Not Sent")
      console.error("Register error", error)
    }
  }

  const handleVerifyOTP = async () => {
    try {
      const res = await VerifyOTPAPI(email, otp)
      if (res.status === 200) {
        setMessage("OTP Verified Success")
      } else {
        setMessage("Enter Correct Details, Register Failed")
      }
    } catch (error) {
      setMessage("OTP Not Verified")
      console.error("Register error", error)
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

        <input type="password"
          className="ig-input"
          placeholder='Password'
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <input type="text"
          className="ig-input"
          placeholder='OTP'
          value={otp}
          onChange={e => setOTP(sanitizeInput(e.target.value))}
        />

        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button className="ig-btn" style={{ flex: 1, padding: '8px 0', marginTop: 0 }} onClick={handleSendOTP}>Send OTP</button>
          <button className="ig-btn" style={{ flex: 1, padding: '8px 0', marginTop: 0 }} onClick={handleVerifyOTP}>Verify OTP</button>
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
        message="Welcome to PingFix! Your account has been created successfully."
        confirmText="Login Now"
        onConfirm={() => navigate("/login")}
        onClose={() => navigate("/login")}
      />
    </div>
  )
}

export default Register