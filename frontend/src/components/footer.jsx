// Footer.jsx
import React, { useEffect, useState } from "react";
import "./footer.css";
import { Mail, Phone, MapPin, Twitter, Instagram, Youtube, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";
import { API_BASE } from "../lib/api";

export default function Footer() {
  // role-aware destinations (same logic as Header)
  const [homePath, setHomePath] = useState("/");
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/me/`, { credentials: "include" });
        const j = await r.json();
        if (j?.authenticated) {
          const rs = j.roles || [];
          setRoles(rs);
          const computed =
            rs.includes("Investor") ? "/investordashboard" :
            rs.includes("Admin")    ? "/admindashboard"    :
                                      "/userdashboard";
          setHomePath(j.next || computed);
        } else {
          setRoles([]);
          setHomePath("/");
        }
      } catch {
        setRoles([]);
        setHomePath("/");
      }
    })();
  }, []);

  // show analytics only on the entrepreneur dashboard (where charts exist)
  const showAnalytics = roles.length === 0 || (!roles.includes("Admin") && !roles.includes("Investor"));
  const analyticsHref = "/userdashboard#analytics";

  return (
    <footer className="footer">
      <div className="footer-grid">
        {/* Logo / Left section */}
        <div>
          <Link to={homePath} aria-label="IdeaForge Home" className="footer-logo-link">
            <img
              src="/logo-white.png"
              alt="IdeaForge"
              className="footer-logo"
              height={40}
              width={200}
            />
          </Link>

          {/* Social Icons */}
          <div className="footer-socials">
            <a href="https://twitter.com/" target="_blank" rel="noreferrer" aria-label="Twitter"><Twitter size={20} /></a>
            <a href="https://instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={20} /></a>
            <a href="https://youtube.com/" target="_blank" rel="noreferrer" aria-label="YouTube"><Youtube size={20} /></a>
            <a href="https://linkedin.com/" target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin size={20} /></a>
          </div>
        </div>

        {/* Navigation */}
        <div className="footer-section left-align">
          <h2>Navigation</h2>
          <ul>
            <li><Link to="/resources">Resources and Services</Link></li>
            <li><Link to="/competitors">Other Business</Link></li>
            <li><Link to="/investors">Sponsors</Link></li>
            <li><Link to="/mystartup">My Startup</Link></li>
          </ul>
        </div>

        {/* Explore */}
        <div className="footer-section left-align">
          <h2>Explore</h2>
          <ul>
            <li><Link to={homePath}>Navigation</Link></li>
            {showAnalytics && (
              <li><a href={analyticsHref}>Analytics</a></li>
            )}
          </ul>
        </div>

        {/* Resources */}
        <div className="footer-section left-align">
          <h2>Resources</h2>
          <ul>
            <li><a href="/about">About Us</a></li>
            <li><a href="/contact">Contact</a></li>
            <li><a href="/contact">Help Us Improve</a></li>
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
          <span>Location:</span>&nbsp; 123 Sample St. Colombo
        </p>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} IdeaForge. All rights reserved.
      </div>
    </footer>
  );
}
