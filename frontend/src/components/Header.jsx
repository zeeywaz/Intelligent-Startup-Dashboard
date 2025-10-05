import React, { useEffect, useRef, useState } from "react";
import "./Header.css";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Bell, BellDot, Mail, Info, LogIn as LogInIcon } from "lucide-react";
import { API_BASE, getCookie } from "../lib/api";

const cx = (...l) => l.filter(Boolean).join(" ");

export default function Header() {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [userInitial, setUserInitial] = useState("?");
  const [userName, setUserName] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [homePath, setHomePath] = useState("/");

  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  /* -------- fetch user -------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/me/`, { credentials: "include" });
        const j = await res.json();
        if (j?.authenticated && j?.user) {
          setIsLoggedIn(true);
          const { firstName, username } = j.user;
          const ini = (firstName?.[0] || username?.[0] || "?").toUpperCase();
          setUserInitial(ini);
          setUserName(username || "");

          const roles = j.roles || [];
          const computed =
            roles.includes("Investor") ? "/investordashboard" :
            roles.includes("Admin")    ? "/admindashboard"    :
                                         "/userdashboard";

          setHomePath(j.next || computed);
        } else {
          setIsLoggedIn(false);
          setUserInitial("?");
          setHomePath("/");
        }
      } catch {
        setIsLoggedIn(false);
        setUserInitial("?");
        setHomePath("/");
      }
    })();
  }, []);

  /* -------- fetch notifications -------- */
  useEffect(() => {
    if (!isLoggedIn) return;
    
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
  }, [isLoggedIn]);

  /* -------- handlers -------- */
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

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const signOut = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/logout/`, {
        method: "POST",
        credentials: "include",
        headers: { "X-CSRFToken": getCookie("csrftoken") },
      });
      if (res.ok) {
        localStorage.removeItem("if_name");
        localStorage.removeItem("if_bt");
        setIsLoggedIn(false);
        navigate("/login");
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.detail || "Logout failed");
      }
    } catch (err) {
      console.error("Logout error", err);
      alert("Logout failed");
    }
  };

  // Don't render anything until we know the auth status
  if (isLoggedIn === null) {
    return (
      <header className="ifx-navbar">
        <div className="ifx-bar">
          <nav className="ifx-navbar__row" aria-label="Primary">
            <Link to="/" className="ifx-navbar__brand" aria-label="IdeaForge home">
              <img src="/logo-black.png" alt="IdeaForge" className="ifx-logo-img" />
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  /* -------- render -------- */
  return (
    <header className="ifx-navbar">

      <div className="ifx-bar">
        <nav className="ifx-navbar__row" aria-label="Primary">
          {/* Logo */}
          <Link to={homePath} className="ifx-navbar__brand" aria-label="IdeaForge home">
            <img src="/logo-black.png" alt="IdeaForge" className="ifx-logo-img" />
          </Link>

          <div className="ifx-navbar__right">
            <button
              className="ifx-nav__toggle"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen(v => !v)}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>

            <ul className={cx("ifx-nav", open && "is-open")} role="list">
              <li className="ifx-nav__item">
                <Info size={18} aria-hidden />
                <Link to="/about" className="ifx-nav__link">About Us</Link>
              </li>
              <li className="ifx-nav__item">
                <Mail size={18} aria-hidden />
                <Link to="/contact" className="ifx-nav__link">Contact</Link>
              </li>
              {/* Mobile login - using the same style as home page */}
              {!isLoggedIn && (
                <li className="ifx-nav__login--mobile">
                  <Link to="/login" className="ifx-nav__link ifx-nav__link--login">
                    <LogInIcon size={20} aria-hidden /> Log In
                  </Link>
                </li>
              )}
            </ul>

            {/* Desktop login & user actions */}
            <div className="ifx-navbar__actions">
              {/* Show login button when logged out */}
              {!isLoggedIn && (
                <div className="ifx-login--desktop">
                  <Link to="/login" className="ifx-nav__link ifx-nav__link--login">
                    <LogInIcon size={20} aria-hidden /> Log In
                  </Link>
                </div>
              )}

              {/* Show notifications and profile when logged in */}
              {isLoggedIn && (
                <>
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
                                {n.message && <div className="notif-body">{n.message}</div>}
                                {n.created_at && (
                                  <time className="notif-time" dateTime={n.created_at}>
                                    {new Date(n.created_at).toLocaleString()}
                                  </time>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Profile */}
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
                </>
              )}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}