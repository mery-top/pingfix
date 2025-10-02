import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/home/base.css";
import "../styles/home/components.css";
import {Link, NavLink } from "react-router-dom"
import logo from "../assets/logo.png";
import h1 from "../assets/home/h1.png";
import h2 from "../assets/home/h2.png";
import h3 from "../assets/home/h3.png";
import h4 from "../assets/home/h4.png";

function Home() {
  const[menuopen, setMenuopen] = useState(false)
  const navigate = useNavigate()
  const goToRegister = () => {
    navigate('/register')
  }

  return (
    <>
       <div className="navbar">
        <img src={logo} alt="Logo"  className="logo" />
        <div>
        <a href="/login">Login</a>
        <button onClick={goToRegister}>SignUp</button>
        </div>
        

        </div> 
        
        <div className="slogan">
          <h1>Let's Fix Your  <br />
          <span className="comm">Communities!</span>
          </h1>
        </div>

        <div className="features">
        <div className="card">
          <img src={h1} alt="restore communities" />
          <p className="overlay-text">Restore Communities</p>
        </div>

        <div className="card">
          <img src={h2} alt="Logo" />
          <p className="overlay-text">Post Fixes</p>
        </div>

        <div className="card">
          <img src={h3} alt="Logo" />
          <p className="overlay-text">Join Groups</p>
        </div>

        <div className="card">
          <img src={h4} alt="Logo" />
          <p className="overlay-text">Save Wildlife</p>
        </div>
        </div>

        <div className="signup">
        <button onClick={goToRegister}>SignUp Now</button>
        </div>

        

        {/* Next Section */}
        <div className="divider-with-text">
        <span className="divider-text">Spot it. Ping it. Fix it.</span>
        </div>

        <div className="card">
          <img src={h4} alt="Logo" />
          <p className="overlay-text">Save Wildlife</p>
        </div>


      
    </>
  );
}

export default Home;
