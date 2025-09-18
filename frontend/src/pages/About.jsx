import React from "react";
import Header from "../components/Header";
import Footer from "../components/footer";
import "../styles/About.css";

export default function About() {
  return (
    <>
      <Header />

      <main className="about-page">
        <div className="about-card">
          {/* Top Section */}
          <div className="about-header">
            <div className="about-text">
              <h1>About IdeaForge</h1>
              <p className="about-subtitle">
                Where Ideas Turn Into Reality with Intelligent Insights
              </p>
            </div>
            <div className="about-image">
              <img
                src="/logo-black.png"
                alt="IdeaForge Logo"
                className="about-logo"
              />
            </div>
          </div>

          {/* Mission */}
          <section className="about-section mission">
            <h2>Our Mission</h2>
            <p>
              At IdeaForge, we empower entrepreneurs, startups, and investors by
              transforming innovative ideas into actionable businesses. Our
              platform provides intelligent insights, tools, and resources to
              help you stay ahead of the competition.
            </p>
          </section>

          {/* Core Values */}
          <section className="about-section values">
            <h2>Our Core Values</h2>
            <div className="values-grid">
              <div className="value-card">
                <span className="icon">🚀</span>
                <h3>Innovation</h3>
                <p>Pushing boundaries with forward-thinking solutions.</p>
              </div>
              <div className="value-card">
                <span className="icon">🤝</span>
                <h3>Collaboration</h3>
                <p>We grow stronger by working together with our community.</p>
              </div>
              <div className="value-card">
                <span className="icon">📈</span>
                <h3>Growth</h3>
                <p>Helping businesses scale with smart insights.</p>
              </div>
              <div className="value-card">
                <span className="icon">🌍</span>
                <h3>Impact</h3>
                <p>Creating solutions that matter in the real world.</p>
              </div>
            </div>
          </section>

          {/* Meet the Team */}
          <section className="about-section team">
            <h2>Meet Our Team</h2>
            <div className="team-grid">
              <div className="team-card">
                <h3>Zeidh Wazeer</h3>
                <p className="role">Founder & CEO</p>
                <p className="bio">
                  Visionary leader with experience in tech, sotfware engineering and architecture.
                </p>
              </div>
              <div className="team-card">
                <h3>Nabeel Naushad</h3>
                <p className="role">Co-Founder and Managing director</p>
                <p className="bio">
                  Expert in AI and cloud systems, passionate about scaling
                  innovative solutions.
                </p>
              </div>
              <div className="team-card">
                <h3>Mihadh Infiyaaz</h3>
                <p className="role">Co-Founder & Software Developer</p>
                <p className="bio">
                  Exploring AI, cybersecurity, and software development with a passion for 
                  innovation and continuous learning.
                </p>
              </div>
              <div className="team-card">
                <h3>Sarah Lee</h3>
                <p className="role">Product Manager</p>
                <p className="bio">
                  Drives product strategy and ensures user-centric design across
                  all platforms.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
