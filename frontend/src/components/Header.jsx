import React, { useEffect, useRef, useState } from "react";
import "./Header.css";
import { Link } from "react-router-dom";
import { Menu, X, Bell, BellDot, Mail } from "lucide-react";
import { API_BASE } from "../lib/api";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const [userInitial, setUserInitial] = useState("?");
  const [userName, setUserName] = useState("");
  const [notifications, setNotifications] = useState([]);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/me/`, { credentials: "include" });
        const j = await res.json();
        if (j?.authenticated && j?.user) {
          const { firstName, username } = j.user;
          const ini = (firstName?.[0] || username?.[0] || "?").toUpperCase();
          setUserInitial(ini);
          setUserName(username || "");
        } else {
          setUserInitial("?");
        }
      } catch {
        setUserInitial("?");
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/notifications/`, { credentials: "include" });
        if (!res.ok) throw new Error();
        const j = await res.json();
        setNotifications(Array.isArray(j) ? j : []);
      } catch {
        setNotifications([]);
      }
    })();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setProfileOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const onDown = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const signOut = async () => {
    try {
      await fetch(`${API_BASE}/api/logout/`, { method: "POST", credentials: "include" });
    } catch {}
    window.location.assign("/login");
  };

  return (
    <header className="header">
      <a className="skip-link" href="#main">Skip to content</a>

      <div className="header__row">
        {/* Left: burger + logo */}
        <div className="header__left">
          <button
            className="menu-btn"
            aria-label="Toggle navigation"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={28} aria-hidden /> : <Menu size={28} aria-hidden />}
          </button>

          <h1 className="site-logo">
            <Link to="/userdashboard" className="site-logo__link" aria-label="IdeaForge Home">
              <img
                src="/logo-black.png"
                alt="IdeaForge"
                className="site-logo__img"
                height={36}
                width={180}
              />
            </Link>
          </h1>
        </div>

        {/* Right side */}
        <div className="header__right">
          <nav className="nav-right" aria-label="Primary">
            <a href="/#about" className="nav__link">About Us</a>
            <a href="/#contact" className="nav__link">Contact</a>
          </nav>

          {/* Notifications */}
          <div className="notif-wrap" ref={notifRef}>
            <button
              className="notif-btn"
              aria-label="Notifications"
              aria-haspopup="dialog"
              aria-expanded={notifOpen}
              onClick={() => setNotifOpen((v) => !v)}
              title="Notifications"
            >
              {unreadCount > 0 ? <BellDot size={22} /> : <Bell size={22} />}
              {unreadCount > 0 && <span className="notif-dot" aria-hidden />}
            </button>

            {notifOpen && (
              <div className="notif-popover" role="dialog" aria-label="Notifications">
                {notifications.length === 0 ? (
                  <div className="notif-empty">
                    <Mail size={40} aria-hidden />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <ul className="notif-list" role="list">
                    {notifications.map((n) => (
                      <li key={n.id} className={`notif-item ${n.read ? "" : "notif-item--unread"}`}>
                        <div className="notif-title">{n.title || "Notification"}</div>
                        {n.body ? <div className="notif-body">{n.body}</div> : null}
                        {n.created_at ? (
                          <time className="notif-time" dateTime={n.created_at}>
                            {new Date(n.created_at).toLocaleString()}
                          </time>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Profile menu */}
          <div className="profile-wrap" ref={profileRef}>
            <button
              className="profile-btn"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen((v) => !v)}
              title={userName ? `Profile: ${userName}` : "Profile"}
            >
              <span className="profile-initial" aria-hidden>{userInitial}</span>
              <span className="sr-only">Open profile menu</span>
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
      </div>

      {/* Mobile sheet */}
      <nav
        id="mobile-nav"
        className={`nav-mobile ${open ? "nav-mobile--open" : ""}`}
        aria-label="Mobile"
      >
        <a className="nav-mobile__link" href="/#about" onClick={() => setOpen(false)}>
          About Us
        </a>
        <a className="nav-mobile__link" href="/#contact" onClick={() => setOpen(false)}>
          Contact
        </a>
        <Link className="nav-mobile__link" to="/resources" onClick={() => setOpen(false)}>
          Resources
        </Link>
      </nav>
    </header>
  );
}
