// src/components/Footer.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./footer.css";
import { Mail, Phone, MapPin, Twitter, Instagram, Youtube, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";
import { API_BASE } from "../lib/api";

export default function Footer() {
  const [homePath, setHomePath] = useState("/");
  const [roles, setRoles] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/me/`, { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        setMe(j || {});
        const rs = Array.isArray(j?.roles) ? j.roles : [];
        setRoles(rs);

        const computed =
          (j?.user?.is_superuser || rs.some(r => String(r).toLowerCase().includes("admin")))
            ? "/admindashboard"
            : rs.some(r => String(r).toLowerCase().includes("investor"))
              ? "/investordashboard"
              : j?.authenticated
                ? "/userdashboard"
                : "/";

        setHomePath(j?.next || computed);
      } catch {
        setMe(null);
        setRoles([]);
        setHomePath("/");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const isAuthed = !!me?.authenticated;
  const isAdmin =
    !!me?.user?.is_superuser ||
    roles.some(r => String(r).toLowerCase().includes("admin"));
  const isInvestor = roles.some(r => String(r).toLowerCase().includes("investor"));
  const isUser = isAuthed && !isAdmin && !isInvestor;

  // Exactly the links you want per role (NO icons here)
  const navLinks = useMemo(() => {
    if (isAdmin) {
      return [
        { to: "/resources", label: "Edit Resource & Services" },
        { to: "/competitors", label: "Edit Other Business & Competitors" },
        { to: "/investors", label: "Edit Sponsors and Investors" },
        { to: "/admin_user", label: "User Management" },
      ];
    }
    if (isInvestor) {
      return [
        { to: "/competitors", label: "Business & Startups" },
        { to: "/investors", label: "Sponsors and Investors" },
        { to: "/interests", label: "My interest" },
      ];
    }
    if (isUser) {
      return [
        { to: "/resources", label: "Resource & Services" },
        { to: "/competitors", label: "Other Business & Competitors" },
        { to: "/investors", label: "Sponsors and Investors" },
        { to: "/mystartup", label: "My Startup" },
      ];
    }
    // Not signed in
    return [
      { to: "/", label: "Home" },
      { to: "/resources", label: "Resources" },
      { to: "/competitors", label: "Businesses" },
      { to: "/investors", label: "Sponsors" },
    ];
  }, [isAdmin, isInvestor, isUser]);

  if (loading) return <footer className="footer">Loading...</footer>;

  return (
    <footer className="footer">
      <div className="footer-grid">
        {/* Brand / Social */}
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

        {/* Navigation – role-specific ONLY (no icons) */}
        <div className="footer-section left-align">
          <h2>Navigation</h2>
          <ul>
            {navLinks.map(({ to, label }, i) => (
              <li key={i}><Link to={to}>{label}</Link></li>
            ))}
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

      {/* Contact */}
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
