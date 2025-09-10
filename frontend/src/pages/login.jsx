import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/login.css";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const navigate = useNavigate();

  // Change this if your dashboard uses a different route, e.g. "/dashboard"
  const DASHBOARD_PATH = "/userdashboard";

  const update = (key) => (e) =>
    setForm((s) => ({ ...s, [key]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    // Accept anything for now; plug in real auth later
    navigate(DASHBOARD_PATH, { replace: true });
  };

  return (
    <div className="auth-app">
      {/* tiny brand */}
      <Link to="/" className="auth-brand" aria-label="IdeaForge home">
        ideaForge
      </Link>

      <main id="main" className="auth-main" role="main">
        <section className="auth-card" aria-label="Login">
          <header className="auth-head">
            <h1 className="auth-title">Welcome Back!</h1>
            <p className="auth-subtitle">Stay updated on your startups</p>
          </header>

          <form className="auth-form" onSubmit={onSubmit} noValidate>
            {/* Email */}
            <div className="auth-field">
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="Email"
                className="auth-input"
                value={form.email}
                onChange={update("email")}
              />
            </div>

            {/* Password */}
            <div className="auth-field auth-field--password">
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Password"
                className="auth-input"
                value={form.password}
                onChange={update("password")}
              />
              <button
                type="button"
                className="auth-toggle"
                onClick={() => setShowPwd((v) => !v)}
                aria-pressed={showPwd}
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? "Hide" : "Show"}
              </button>
            </div>

            <div className="auth-links">
              <Link to="/forgot" className="auth-link">Forgot Password?</Link>
            </div>

            <button type="submit" className="auth-btn">
              Login
            </button>
          </form>

          <p className="auth-meta">
            Not a user?{" "}
            <Link to="/signup" className="auth-link">
              Sign up for a free account here
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
