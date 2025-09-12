import React, { useEffect, useState } from "react";
import "./Header.css";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

export default function Header() {
  const [open, setOpen] = useState(false);       // mobile nav
  const [profileOpen, setProfileOpen] = useState(false); // profile menu

  // close on ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // auto-close mobile on resize
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const signOut = () => {
    try { localStorage.removeItem("token"); } catch {}
    window.location.assign("/login");
  };

  return (
    <header className="header">
      <a className="skip-link" href="#main">Skip to content</a>

      <div className="header__row">
        <div className="header__left">
          <button
            className="menu-btn"
            aria-label="Toggle navigation"
            aria-expanded={open}
            aria-controls="primary-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={28} aria-hidden /> : <Menu size={28} aria-hidden />}
          </button>

          <h1 className="site-logo">
            <Link to="/userdashboard" className="site-logo__link">IdeaForge</Link>
          </h1>
        </div>

        <nav
          id="primary-nav"
          className={`nav ${open ? "nav--open" : ""}`}
          aria-label="Primary"
        >
          <a href="/#about" className="nav__link" onClick={() => setOpen(false)}>About Us</a>
          <a href="/#contact" className="nav__link" onClick={() => setOpen(false)}>Contact</a>
        </nav>

        {/* Profile menu */}
        <div className="header__right">
          <button
            className="profile-btn"
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            onClick={() => setProfileOpen((v) => !v)}
            title="Profile"
          >
            <span className="profile-initial">A</span>
          </button>

          {profileOpen && (
            <div className="profile-menu" role="menu">
              <Link
                to="/profile"
                className="profile-item"
                role="menuitem"
                onClick={() => setProfileOpen(false)}
              >
                Settings
              </Link>
              <button
                type="button"
                className="profile-item profile-item--danger"
                role="menuitem"
                onClick={signOut}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
