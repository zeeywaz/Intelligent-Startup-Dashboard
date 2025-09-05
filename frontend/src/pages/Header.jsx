import React, { useEffect, useState } from "react";
import "./Header.css";
import { Menu, X } from "lucide-react";

export default function Header() {
  const [open, setOpen] = useState(false);

  // close on ESC
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // auto-close if viewport grows beyond mobile breakpoint
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header className="header">
      {/* optional: works if your <main> has id="main" */}
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

          <h1 className="logo">IdeaForge</h1>
        </div>

        <nav
          id="primary-nav"
          className={`nav ${open ? "nav--open" : ""}`}
          aria-label="Primary"
        >
          <a href="#about" className="nav__link" onClick={() => setOpen(false)}>About Us</a>
          <a href="#contact" className="nav__link" onClick={() => setOpen(false)}>Contact</a>
          <a href="#profile" className="nav__link" onClick={() => setOpen(false)}>Profile</a>
        </nav>
      </div>
    </header>
  );
}
