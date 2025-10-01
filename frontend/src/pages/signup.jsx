import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/signup.css";
import { API_BASE, getCookie } from "../lib/api";

const PWD_RULES = [
  { id: "len", test: (s) => s.length >= 8, label: "At least 8 characters" },
  { id: "up", test: (s) => /[A-Z]/.test(s), label: "One uppercase letter (A–Z)" },
  { id: "low", test: (s) => /[a-z]/.test(s), label: "One lowercase letter (a–z)" },
  { id: "dig", test: (s) => /\d/.test(s), label: "One number (0–9)" },
  { id: "spec", test: (s) => /[~!@#$%^&*()_\-+={}\[\]|\\:;"'<>,.?`]/.test(s), label: "One special character" },
  { id: "space", test: (s) => !/\s/.test(s), label: "No spaces" },
];

export default function SignUpPage() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [step, setStep] = useState("fill"); // fill | otp
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let t;
    if (resendCooldown > 0) {
      t = setInterval(() => setResendCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    }
    return () => clearInterval(t);
  }, [resendCooldown]);

  const update = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const pwdChecks = useMemo(
    () => PWD_RULES.map((r) => ({ id: r.id, ok: r.test(form.password), label: r.label })),
    [form.password]
  );
  const pwdOk = pwdChecks.every((c) => c.ok);

  const namesOk = form.firstName.trim() && form.lastName.trim();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const unameOk = form.username.trim().length >= 3;
  const matchOk = form.password === form.confirm;

  const valid = emailOk && unameOk && !!namesOk && pwdOk && matchOk;

  const sendRequestOtp = async () => {
    setErr("");
    if (!emailOk) {
      setErr("Enter a valid email.");
      return false;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/register/request-otp/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({ email: form.email.trim(), username: form.username.trim() }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const firstErr =
          (data && (data.detail || data.error || Object.values(data)[0])) || "Failed to send OTP";
        throw new Error(Array.isArray(firstErr) ? firstErr.join(" ") : String(firstErr));
      }

      setResendCooldown(60);
      setStep("otp");
      return true;
    } catch (e) {
      setErr(e.message || "Failed to send OTP");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e?.preventDefault();
    setErr("");
    if (!valid || loading) return;

    await sendRequestOtp();
  };

  const handleResend = async () => {
    setErr("");
    if (resendCooldown > 0) return;
    await sendRequestOtp();
  };

  const finishRegistration = async () => {
    setErr("");
    if (!otpCode.trim()) {
      setErr("Please enter the OTP code.");
      return;
    }
    if (!pwdOk || !matchOk) {
      setErr("Password rules not satisfied or passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/register/verify-otp/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({
          email: form.email.trim(),
          code: otpCode.trim(),
          password: form.password,
          username: form.username.trim(),
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
        }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const firstErr =
          (data && (data.detail || data.error || Object.values(data)[0])) || "Verification failed";
        throw new Error(Array.isArray(firstErr) ? firstErr.join(" ") : String(firstErr));
      }

      // Auto login after registration
      const loginRes = await fetch(`${API_BASE}/api/login/`, {
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

      const loginData = await loginRes.json().catch(() => ({}));
      if (!loginRes.ok) {
        throw new Error(loginData.detail || "Login failed after signup");
      }

      nav(loginData?.next || "/userdashboard", { replace: true });
    } catch (e) {
      setErr(e.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reg-app">
      <Link to="/" className="auth-brand" aria-label="IdeaForge home">
        <img src="/logo-black.png" alt="IdeaForge" className="auth-logo" height={40} />
      </Link>

      <main id="main" className="reg-main" role="main">
        <section className="reg-card" aria-label="Create account">
          <header className="reg-head">
            <h1 className="reg-title">Get started now!</h1>
            <p className="reg-subtitle">Start building your dream startup</p>
          </header>

          {err ? <p style={{ color: "crimson", textAlign: "center" }}>{err}</p> : null}

          {step === "fill" && (
            <form className="reg-form" onSubmit={handleRegister} noValidate>
              <div className="reg-grid">
                <div className="reg-field">
                  <input id="fn" className="reg-input" placeholder="First Name"
                    value={form.firstName} onChange={update("firstName")} required />
                </div>

                <div className="reg-field">
                  <input id="ln" className="reg-input" placeholder="Last Name"
                    value={form.lastName} onChange={update("lastName")} required />
                </div>

                <div className="reg-field">
                  <input id="un" className="reg-input" placeholder="Username"
                    value={form.username} onChange={update("username")} required minLength={3} />
                </div>

                <div className="reg-field">
                  <input id="em" type="email" inputMode="email" autoComplete="email"
                    className="reg-input" placeholder="Email" value={form.email} onChange={update("email")} required />
                </div>

                <div className="reg-field">
                  <input id="pw" type="password" autoComplete="new-password"
                    className="reg-input" placeholder="Password" value={form.password} onChange={update("password")} required />
                </div>

                <div className="reg-field">
                  <input id="cp" type="password" autoComplete="new-password"
                    className="reg-input" placeholder="Confirm password" value={form.confirm} onChange={update("confirm")} required />
                </div>
              </div>

              <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: ".9rem" }}>
                {pwdChecks.map((c) => (
                  <li key={c.id} style={{ color: c.ok ? "green" : "#b91c1c" }}>
                    {c.ok ? "✓" : "•"} {c.label}
                  </li>
                ))}
                <li style={{ color: form.password && form.confirm && form.password === form.confirm ? "green" : "#b91c1c" }}>
                  {form.password && form.confirm && form.password === form.confirm ? "✓" : "•"} Passwords match
                </li>
              </ul>

              <button type="submit" className="reg-btn" disabled={!valid || loading}>
                {loading ? "Sending OTP..." : "Register & Send OTP"}
              </button>
            </form>
          )}

          {step === "otp" && (
            <div className="reg-form">
              <p style={{ textAlign: "center" }}>An OTP was sent to <strong>{form.email}</strong></p>

              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="reg-input"
                maxLength={6}
              />

              <button className="reg-btn" onClick={finishRegistration} disabled={loading || otpCode.length !== 6}>
                {loading ? "Finalizing..." : "Confirm OTP & Login"}
              </button>

              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 8 }}>
                <button className="reg-btn reg-btn--secondary" onClick={() => { setStep("fill"); setErr(""); }}>
                  Edit details
                </button>

                <button
                  className="reg-btn reg-btn--secondary"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                </button>
              </div>
            </div>
          )}

          <div className="reg-meta" style={{ marginTop: 12 }}>
            <p>Already a user? <Link to="/login" className="reg-link">Log in here</Link></p>
            <p className="reg-fine">
              Are you an investor? <Link to="/investor_signup" className="reg-link">Sign up as investor</Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
