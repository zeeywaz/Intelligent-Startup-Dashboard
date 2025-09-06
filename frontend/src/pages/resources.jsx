import React from "react";
import "../styles/resources.css";
import { Link } from "react-router-dom";

export default function ResourcesServicesPage() {
  return (
    <main className="main">
      {/* Top Nav */}
      <header className="header">
        <div className="header-container">
          <div className="header-left">
            <div aria-hidden className="menu-icon">
              <i className="fa-solid fa-bars"></i>
            </div>
            <Link to="/" className="logo">
              Idea Forge
            </Link>
          </div>

          <nav className="nav-links">
            <Link to="/about" className="nav-link">
              About Us
            </Link>
            <Link to="/contact" className="nav-link">
              Contact
            </Link>
            <i className="fa-solid fa-bell icon" title="Notifications"></i>
            <i className="fa-solid fa-user profile" title="Profile"></i>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <h1 className="hero-title">Resources & Services</h1>
        <p className="hero-subtitle">
          Find helpful tools, guides, and services to boost your startup journey.
        </p>

        {/* Search */}
        <div className="search-bar">
          <i className="fa-solid fa-magnifying-glass search-icon"></i>
          <input
            aria-label="Search resources and services"
            className="search-input"
            placeholder="Hinted search text"
          />
          <button type="button" aria-label="Search" className="search-btn">
            <i className="fa-solid fa-arrow-right search-btn-icon"></i>
          </button>
        </div>
      </section>

      {/* Cards */}
      <section className="cards">
        <Card
          title="Warehouses"
          desc="Find out possible locations to store your physical goods"
          badge={<i className="fa-solid fa-warehouse badge"></i>}
          avatarLetter=""
          to="/resources/warehouses"
        />
        <Card
          title="Wholesalers"
          desc="Find sources to get your goods from"
          avatarLetter="W"
          to="/resources/wholesalers"
        />
        <Card
          title="Office Spaces"
          desc="Organize and track your startup tasks efficiently with meetings"
          avatarLetter="O"
          to="/resources/office-spaces"
        />
        <Card
          title="Transport Services"
          desc="Deliver your goods from one location to another without delays"
          avatarLetter="T"
          to="/resources/transport"
        />
        <Card
          title="Security Services"
          desc="Make sure your store is secure"
          avatarLetter="S"
          to="/resources/security"
        />
      </section>

      {/* Footer */}
      <footer className="footer">
        {/* Row 1 */}
        <div className="footer-top">
          <div className="footer-left">
            <img
              className="footer-logo"
              src="https://placehold.co/129x16"
              alt="IDEAFORGE"
            />
            <div className="socials">
              <a href="#" className="social">
                <i className="fa-brands fa-facebook-f"></i>
              </a>
              <a href="#" className="social">
                <i className="fa-brands fa-x"></i>
              </a>
              <a href="#" className="social">
                <i className="fa-brands fa-instagram"></i>
              </a>
              <a href="#" className="social">
                <i className="fa-brands fa-linkedin-in"></i>
              </a>
            </div>
          </div>

          {/* Center columns */}
          <div className="footer-center">
            <div className="footer-columns">
              <FooterCol
                title="Navigation"
                items={[
                  { to: "/resources", label: "Resources and Services" },
                  { to: "/competitors", label: "Other Business/ Competitors" },
                  { to: "/sponsors", label: "Sponsors/Investors" },
                  { to: "/startup", label: "My startup" },
                ]}
              />
              <FooterCol
                title="Explore"
                items={[
                  { to: "/explore/navigation", label: "Navigation" },
                  { to: "/explore/analytics", label: "Analytics" },
                ]}
              />
              <FooterCol
                title="Resources"
                items={[
                  { to: "/about", label: "About Us" },
                  { to: "/contact", label: "Contact" },
                  { to: "/feedback", label: "Help Us Improve" },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Row 2 */}
        <div className="footer-bottom">
          <div className="contact-blocks">
            <ContactBlock
              icon={<i className="fa-solid fa-envelope"></i>}
              title="Email"
              lines={["Reach us at:", "support@IDEAFORGE.com"]}
            />
            <ContactBlock
              icon={<i className="fa-solid fa-phone"></i>}
              title="Phone"
              lines={["Call us anytime:", "+94 123456789"]}
            />
            <ContactBlock
              icon={<i className="fa-solid fa-building"></i>}
              title="Office"
              lines={["123, sample St. Colombo 10", "Get Directions >"]}
            />
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ---------- Components ---------- */

function Card({ title, desc, avatarLetter, badge, to }) {
  return (
    <article className="card">
      <div className="card-header">
        <div className="avatar">
          {avatarLetter ? <span className="avatar-text">{avatarLetter}</span> : null}
        </div>
        {badge}
      </div>

      <h3 className="card-title">{title}</h3>
      <p className="card-desc">{desc}</p>

      <Link to={to} className="card-btn">
        Explore
      </Link>
    </article>
  );
}

function FooterCol({ title, items }) {
  return (
    <div className="footer-col">
      <h3 className="footer-col-title">{title}</h3>
      <ul className="footer-list">
        {items.map((i) => (
          <li key={i.to}>
            <Link to={i.to}>{i.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContactBlock({ icon, title, lines }) {
  return (
    <div className="contact-block">
      <div className="contact-icon-box">{icon}</div>
      <div className="contact-title">{title}</div>
      <div className="contact-lines">
        {lines.map((l, i) => (
          <div key={i} className={i === 0 ? "" : "mt-2"}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}
