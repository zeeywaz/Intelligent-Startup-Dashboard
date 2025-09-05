// Footer.jsx
import React from "react";
import "./footer.css";
import { Mail, Phone, MapPin, Twitter, Instagram, Youtube, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        {/* Logo / Left section */}
        <div>
          <h1 className="logo">IdeaForge</h1>

          {/* Social Icons */}
          <div className="footer-socials">
            <a href="/#" aria-label="Twitter"><Twitter size={20} /></a>
            <a href="/#" aria-label="Instagram"><Instagram size={20} /></a>
            <a href="/#" aria-label="YouTube"><Youtube size={20} /></a>
            <a href="/#" aria-label="LinkedIn"><Linkedin size={20} /></a>
          </div>
        </div>

        {/* Navigation */}
        <div className="footer-section left-align">
          <h2>Navigation</h2>
          <ul>
            <li><a href="/#">Resources and Services</a></li>
            <li><a href="/#">Other Business</a></li>
            <li><a href="/#">Sponsors</a></li>
            <li><a href="/#">My Startup</a></li>
          </ul>
        </div>

        {/* Explore */}
        <div className="footer-section left-align">
          <h2>Explore</h2>
          <ul>
            <li><a href="/#">Navigation</a></li>
            <li><a href="/#">Analytics</a></li>
          </ul>
        </div>

        {/* Resources */}
        <div className="footer-section left-align">
          <h2>Resources</h2>
          <ul>
            <li><a href="/#">About Us</a></li>
            <li><a href="/#">Contact</a></li>
            <li><a href="/#">Help Us Improve</a></li>
          </ul>
        </div>
      </div>

      {/* Contact info block */}
      <div className="footer-contact">
        <p>
          <Mail size={18} className="icon" />
          <span>Email:</span>&nbsp;
          <a href="mailto:support@ideaforge.com">support@ideaforge.com</a>
        </p>
        <p>
          <Phone size={18} className="icon" />
          <span>Phone:</span>&nbsp;
          <a href="tel:+941234567890">+94 123 456 7890</a>
        </p>
        <p>
          <MapPin size={18} className="icon" />
          <span>Location:</span>&nbsp;
          123 Sample St. Colombo
        </p>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} IdeaForge. All rights reserved.
      </div>
    </footer>
  );
}
