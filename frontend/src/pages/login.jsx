import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/login.css";
import { API_BASE, getCookie } from "../lib/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState("");

  const update = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const canSubmit = useMemo(() => {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
    return emailOk && form.password.trim().length >= 6;
  }, [form]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!canSubmit) return;

    try {
      const res = await fetch(`${API_BASE}/api/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        credentials: "include",
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.detail || `HTTP ${res.status}`);
      navigate(data?.next || "/userdashboard");
    } catch (e2) {
      setErr(e2.message || "Invalid credentials or server unavailable.");
    }
  };

  return (
    <div className="auth-app">
      <Link to="/" className="auth-brand" aria-label="IdeaForge home">ideaForge</Link>
      <main id="main" className="auth-main" role="main">
        <section className="auth-card" aria-label="Login">
          <header className="auth-head">
            <h1 className="auth-title">Welcome Back!</h1>
            <p className="auth-subtitle">Stay updated on your startups</p>
          </header>

          <form className="auth-form" onSubmit={onSubmit} noValidate>
            <div className="auth-field">
              <input id="email" type="email" inputMode="email" autoComplete="email"
                     placeholder="Email" className="auth-input"
                     value={form.email} onChange={update("email")} required />
            </div>

            <div className="auth-field auth-field--password">
              <input id="password" type={showPwd ? "text" : "password"}
                     autoComplete="current-password" placeholder="Password" className="auth-input"
                     value={form.password} onChange={update("password")} required minLength={6}/>
              <button type="button" className="auth-toggle"
                      onClick={() => setShowPwd((v) => !v)}
                      aria-pressed={showPwd}>
                {showPwd ? "Hide" : "Show"}
              </button>
            </div>

            <div className="auth-links">
              <a href="/forgot" className="auth-link">Forgot Password?</a>
            </div>

            {err && <p className="auth-error" role="alert">{err}</p>}

            <button type="submit" className="auth-btn" disabled={!canSubmit}>Login</button>
          </form>

          <p className="auth-meta">
            Not a user? <Link to="/signup" className="auth-link">Sign up</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
