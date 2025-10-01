import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/login.css";
import { API_BASE, getCookie } from "../lib/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState("");

  // OTP + Reset Password states
  const [step, setStep] = useState("login"); // login | requestOtp | verifyOtp | resetPassword
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Reset password states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const update = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const canSubmit = useMemo(() => {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
    return emailOk && form.password.trim().length >= 1;
  }, [form]);

  const getCSRFToken = () => getCookie("csrftoken");

  // ------------------- Password login -------------------
  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!canSubmit) return;
    setIsLoading(true);

    try {
      const csrfToken = getCSRFToken();
      const res = await fetch(`${API_BASE}/api/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
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
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------- Request OTP -------------------
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

  // ------------------- Verify OTP -------------------
  const verifyOtp = async () => {
    setErr("");
    if (!otpCode.trim()) {
      setErr("Please enter the OTP code");
      return;
    }

    setIsLoading(true);
    try {
      const csrfToken = getCSRFToken();
      const res = await fetch(`${API_BASE}/api/verify-otp/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({
          email: otpEmail.trim(),
          code: otpCode.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Invalid or expired OTP");

      // OTP verified → go to reset password screen
      setStep("resetPassword");
    } catch (e) {
      setErr(e.message || "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------- Reset Password -------------------
  const resetPassword = async () => {
    setErr("");
    if (!newPassword || newPassword !== confirmPassword) {
      setErr("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const csrfToken = getCSRFToken();
      const res = await fetch(`${API_BASE}/api/reset-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({
          email: otpEmail.trim(),
          code: otpCode.trim(),
          new_password: newPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Failed to reset password");

      // success → go back to login
      alert("Password reset successful. You can now log in.");
      setStep("login");
    } catch (e) {
      setErr(e.message || "Password reset failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------- UI -------------------
  const goBackToLogin = () => {
    setStep("login");
    setOtpEmail("");
    setOtpCode("");
    setErr("");
  };

  return (
    <div className="auth-app">
      <Link to="/" className="auth-brand" aria-label="IdeaForge home">
        <img src="/logo-black.png" alt="IdeaForge" className="auth-logo" height={40} />
      </Link>

      <main id="main" className="auth-main" role="main">
        <section className="auth-card" aria-label="Login">
          <header className="auth-head">
            <h1 className="auth-title">Welcome Back!</h1>
            <p className="auth-subtitle">Stay updated on your startups</p>
          </header>

          {/* ---------------- Login form ---------------- */}
          {step === "login" && (
            <form className="auth-form" onSubmit={onSubmit} noValidate>
              <div className="auth-field">
                <input
                  type="email"
                  placeholder="Email"
                  className="auth-input"
                  value={form.email}
                  onChange={update("email")}
                  required
                />
              </div>

              <div className="auth-field auth-field--password">
                <input
                  type={showPwd ? "text" : "password"}
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
                >
                  {showPwd ? "Hide" : "Show"}
                </button>
              </div>

              <div className="auth-links">
                <button
                  type="button"
                  className="auth-link-btn"
                  onClick={() => {
                    setOtpEmail(form.email || "");
                    setStep("requestOtp");
                  }}
                >
                  Login with OTP / Forgot Password?
                </button>
              </div>

              {err && <p className="auth-error">{err}</p>}

              <button type="submit" className="auth-btn" disabled={!canSubmit || isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </form>
          )}

          {/* ---------------- Request OTP ---------------- */}
          {step === "requestOtp" && (
            <div className="auth-form">
              <input
                type="email"
                placeholder="Enter your email"
                className="auth-input"
                value={otpEmail}
                onChange={(e) => setOtpEmail(e.target.value)}
              />
              <button className="auth-btn" onClick={requestOtp} disabled={isLoading || !otpEmail}>
                {isLoading ? "Sending OTP..." : "Send OTP"}
              </button>
              <button className="auth-btn auth-btn--secondary" onClick={goBackToLogin}>
                Back to Login
              </button>
              {err && <p className="auth-error">{err}</p>}
            </div>
          )}

          {/* ---------------- Verify OTP ---------------- */}
          {step === "verifyOtp" && (
            <div className="auth-form">
              <p>Verification code sent to: {otpEmail}</p>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="auth-input"
                maxLength={6}
              />
              <button className="auth-btn" onClick={verifyOtp} disabled={otpCode.length !== 6}>
                Verify OTP
              </button>
              <button className="auth-btn auth-btn--secondary" onClick={goBackToLogin}>
                Back
              </button>
              {err && <p className="auth-error">{err}</p>}
            </div>
          )}

          {/* ---------------- Reset Password ---------------- */}
          {step === "resetPassword" && (
            <div className="auth-form">
              <input
                type="password"
                placeholder="New Password"
                className="auth-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <input
                type="password"
                placeholder="Confirm Password"
                className="auth-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button className="auth-btn" onClick={resetPassword} disabled={isLoading}>
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>
              <button className="auth-btn auth-btn--secondary" onClick={goBackToLogin}>
                Cancel
              </button>
              {err && <p className="auth-error">{err}</p>}
            </div>
          )}

          <p className="auth-meta">
            Not a user? <Link to="/signup">Sign up</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
