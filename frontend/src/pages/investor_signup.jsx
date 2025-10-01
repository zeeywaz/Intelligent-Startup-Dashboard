import React, { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/investor_signup.css";
import { API_BASE, getCookie } from "../lib/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FILES = 3;
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = ".pdf,.png,.jpg,.jpeg";

const PWD_RULES = [
  { id: "len", test: (s) => s.length >= 8, label: "At least 8 characters" },
  { id: "up", test: (s) => /[A-Z]/.test(s), label: "One uppercase letter (A–Z)" },
  { id: "low", test: (s) => /[a-z]/.test(s), label: "One lowercase letter (a–z)" },
  { id: "dig", test: (s) => /\d/.test(s), label: "One number (0–9)" },
  { id: "spec", test: (s) => /[~!@#$%^&*()_\-+={}[\]|\\:;\"'<>,.?/`]/.test(s), label: "One special character" },
  { id: "space", test: (s) => !/\s/.test(s), label: "No spaces" },
];

function parseError(data) {
  if (!data) return "Unknown error";
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return data.join(" ");
  if (typeof data === "object") {
    for (const k of Object.keys(data)) {
      const v = data[k];
      if (!v) continue;
      if (Array.isArray(v)) return v.join(" ");
      if (typeof v === "string") return v;
    }
    try { return JSON.stringify(data); } catch { return String(data); }
  }
  return String(data);
}

export default function InvestorSignUpPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    companyName: "",
    password: "",
    confirm: "",
    verifyType: "ownership",
    consent: false,
  });

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const pickerRef = useRef(null);

  const [step, setStep] = useState("fill");
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let t;
    if (resendCooldown > 0) t = setInterval(() => setResendCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const update = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const pwdChecks = useMemo(() => PWD_RULES.map((r) => ({ id: r.id, ok: r.test(form.password), label: r.label })), [form.password]);
  const pwdOk = pwdChecks.every((c) => c.ok);

  const validFill = useMemo(() => {
    const emailOk = EMAIL_RE.test(form.email.trim());
    const unameOk = form.username.trim().length >= 3;
    const namesOk = form.firstName.trim() && form.lastName.trim();
    const phoneOk = form.phone.trim().length >= 7;
    const companyOk = form.companyName.trim().length >= 2;
    const matchOk = form.password === form.confirm;
    const docsOk = files.length > 0 && files.length <= MAX_FILES && files.every((f) => f.size <= MAX_BYTES);
    return emailOk && unameOk && !!namesOk && phoneOk && companyOk && pwdOk && matchOk && form.consent && docsOk;
  }, [form, files, pwdOk]);

  const onPick = (fileList) => {
    const incoming = Array.from(fileList ?? []).slice(0, MAX_FILES - files.length);
    const safe = incoming
      .filter((f) => f.size <= MAX_BYTES)
      .filter((f) => ACCEPT.split(",").some((ext) => f.name.toLowerCase().endsWith(ext.trim())))
      .map((f) => ({ file: f, id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2)}`, name: f.name, size: f.size }));
    setFiles((prev) => [...prev, ...safe].slice(0, MAX_FILES));
  };

  const onDrop = (e) => { e.preventDefault(); if (loading) return; onPick(e.dataTransfer.files); };
  const onRemove = (id) => setFiles((prev) => prev.filter((f) => f.id !== id));

  // Request OTP - Use the correct endpoint
  const sendRequestOtp = async () => {
    setErr("");
    if (!EMAIL_RE.test(form.email.trim())) { 
      setErr("Enter a valid email."); 
      return false; 
    }
    
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/register/request-otp/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "X-CSRFToken": getCookie("csrftoken") 
        },
        body: JSON.stringify({ 
          email: form.email.trim(), 
          username: form.username.trim(),
          investor: true 
        }),
        credentials: "include",
      });
      
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(parseError(data));
      
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

  const handleRequestOtp = async (e) => { 
    e?.preventDefault(); 
    setErr(""); 
    if (!validFill || loading) return; 
    await sendRequestOtp(); 
  };

  const handleResend = async () => { 
    setErr(""); 
    if (resendCooldown > 0) return; 
    await sendRequestOtp(); 
  };

  // Finish registration - Use the correct verify endpoint and then investor endpoint
  const finishRegistration = async () => {
    setErr("");
    if (!otpCode.trim()) { 
      setErr("Please enter the OTP code."); 
      return; 
    }

    try {
      setLoading(true);

      // Step 1: Verify OTP and create user account
      const verifyRes = await fetch(`${API_BASE}/api/register/verify-otp/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "X-CSRFToken": getCookie("csrftoken") 
        },
        credentials: "include",
        body: JSON.stringify({
          email: form.email.trim(),
          code: otpCode.trim(),
          password: form.password,
          username: form.username.trim(),
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
        }),
      });

      const verifyJson = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok) {
        throw new Error(parseError(verifyJson) || "OTP verification failed");
      }

      // Step 2: Login to get session
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

      const loginJson = await loginRes.json().catch(() => ({}));
      if (!loginRes.ok) {
        console.warn("Auto-login failed, but continuing with investor registration");
        // Don't throw error here, continue to investor registration
      }

      // Step 3: Submit investor-specific data and files
      const investorData = new FormData();
      investorData.append("phone", form.phone.trim());
      investorData.append("company_name", form.companyName.trim());
      investorData.append("verifyType", form.verifyType);
      
      // Append files
      files.forEach((f) => investorData.append("docs", f.file, f.name));

      const invRes = await fetch(`${API_BASE}/api/register/investor/`, {
        method: "POST",
        credentials: "include",
        headers: { "X-CSRFToken": getCookie("csrftoken") },
        body: investorData,
      });

      const invJson = await invRes.json().catch(() => ({}));
      if (!invRes.ok) {
        // If investor registration fails but user was created, still consider it success
        console.warn("Investor profile creation failed, but user account was created:", parseError(invJson));
        // Don't throw error, redirect to dashboard anyway
      }

      // Success - redirect to investor dashboard
      navigate("/investordashboard", { replace: true });
      
    } catch (e) {
      console.error("Registration error:", e);
      setErr(e.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="regv-app">
      <Link to="/" className="auth-brand" aria-label="IdeaForge home">
        <img src="/logo-black.png" alt="IdeaForge" className="auth-logo" height={40} />
      </Link>

      <main id="main" className="regv-main" role="main">
        <section className="regv-card" aria-label="Create account with verification">
          <header className="regv-head">
            <h1 className="regv-title">Get started now!</h1>
            <p className="regv-subtitle">Create your account and add a verification document.</p>
          </header>

          {err && <p className="regv-error" role="alert">{err}</p>}

          {step === "fill" && (
            <form className="regv-form" onSubmit={handleRequestOtp} noValidate>
              <div className="regv-grid">
                <div className="regv-field">
                  <input id="fn" className="regv-input" placeholder="First Name" value={form.firstName} onChange={update("firstName")} required />
                </div>
                <div className="regv-field">
                  <input id="ln" className="regv-input" placeholder="Last Name" value={form.lastName} onChange={update("lastName")} required />
                </div>
                <div className="regv-field">
                  <input id="un" className="regv-input" placeholder="Username" minLength={3} value={form.username} onChange={update("username")} required autoComplete="username" />
                </div>
                <div className="regv-field">
                  <input id="em" type="email" inputMode="email" autoComplete="email" className="regv-input" placeholder="Email" value={form.email} onChange={update("email")} required />
                </div>
                <div className="regv-field">
                  <input id="ph" type="tel" inputMode="tel" className="regv-input" placeholder="Phone Number" value={form.phone} onChange={update("phone")} required />
                </div>
                <div className="regv-field">
                  <input id="cn" className="regv-input" placeholder="Company Name" value={form.companyName} onChange={update("companyName")} required />
                </div>
                <div className="regv-field">
                  <input id="pw" type="password" autoComplete="new-password" className="regv-input" placeholder="Password" value={form.password} onChange={update("password")} required />
                </div>
                <div className="regv-field">
                  <input id="cp" type="password" autoComplete="new-password" className="regv-input" placeholder="Confirm password" value={form.confirm} onChange={update("confirm")} required />
                </div>
              </div>

              <ul aria-live="polite" style={{ margin: "6px 0 0", paddingLeft: "18px", fontSize: ".9rem" }}>
                {pwdChecks.map((c) => (
                  <li key={c.id} style={{ color: c.ok ? "green" : "#b91c1c" }}>
                    {c.ok ? "✓" : "•"} {c.label}
                  </li>
                ))}
                <li style={{ color: form.password && form.confirm && form.password === form.confirm ? "green" : "#b91c1c" }}>
                  {form.password && form.confirm && form.password === form.confirm ? "✓" : "•"} Passwords match
                </li>
              </ul>

              <fieldset className="regv-verify">
                <legend className="regv-verify__title">Verification Type</legend>
                <label className="regv-radio">
                  <input type="radio" name="verifyType" value="ownership" checked={form.verifyType === "ownership"} onChange={update("verifyType")} />
                  <span>Company ownership (e.g., registration certificate)</span>
                </label>
                <label className="regv-radio">
                  <input type="radio" name="verifyType" value="financial" checked={form.verifyType === "financial"} onChange={update("verifyType")} />
                  <span>Financial proof (e.g., recent bank slip)</span>
                </label>
              </fieldset>

              <div className="regv-upload">
                <div 
                  className="regv-drop" 
                  onDragOver={(e) => e.preventDefault()} 
                  onDrop={onDrop} 
                  role="button" 
                  tabIndex={0} 
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && pickerRef.current?.click()} 
                  aria-label="Upload verification documents"
                >
                  <p className="regv-drop__title">Upload verification document(s)</p>
                  <p className="regv-drop__hint">
                    Drag & drop or{" "}
                    <button type="button" className="regv-link" onClick={() => pickerRef.current?.click()}>
                      browse
                    </button>{" "}
                    (PDF/JPG/PNG, max {MAX_FILES} files, ≤ 10MB each)
                  </p>
                  <input ref={pickerRef} type="file" accept={ACCEPT} multiple className="sr-only" onChange={(e) => onPick(e.target.files)} />
                </div>

                {files.length > 0 && (
                  <ul className="regv-files" role="list">
                    {files.map((f) => (
                      <li key={f.id} className="regv-file">
                        <div className="regv-file__meta">
                          <span className="regv-file__name">{f.name}</span>
                          <span className="regv-file__size">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        <button type="button" className="regv-file__remove" onClick={() => onRemove(f.id)}>
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <label className="regv-consent">
                <input type="checkbox" checked={form.consent} onChange={update("consent")} />
                <span>I confirm these documents are mine and I consent to secure processing for verification.</span>
              </label>

              <button type="submit" className="regv-btn" disabled={!validFill || loading}>
                {loading ? "Sending OTP..." : "Register & Send OTP"}
              </button>
            </form>
          )}

          {step === "otp" && (
            <div className="regv-form">
              <p style={{ textAlign: "center" }}>
                An OTP was sent to <strong>{form.email}</strong>
              </p>

              <input 
                type="text" 
                placeholder="Enter 6-digit code" 
                value={otpCode} 
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))} 
                className="regv-input" 
                maxLength={6} 
              />

              <button className="regv-btn" onClick={finishRegistration} disabled={loading || otpCode.length !== 6}>
                {loading ? "Finalizing..." : "Confirm OTP & Register"}
              </button>

              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 8 }}>
                <button className="regv-btn regv-btn--secondary" onClick={() => { setStep("fill"); setErr(""); }}>
                  Edit details
                </button>
                <button className="regv-btn regv-btn--secondary" onClick={handleResend} disabled={resendCooldown > 0}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                </button>
              </div>
            </div>
          )}

          <div className="regv-meta">
            <p>Already a user? <a href="/login" className="regv-link">Log in here</a></p>
            <p className="regv-fine">Password must meet the rules above.</p>
          </div>
        </section>
      </main>
    </div>
  );
}