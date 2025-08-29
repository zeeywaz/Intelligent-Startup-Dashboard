import React from "react";

const Home = () => {
  return (
    <div>
      <header className="hero">
        <h1>Welcome to IdeaForge 🚀</h1>
        <p>Where Ideas Turn into Reality with AI Assistance</p>
        <button>Get Started</button>
        <button>Learn More</button>
      </header>

      <section className="features">
        <h2>Empower Your Ideas Today</h2>
        <div className="cards">
          <div className="card">📊 Market Insights</div>
          <div className="card">🤝 Competitor Analysis</div>
          <div className="card">💡 Investor Matching</div>
        </div>
      </section>

      <footer>
        <p>© 2025 IdeaForge | Helping You Build Smarter Startups</p>
      </footer>
    </div>
  );
};

export default Home;
