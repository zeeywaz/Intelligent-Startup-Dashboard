// src/components/Footer.jsx
import React, { useEffect, useState } from "react";
import "./footer.css";
import {
  Mail,
  Phone,
  MapPin,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  Boxes,
  Store,
  Wallet,
  BrainCircuit
} from "lucide-react";
import { Link } from "react-router-dom";
import { API_BASE } from "../lib/api";

export default function Footer() {
  const [homePath, setHomePath] = useState("/");
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/me/`, { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        console.log("Footer API Response:", j);

        const authenticated = !!j?.authenticated;
        setIsAuthenticated(authenticated);

        if (authenticated) {
          const rs = Array.isArray(j.roles) ? j.roles : [];
          setRoles(rs);

          const computed =
            rs.some(r => String(r).toLowerCase().includes("investor")) ? "/investordashboard" :
            rs.some(r => String(r).toLowerCase().includes("admin")) ? "/admindashboard" :
            "/userdashboard";

          setHomePath(j.next || computed);
        } else {
          setRoles([]);
          setHomePath("/");
        }
      } catch (error) {
        console.error("Footer fetch failed:", error);
        setRoles([]);
        setHomePath("/");
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const isAdmin = roles.some(role => String(role).toLowerCase().includes("admin"));
  const isInvestor = roles.some(role => String(role).toLowerCase().includes("investor"));
  const isUser = isAuthenticated && !isAdmin && !isInvestor;

  if (isLoading) return <footer className="footer">Loading...</footer>;

  return (
    <footer className="footer">
      <div className="footer-grid">
        {/* Logo / Socials */}
        <div>
          <Link to={homePath} aria-label="IdeaForge Home" className="footer-logo-link">
            <img src="/logo-white.png" alt="IdeaForge" className="footer-logo" height={40} width={200} />
          </Link>
          <div className="footer-socials">
            <a href="https://twitter.com/" target="_blank" rel="noreferrer" aria-label="Twitter"><Twitter size={20} /></a>
            <a href="https://instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={20} /></a>
            <a href="https://youtube.com/" target="_blank" rel="noreferrer" aria-label="YouTube"><Youtube size={20} /></a>
            <a href="https://linkedin.com/" target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin size={20} /></a>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="footer-section left-align">
          <h2>Navigation</h2>
          <ul>
            {/* User and Admin see My Startup */}
            {(isUser || isAdmin) && <li><Link to="/mystartup">My Startup</Link></li>}

            {/* Resources hidden for Investors */}
            {!isInvestor && <li><Link to="/resources">Resources and Services</Link></li>}

            <li><Link to="/competitors">Other Businesses</Link></li>
            <li><Link to="/investors">Sponsors</Link></li>

            {/* New: Your Interests visible to any authenticated user */}
            {isAuthenticated && <li><Link to="/interests">Your Interests</Link></li>}

            {/* Admin-specific management links */}
            {isAdmin && (
              <>
                <li><Link to="/admin/resources"><Boxes size={16} /> Edit Resource &amp; Services</Link></li>
                <li><Link to="/admin/competitors"><Store size={16} /> Edit Other Business &amp; Competitors</Link></li>
                <li><Link to="/admin/investors"><Wallet size={16} /> Edit Sponsors and Investors</Link></li>
                <li><Link to="/admin_user"><BrainCircuit size={16} /> User Management</Link></li>
              </>
            )}
          </ul>
        </div>

        {/* Explore */}
        <div className="footer-section left-align">
          <h2>Explore</h2>
          <ul>
            <li><Link to={homePath}>Home</Link></li>
            {isUser && <li><a href="/userdashboard#analytics">Analytics</a></li>}
            {isAdmin && <li><a href="/admindashboard#analytics">Analytics</a></li>}
            {isInvestor && <li><a href="/investordashboard#analytics">Analytics</a></li>}
          </ul>
        </div>

        {/* Resources */}
        <div className="footer-section left-align">
          <h2>Resources</h2>
          <ul>
            <li><a href="/about">About Us</a></li>
            <li><a href="/contact">Help us Improve</a></li>
          </ul>
        </div>
      </div>

      {/* Contact Info */}
      <div className="footer-contact">
        <p><Mail size={18} className="icon" /> <span>Email:</span> <a href="mailto:support@ideaforge.com">support@ideaforge.com</a></p>
        <p><Phone size={18} className="icon" /> <span>Phone:</span> <a href="tel:+941234567890">+94 123 456 7890</a></p>
        <p><MapPin size={18} className="icon" /> <span>Location:</span> 123 Sample St. Colombo</p>
      </div>

      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} IdeaForge. All rights reserved.
      </div>
    </footer>
  );
}
