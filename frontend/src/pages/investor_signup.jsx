// frontend/src/components/InvestorSignup.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/investor_signup.css";

/** Helpers */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FILES = 3;
const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ACCEPT = ".pdf,.png,.jpg,.jpeg";

const PWD_RULES = [
  { id: "len",  test: (s) => s.length >= 8,             label: "At least 8 characters" },
  { id: "up",   test: (s) => /[A-Z]/.test(s),           label: "One uppercase letter (A–Z)" },
  { id: "low",  test: (s) => /[a-z]/.test(s),           label: "One lowercase letter (a–z)" },
  { id: "dig",  test: (s) => /\d/.test(s),              label: "One number (0–9)" },
  { id: "spec", test: (s) => /[~!@#$%^&*()_\-+={}\[\]|\\:;\"'<>,.?/`]/.test(s), label: "One special character" },
  { id: "space",test: (s) => !/\s/.test(s),             label: "No spaces" },
];

const toTitleCase = (str = "") =>
  String(str || "")
    .replace(/[-_/]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
    .trim();

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}
async function ensureCsrf(API_BASE) {
  // make sure csrftoken cookie exists before POSTs that require it
  if (getCookie("csrftoken")) return;
  try { await fetch(`${API_BASE}/api/csrf/`, { credentials: "include" }); } catch {}
}

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

const API_BASE = process.env.REACT_APP_API_BASE || "";

export default function InvestorSignup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    company_name: "",
    password: "",
    confirm: "",
    verifyType: "ownership",
    consent: false,
    role_id: 2,
  });

  // Categories state
  const [cats, setCats] = useState([]);
  const [picked, setPicked] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [serverErrors, setServerErrors] = useState(null);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

  const [step, setStep] = useState("fill");
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  /* ---------- fetch categories ---------- */
  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/categories/`, { credentials: "include" });
        const data = await res.json();
        if (!stop && Array.isArray(data)) setCats(data);
        if (!stop && data?.results) setCats(data.results);
      } catch {}
    })();
    return () => { stop = true; };
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    let t;
    if (resendCooldown > 0) t = setInterval(() => setResendCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const updateForm = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (serverErrors) setServerErrors(null);
  };

  const pwdChecks = useMemo(
    () => PWD_RULES.map((r) => ({ id: r.id, ok: r.test(form.password), label: r.label })),
    [form.password]
  );
  const pwdOk = pwdChecks.every((c) => c.ok);

  // Categories filtering and selection logic
  const filteredCats = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    if (!needle) return cats;
    return cats.filter((c) => (c.name || "").toLowerCase().includes(needle));
  }, [searchQuery, cats]);

  const allVisibleSelected = useMemo(() => {
    if (filteredCats.length === 0) return false;
    return filteredCats.every((c) => picked.has(c.id));
  }, [filteredCats, picked]);

  const toggleCategory = (id) => {
    setPicked((prev) => {
      const ns = new Set(prev);
      if (ns.has(id)) ns.delete(id); else ns.add(id);
      return ns;
    });
  };

  const toggleSelectAllVisible = () => {
    setPicked((prev) => {
      const ns = new Set(prev);
      if (allVisibleSelected) filteredCats.forEach((c) => ns.delete(c.id));
      else filteredCats.forEach((c) => ns.add(c.id));
      return ns;
    });
  };

  const formatLabel = (name) => toTitleCase(name);

  // Validation for step 1
  const validFill = useMemo(() => {
    const emailOk = EMAIL_RE.test(form.email.trim());
    const unameOk = form.username.trim().length >= 3;
    const namesOk = form.firstName.trim() && form.lastName.trim();
    const phoneOk = form.phone.trim().length >= 7;
    const companyOk = form.company_name.trim().length >= 2;
    const matchOk = form.password === form.confirm;
    const docsOk = files.length > 0 && files.length <= MAX_FILES && files.every((f) => f.size <= MAX_BYTES);
    const categoriesOk = picked.size >= 1;
    return emailOk && unameOk && namesOk && phoneOk && companyOk && pwdOk && matchOk && form.consent && docsOk && categoriesOk;
  }, [form, files, pwdOk, picked]);

  // File handling
  const handleFilePick = (fileList) => {
    const incoming = Array.from(fileList ?? []).slice(0, MAX_FILES - files.length);
    const validFiles = incoming
      .filter((f) => f.size <= MAX_BYTES)
      .filter((f) => ACCEPT.split(",").some((ext) => f.name.toLowerCase().endsWith(ext.trim())))
      .map((f) => ({ file: f, id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2)}`, name: f.name, size: f.size }));
    setFiles((prev) => [...prev, ...validFiles].slice(0, MAX_FILES));
  };
  const handleDrop = (e) => { e.preventDefault(); if (loading) return; handleFilePick(e.dataTransfer.files); };
  const handleRemoveFile = (id) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const renderErrors = (errs) => {
    if (!errs) return null;
    if (Array.isArray(errs)) return errs.map((m, i) => <div key={i} className="regv-error" style={{ marginBottom: 4 }}>{m}</div>);
    return Object.entries(errs).flatMap(([k, v]) => {
      const items = Array.isArray(v) ? v : [v];
      return items.map((msg, i) => (
        <div key={`${k}-${i}`} className="regv-error" style={{ marginBottom: 4 }}>
          {k === "non_field_errors" ? msg : `${k}: ${msg}`}
        </div>
      ));
    });
  };

  // Request OTP
  const sendOtpRequest = async () => {
    setServerErrors(null); setMessage(null);
    if (!EMAIL_RE.test(form.email.trim())) { setServerErrors({ non_field_errors: ["Enter a valid email."] }); return false; }
    try {
      setLoading(true);
      await ensureCsrf(API_BASE);
      const csrftoken = getCookie("csrftoken");
      const headers = { "Content-Type": "application/json", ...(csrftoken && { "X-CSRFToken": csrftoken }) };
      const res = await fetch(`${API_BASE}/api/register/request-otp/`, {
        method: "POST", headers, body: JSON.stringify({ email: form.email.trim(), username: form.username.trim(), investor: true }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(parseError(data));
      setMessage(data?.message || "OTP sent successfully");
      setResendCooldown(60);
      setStep("otp");
      return true;
    } catch (err) {
      setServerErrors({ non_field_errors: [err.message || "Failed to send OTP"] });
      return false;
    } finally { setLoading(false); }
  };

  const handleOtpRequest = async (e) => { e?.preventDefault(); if (!validFill || loading) return; await sendOtpRequest(); };
  const handleResendOtp = async () => { if (resendCooldown > 0) return; await sendOtpRequest(); };

  // Complete registration using the role_id approach
  const completeRegistration = async () => {
    setServerErrors(null); setMessage(null);
    if (!otpCode.trim()) { setServerErrors({ non_field_errors: ["Please enter the OTP code."] }); return; }

    try {
      setLoading(true);
      await ensureCsrf(API_BASE);
      const csrftoken = getCookie("csrftoken");

      // Step 1: Verify OTP and create user account with role_id
      const verifyRes = await fetch(`${API_BASE}/api/register/verify-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(csrftoken && { "X-CSRFToken": csrftoken }) },
        credentials: "include",
        body: JSON.stringify({
          email: form.email.trim(),
          code: otpCode.trim(),
          password: form.password,
          username: form.username.trim(),
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          role_id: 2, // Investor role ID
        }),
      });
      const verifyData = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok) throw new Error(parseError(verifyData) || "OTP verification failed");

      // Step 2: Auto-login to establish session
      try {
        const loginRes = await fetch(`${API_BASE}/api/login/`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(csrftoken && { "X-CSRFToken": csrftoken }) },
          credentials: "include",
          body: JSON.stringify({ email: form.email.trim(), password: form.password }),
        });
        if (!loginRes.ok) console.warn("Auto-login failed, continuing with investor registration");
      } catch (loginErr) { console.warn("Login attempt failed:", loginErr); }

      // Step 3: Ensure CSRF again then submit investor-specific data and files using FormData
      await ensureCsrf(API_BASE);
      const freshToken = getCookie("csrftoken");
      const investorData = new FormData();
      investorData.append("phone", form.phone.trim());
      investorData.append("company_name", form.company_name.trim());
      investorData.append("verifyType", form.verifyType);
      Array.from(picked).forEach((id) => investorData.append("categories", id));
      files.forEach((f) => investorData.append("docs", f.file, f.name));

      const investorRes = await fetch(`${API_BASE}/api/register/investor/details/`, {
        method: "POST",
        credentials: "include",
        headers: { ...(freshToken && { "X-CSRFToken": freshToken }) },
        body: investorData,
      });

      // Try to read JSON; handle 403 HTML response safely
      let investorResult = {};
      try { investorResult = await investorRes.json(); } catch {}

      if (!investorRes.ok) {
        const msg = parseError(investorResult) || `Investor step failed (${investorRes.status})`;
        throw new Error(msg);
      }

      setMessage("Registration completed successfully! Redirecting...");
      setTimeout(() => { navigate("/investordashboard", { replace: true }); }, 1200);

    } catch (err) {
      console.error("Registration error:", err);
      setServerErrors({ non_field_errors: [err.message || "Registration failed. Please try again."] });
    } finally { setLoading(false); }
  };

  const handleReset = () => {
    setForm({
      firstName: "", lastName: "", username: "", email: "", phone: "",
      company_name: "", password: "", confirm: "", verifyType: "ownership", consent: false, role_id: 2,
    });
    setFiles([]); setPicked(new Set()); setSearchQuery("");
    setServerErrors(null); setMessage(null); setStep("fill"); setOtpCode("");
  };

  // Simple form submission (alternative without OTP)
  const handleSimpleSubmit = async (e) => {
    e.preventDefault();
    setServerErrors(null); setMessage(null);
    if (!form.username.trim() || !form.email.trim() || !form.password) {
      setServerErrors({ non_field_errors: ["Username, email and password are required."] });
      return;
    }
    setLoading(true);
    try {
      await ensureCsrf(API_BASE);
      const csrftoken = getCookie("csrftoken");
      const headers = { "Content-Type": "application/json", ...(csrftoken && { "X-CSRFToken": csrftoken }) };
      const simpleFormData = {
        firstName: form.firstName, lastName: form.lastName, username: form.username,
        email: form.email, password: form.password, company_name: form.company_name,
        phone: form.phone, role_id: 2,
      };
      const res = await fetch(`${API_BASE}/api/investor-register/`, {
        method: "POST", headers, credentials: "include", body: JSON.stringify(simpleFormData),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(parseError(data));
      setMessage(data?.message || "Registered successfully");
      setServerErrors(null);
      const next = data.next || "/investordashboard";
      setTimeout(() => { window.location.href = next; }, 400);
    } catch (err) {
      setServerErrors({ non_field_errors: [err.message || "Registration failed"] });
    } finally { setLoading(false); }
  };

  return (
    <div className="regv-app">
      <Link to="/" className="auth-brand" aria-label="IdeaForge home">
        <img src="/logo-black.png" alt="IdeaForge" className="auth-logo" height={40} />
      </Link>

      <main id="main" className="regv-main" role="main">
        <section className="regv-card" aria-label="Create investor account with verification">
          <header className="regv-head">
            <h1 className="regv-title">Get started as an Investor!</h1>
            <p className="regv-subtitle">Create your account, choose investment interests, and add verification documents.</p>
          </header>

          {message && <div className="regv-message" role="alert">{message}</div>}
          {serverErrors && <div className="regv-errors">{renderErrors(serverErrors)}</div>}

          {step === "fill" && (
            <form className="regv-form" onSubmit={handleOtpRequest} noValidate>
              <div className="regv-grid">
                <div className="regv-field">
                  <input id="firstName" name="firstName" className="regv-input" placeholder="First Name *"
                    value={form.firstName} onChange={updateForm("firstName")} required autoComplete="given-name" />
                </div>
                <div className="regv-field">
                  <input id="lastName" name="lastName" className="regv-input" placeholder="Last Name *"
                    value={form.lastName} onChange={updateForm("lastName")} required autoComplete="family-name" />
                </div>
                <div className="regv-field">
                  <input id="username" name="username" className="regv-input" placeholder="Username *" minLength={3}
                    value={form.username} onChange={updateForm("username")} required autoComplete="username" />
                </div>
                <div className="regv-field">
                  <input id="email" name="email" type="email" inputMode="email" autoComplete="email" className="regv-input" placeholder="Email *"
                    value={form.email} onChange={updateForm("email")} required />
                </div>
                <div className="regv-field">
                  <input id="phone" name="phone" type="tel" inputMode="tel" className="regv-input" placeholder="Phone Number *"
                    value={form.phone} onChange={updateForm("phone")} required autoComplete="tel" />
                </div>
                <div className="regv-field">
                  <input id="company_name" name="company_name" className="regv-input" placeholder="Company Name *"
                    value={form.company_name} onChange={updateForm("company_name")} required autoComplete="organization" />
                </div>
                <div className="regv-field">
                  <input id="password" name="password" type="password" autoComplete="new-password" className="regv-input" placeholder="Password *"
                    value={form.password} onChange={updateForm("password")} required />
                </div>
                <div className="regv-field">
                  <input id="confirm" name="confirm" type="password" autoComplete="new-password" className="regv-input" placeholder="Confirm Password *"
                    value={form.confirm} onChange={updateForm("confirm")} required />
                </div>
              </div>

              {/* Password requirements */}
              <ul aria-live="polite" className="regv-pwd-rules">
                {pwdChecks.map((c) => (
                  <li key={c.id} className={c.ok ? "regv-pwd-valid" : "regv-pwd-invalid"}>
                    {c.ok ? "✓" : "•"} {c.label}
                  </li>
                ))}
                <li className={form.password && form.confirm && form.password === form.confirm ? "regv-pwd-valid" : "regv-pwd-invalid"}>
                  {form.password && form.confirm && form.password === form.confirm ? "✓" : "•"} Passwords match
                </li>
              </ul>

              {/* Categories section */}
              <div className="regv-section">
                <div className="regv-section-header">
                  <div>
                    <p className="regv-section-title">Choose your investment interests</p>
                    <p className="regv-section-subtitle">Pick at least one category.</p>
                  </div>
                </div>

                <div className="regv-search-row">
                  <input className="regv-search" placeholder="Search categories…" value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)} />
                </div>

                <div className="regv-cat-actions">
                  <button type="button" className="regv-select-all" onClick={toggleSelectAllVisible}>
                    {allVisibleSelected ? "Unselect visible" : "Select all visible"}
                  </button>
                  <span className="regv-selected-count">{picked.size} selected</span>
                </div>

                <div className="regv-cat-grid">
                  {filteredCats.map((cat) => {
                    const isSelected = picked.has(cat.id);
                    return (
                      <button key={cat.id} type="button"
                        className={`regv-cat-card ${isSelected ? "regv-cat-selected" : ""}`}
                        onClick={() => toggleCategory(cat.id)} aria-pressed={isSelected}>
                        <span className={`regv-cat-dot ${isSelected ? "regv-cat-dot-selected" : ""}`} />
                        <span className="regv-cat-label">{formatLabel(cat.name)}</span>
                      </button>
                    );
                  })}
                  {filteredCats.length === 0 && <div className="regv-no-cats">No categories match "{searchQuery}".</div>}
                </div>
              </div>

              {/* Verification type */}
              <fieldset className="regv-verify-type">
                <legend className="regv-verify-legend">Verification Type</legend>
                <label className="regv-radio">
                  <input type="radio" name="verifyType" value="ownership" checked={form.verifyType === "ownership"} onChange={updateForm("verifyType")} />
                  <span>Company ownership (e.g., registration certificate)</span>
                </label>
                <label className="regv-radio">
                  <input type="radio" name="verifyType" value="financial" checked={form.verifyType === "financial"} onChange={updateForm("verifyType")} />
                  <span>Financial proof (e.g., recent bank slip)</span>
                </label>
              </fieldset>

              {/* File upload */}
              <div className="regv-upload">
                <div className="regv-drop-zone"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); if (!loading) handleFilePick(e.dataTransfer.files); }}
                  role="button" tabIndex={0}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInputRef.current?.click()}
                  aria-label="Upload verification documents">
                  <p className="regv-drop-title">Upload verification document(s)</p>
                  <p className="regv-drop-hint">
                    Drag & drop or{" "}
                    <button type="button" className="regv-link" onClick={() => fileInputRef.current?.click()}>
                      browse
                    </button>{" "}
                    (PDF/JPG/PNG, max {MAX_FILES} files, ≤ 10MB each)
                  </p>
                  <input ref={fileInputRef} type="file" accept={ACCEPT} multiple className="regv-file-input"
                    onChange={(e) => handleFilePick(e.target.files)} />
                </div>

                {files.length > 0 && (
                  <ul className="regv-file-list" role="list">
                    {files.map((f) => (
                      <li key={f.id} className="regv-file-item">
                        <div className="regv-file-info">
                          <span className="regv-file-name">{f.name}</span>
                          <span className="regv-file-size">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        <button type="button" className="regv-file-remove" onClick={() => handleRemoveFile(f.id)} aria-label={`Remove ${f.name}`}>
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Consent */}
              <label className="regv-consent">
                <input type="checkbox" checked={form.consent} onChange={updateForm("consent")} required />
                <span>I confirm these documents are mine and I consent to secure processing for verification.</span>
              </label>

              <div className="regv-actions">
                <button type="submit" className="regv-btn-primary" disabled={!validFill || loading}>
                  {loading ? "Sending OTP..." : "Register & Send OTP"}
                </button>
                <button type="button" className="regv-btn-secondary" onClick={handleReset} disabled={loading}>
                  Reset Form
                </button>
              </div>

              {/* Hidden role_id field */}
              <input type="hidden" name="role_id" value={2} />
            </form>
          )}

          {step === "otp" && (
            <div className="regv-form">
              <p className="regv-otp-instruction">
                An OTP was sent to <strong>{form.email}</strong>
              </p>

              <input type="text" placeholder="Enter 6-digit code" value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="regv-input" maxLength={6} autoFocus />

              <button className="regv-btn-primary" onClick={completeRegistration} disabled={loading || otpCode.length !== 6}>
                {loading ? "Finalizing Registration..." : "Confirm OTP & Complete Registration"}
              </button>

              <div className="regv-otp-actions">
                <button className="regv-btn-secondary" onClick={() => { setStep("fill"); setServerErrors(null); }} disabled={loading}>
                  Edit Details
                </button>
                <button className="regv-btn-secondary" onClick={handleResendOtp} disabled={resendCooldown > 0 || loading}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                </button>
              </div>
            </div>
          )}

          <div className="regv-footer">
            <p>Already a user? <Link to="/login" className="regv-link">Log in here</Link></p>
            <p className="regv-terms">By registering, you agree to our Terms of Service and Privacy Policy.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
