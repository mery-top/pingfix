import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/home/base.css";
import "../styles/home/components.css";
import logo from "../assets/logo.png";
import h1 from "../assets/home/h1.png";
import h2 from "../assets/home/h2.png";
import h3 from "../assets/home/h3.png";
import h4 from "../assets/home/h4.png";

function Home() {
  const navigate = useNavigate()

  const reviews = [
    {
      quote:
        "PingFix made our ward-level reporting structured. We no longer lose updates in random chats.",
      name: "Asha Menon",
      role: "Community Lead, Ward 12",
    },
    {
      quote:
        "The photo-first workflow and status tracking helped us close recurring drainage complaints faster.",
      name: "Rahul Verma",
      role: "Volunteer Moderator",
    },
    {
      quote:
        "Clean, practical, and transparent. Residents can actually see which issues moved to resolved.",
      name: "Neha Krishnan",
      role: "Resident Member",
    },
  ];

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
        <span className="divider-text">Spot it. Ping it. Share it.</span>
        </div>

        <section className="showcase-section">
          <div className="showcase-copy">
            <p className="demo-kicker">Product Walkthrough</p>
            <h2>Community operations in one focused workspace</h2>
            <p>
              PingFix combines reporting, moderation, and verification into a single
              stream so local teams can move from complaint to closure without noise.
            </p>
            <button className="showcase-cta" onClick={goToRegister}>
              Explore PingFix
            </button>
          </div>

          <div className="showcase-visual">
            <article className="showcase-card main">
              <img src={h2} alt="Issue reporting feed" />
              <div>
                <h3>Post and route issues in minutes</h3>
                <p>Evidence-first reports with images, tags, and context for fast action.</p>
              </div>
            </article>
            <article className="showcase-card floating top">
              <img src={h3} alt="Group collaboration" />
              <div>
                <h4>Group coordination</h4>
                <p>One thread. Clear owners.</p>
              </div>
            </article>
            <article className="showcase-card floating bottom">
              <img src={h1} alt="Resolution workflow" />
              <div>
                <h4>Verified closure</h4>
                <p>Community-backed resolution signal.</p>
              </div>
            </article>
          </div>
        </section>

        <section className="reviews-section">
          <div className="demo-header">
            <p className="demo-kicker">Community Feedback</p>
            <h2>Trusted by moderators and residents</h2>
          </div>

          <div className="reviews-orbit">
            {reviews.map((review, idx) => (
              <article className="review-card" key={idx}>
                <div className="review-stars" aria-label="5 star rating">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                </div>
                <p>“{review.quote}”</p>
                <div className="review-meta">
                  <strong>{review.name}</strong>
                  <span>{review.role}</span>
                </div>
              </article>
            ))}
          </div>

          <div className="signup">
            <button onClick={goToRegister}>Start Building Your Community Feed</button>
          </div>
        </section>

        <footer className="home-footer">
          <div className="home-footer-inner">
            <div className="footer-top">
              <img src={logo} alt="PingFix" className="footer-logo" />
              <p>Citizen-first platform for transparent community issue resolution.</p>
            </div>

            <div className="footer-grid">
              <div className="footer-col">
                <h4>Initiatives</h4>
                <a href="#fund">Fund Us</a>
                <a href="#movement">Join This Social Movement</a>
                <a href="/register">Volunteer With Us</a>
              </div>

              <div className="footer-col">
                <h4>Platform</h4>
                <a href="/register">Post an Issue</a>
                <a href="/register">Join Groups</a>
                <a href="/register">Track Resolution</a>
              </div>

              <div className="footer-col">
                <h4>Community</h4>
                <a href="/register">Success Stories</a>
                <a href="/register">Moderator Network</a>
                <p className="footer-love">Wall of love <span>❤</span></p>
              </div>

              <div className="footer-col">
                <h4>Contact Us</h4>
                <p>vircsamenterprises@gmail.com</p>
                <a href="mailto:vircsamenterprises@gmail.com">
                  Write to us
                </a>
              </div>
            </div>

            <div className="footer-bottom">
              <p>Copyright © 2026 PingFix. All rights reserved.</p>
            </div>
          </div>
        </footer>


      
    </>
  );
}

export default Home;
