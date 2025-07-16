import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const LoginWithGoogle = () =>{
    window.location.href = "http://localhost:8080/auth/google"
  }

  return (
    <>
  <div>
    <button onClick={LoginWithGoogle}>
      Login
    </button>
  </div>
    </>
  )
}

export default App
