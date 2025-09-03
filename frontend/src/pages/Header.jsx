import React from "react";
import "./Header.css";
import { Menu } from "lucide-react";

export default function Header() {
  return (
    <header className="header">
      {}
      <div className="header-left">
        <button className="menu-btn">
          <Menu size={28} />
        </button>
        <h1 className="logo">IdeaForge</h1>
      </div>

      {}
      <nav className="header-right">
        <a href="#about">About Us</a>
        <a href="#contact">Contact</a>
        <a href="#profile">Profile</a>
      </nav>
    </header>
  );
}