import React, { useMemo, useState } from "react";
import "../styles/login.css";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);

  const update = (key) => (e) => setForm((s) => ({ ...s, [key]: e.target.value }));

  const canSubmit = useMemo(() => {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
    return emailOk && form.password.trim().length >= 6;
  }, [form]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    // TODO: wire to your auth API
    alert(`Logging in as ${form.email}`);
  };

  return (
    <div className="auth-app">
      {/* tiny brand like the mock */}
      <a href="/" className="auth-brand" aria-label="IdeaForge home">
        ideaForge
      </a>

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
                required
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
                required
                minLength={6}
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
              <a href="/forgot" className="auth-link">Forgot Password?</a>
            </div>

            <button type="submit" className="auth-btn" disabled={!canSubmit}>
              Login
            </button>
          </form>

          <p className="auth-meta">
            Not a user?{" "}
            <a href="/signup" className="auth-link">
              Sign up for a free account here
            </a>
          </p>
        </section>
      </main>
    </div>
  );
}
