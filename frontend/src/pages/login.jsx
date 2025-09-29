import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/login.css";
import { API_BASE, getCookie } from "../lib/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState("");

  // OTP states
  const [step, setStep] = useState("login"); // "login" | "requestOtp" | "verifyOtp"
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const update = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const canSubmit = useMemo(() => {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
    return emailOk && form.password.trim().length >= 1;
  }, [form]);

  // Password login
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
      if (!res.ok) throw new Error(data.detail || "Incorrect email or password.");
      navigate(data?.next || "/userdashboard");
    } catch (e2) {
      setErr(e2.message || "Incorrect email or password.");
    }
  };

  // Request OTP
  const requestOtp = async () => {
    setErr("");
    try {
      const res = await fetch(`${API_BASE}/api/request-otp/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({ email: otpEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Failed to send OTP");
      setStep("verifyOtp");
    } catch (e) {
      setErr(e.message);
    }
  };

  // Verify OTP
  const verifyOtp = async () => {
    setErr("");
    try {
      const res = await fetch(`${API_BASE}/api/verify-otp/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({ email: otpEmail, code: otpCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Invalid OTP");
      navigate("/userdashboard"); // OTP verified → redirect
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="auth-app">
      <Link to="/" className="auth-brand" aria-label="IdeaForge home">
        <img
          src="/logo-black.png"
          alt="IdeaForge"
          className="auth-logo"
          height={40}
        />
      </Link>

      <main id="main" className="auth-main" role="main">
        <section className="auth-card" aria-label="Login">
          <header className="auth-head">
            <h1 className="auth-title">Welcome Back!</h1>
            <p className="auth-subtitle">Stay updated on your startups</p>
          </header>

          {step === "login" && (
            <form className="auth-form" onSubmit={onSubmit} noValidate>
              <div className="auth-field">
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

              <div className="auth-field auth-field--password">
                <input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Password"
                  className="auth-input"
                  value={form.password}
                  onChange={update("password")}
                  required
                />
                <button
                  type="button"
                  className="auth-toggle"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-pressed={showPwd}
                >
                  {showPwd ? "Hide" : "Show"}
                </button>
              </div>

              <div className="auth-links">
                <a
                  href="#"
                  className="auth-link"
                  onClick={() => {
                    setOtpEmail(form.email);
                    setStep("requestOtp");
                  }}
                >
                  Login with OTP / Forgot Password?
                </a>
              </div>

              {err && <p className="auth-error" role="alert">{err}</p>}

              <button type="submit" className="auth-btn" disabled={!canSubmit}>
                Login
              </button>
            </form>
          )}

          {step === "requestOtp" && (
            <div className="auth-form">
              <p>Send OTP to email: {otpEmail}</p>
              <button className="auth-btn" onClick={requestOtp}>
                Send OTP
              </button>
              <button
                className="auth-btn"
                onClick={() => setStep("login")}
              >
                Back
              </button>
              {err && <p className="auth-error" role="alert">{err}</p>}
            </div>
          )}

          {step === "verifyOtp" && (
            <div className="auth-form">
              <input
                type="text"
                placeholder="Enter OTP"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="auth-input"
              />
              <button className="auth-btn" onClick={verifyOtp}>
                Verify OTP
              </button>
              <button
                className="auth-btn"
                onClick={() => setStep("login")}
              >
                Back
              </button>
              {err && <p className="auth-error" role="alert">{err}</p>}
            </div>
          )}

          <p className="auth-meta">
            Not a user? <Link to="/signup" className="auth-link">Sign up</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
