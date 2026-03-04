import React, { useState } from 'react'
import { LoginAPI, LoginWithGoogle } from '../api/AuthAPI'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { sanitizeInput } from '../utils/sanitizer'

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [isAuthenticated, setAuthenticated] = useState("")
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  React.useEffect(() => {
    if (searchParams.get("oauth_error") === "1") {
      setMessage("Google login failed. Please try again.")
    }
  }, [searchParams])

  const HandleLogin = async () => {
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
      const res = await LoginAPI(email, password)
      if (res.status === 200) {
        setMessage("")
        setAuthenticated("Login Success")
        navigate("/dashboard")
      } else {
        const errText = await res.text()
        setMessage(errText || "Enter Correct Details, Login Failed")
        setAuthenticated("")
      }

    } catch (error) {
      console.error("Login Error", error)
      setMessage("Enter Correct Details, Login Failed")
    }
  }


  return (
    <div className="ig-auth-container">
      <div className="ig-auth-card" style={{ position: 'relative' }}>
        <button onClick={() => navigate('/')} style={{ position: 'absolute', top: '15px', left: '15px', background: 'none', border: 'none', color: '#F47D34', cursor: 'pointer', fontSize: '1em' }}>
          ←
        </button>
        <h2>Login</h2>
        <input
          type="email"
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

        <button className="ig-btn" onClick={HandleLogin}>Login</button>

        {message && <p style={{ color: '#F47D34', marginTop: '15px', fontSize: '0.9em' }}>{message}</p>}

        <div className="ig-divider">OR</div>

        <button className="ig-btn-outline" onClick={LoginWithGoogle}>
          <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" alt="G" style={{ width: '18px', height: '18px' }} />
          Sign In with Google
        </button>
      </div>
    </div>
  )
}

export default Login
