import React, { useEffect, useState } from "react";
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
  const [activeReview, setActiveReview] = useState(0);

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

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveReview((prev) => (prev + 1) % reviews.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [reviews.length]);

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

        <section className="demo-section">
          <div className="demo-header">
            <p className="demo-kicker">App Demonstration</p>
            <h2>How teams use PingFix to close issues faster</h2>
            <p>
              A simple flow that helps residents report, coordinate, and resolve
              local problems with clear accountability.
            </p>
          </div>

          <div className="demo-grid">
            <article className="demo-card">
              <img src={h2} alt="Report issue" />
              <div>
                <h3>1. Report in minutes</h3>
                <p>Upload evidence, location context, and details so the right group can act quickly.</p>
              </div>
            </article>
            <article className="demo-card">
              <img src={h3} alt="Coordinate in groups" />
              <div>
                <h3>2. Coordinate in groups</h3>
                <p>Residents and moderators discuss updates, add comments, and keep one shared thread.</p>
              </div>
            </article>
            <article className="demo-card">
              <img src={h1} alt="Resolve transparently" />
              <div>
                <h3>3. Verify resolution</h3>
                <p>Community voting and progress signals help confirm when the issue is truly fixed.</p>
              </div>
            </article>
          </div>
        </section>

        <section className="reviews-section">
          <div className="demo-header">
            <p className="demo-kicker">User Reviews</p>
            <h2>What communities are saying</h2>
          </div>

          <div className="reviews-carousel">
            <button
              className="carousel-btn"
              onClick={() => setActiveReview((activeReview - 1 + reviews.length) % reviews.length)}
              aria-label="Previous review"
            >
              ‹
            </button>
            <div className="reviews-window">
              <div
                className="reviews-track"
                style={{ transform: `translateX(-${activeReview * 100}%)` }}
              >
                {reviews.map((review, idx) => (
                  <article className="review-card" key={idx}>
                    <p>“{review.quote}”</p>
                    <div className="review-meta">
                      <strong>{review.name}</strong>
                      <span>{review.role}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <button
              className="carousel-btn"
              onClick={() => setActiveReview((activeReview + 1) % reviews.length)}
              aria-label="Next review"
            >
              ›
            </button>
          </div>

          <div className="carousel-dots">
            {reviews.map((_, idx) => (
              <button
                key={idx}
                className={`dot ${idx === activeReview ? "active" : ""}`}
                onClick={() => setActiveReview(idx)}
                aria-label={`Go to review ${idx + 1}`}
              />
            ))}
          </div>

          <div className="signup">
            <button onClick={goToRegister}>Start Building Your Community Feed</button>
          </div>
        </section>


      
    </>
  );
}

export default Home;
