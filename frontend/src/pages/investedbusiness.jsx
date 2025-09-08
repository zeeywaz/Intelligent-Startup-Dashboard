import React from "react";
import Header from "../components/Header.jsx";     // keep if you already use this
import Footer from "../components/footer.jsx";     // keep if you already use this
import "../styles/investedbusiness.css";

function Card() {
  return (
    <div className="ib-card">
      <div className="ib-left">
        <div className="ib-avatar" aria-hidden>🅰️</div>
        <div>
          <p className="ib-title">Header</p>
          <p className="ib-sub">Subhead</p>
        </div>
      </div>

      <div className="ib-actions">
        <button className="ib-pill" aria-label="Action 1"></button>
        <button className="ib-pill" aria-label="Action 2"></button>
      </div>
    </div>
  );
}

export default function InvestedBusinesses() {
  return (
    <div className="app">
      <Header />

      <main className="ib-main">
        <div className="ib-container">
          <h1 className="ib-h1">Invested Businesses / Potential Businesses</h1>

          <div className="ib-grid">
            <div className="ib-col">
              <Card /><Card /><Card />
            </div>
            <div className="ib-col">
              <Card /><Card /><Card />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
