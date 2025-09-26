import React, { useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/investor_signup.css";
import { API_BASE, getCookie } from "../lib/api";

/** Helpers */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FILES = 3;
const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ACCEPT = ".pdf,.png,.jpg,.jpeg";

const PWD_RULES = [
  { id: "len",    test: (s) => s.length >= 8,                     label: "At least 8 characters" },
  { id: "up",     test: (s) => /[A-Z]/.test(s),                   label: "One uppercase letter (A–Z)" },
  { id: "low",    test: (s) => /[a-z]/.test(s),                   label: "One lowercase letter (a–z)" },
  { id: "dig",    test: (s) => /\d/.test(s),                      label: "One number (0–9)" },
  { id: "spec",   test: (s) => /[~!@#$%^&*()_\-+={}\[\]|\\:;\"'<>,.?/`]/.test(s), label: "One special character" },
  { id: "space",  test: (s) => !/\s/.test(s),                     label: "No spaces" },
];

export default function InvestorSignUpPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",         // ✅ added
    companyName: "",   // ✅ added
    password: "",
    confirm: "",
    verifyType: "ownership",
    consent: false,
  });

  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const pickerRef = useRef(null);

  const update = (key) => (e) =>
    setForm((s) => ({
      ...s,
      [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  const pwdChecks = useMemo(
    () => PWD_RULES.map((r) => ({ id: r.id, ok: r.test(form.password), label: r.label })),
    [form.password]
  );
  const pwdOk = pwdChecks.every((c) => c.ok);

  const valid = useMemo(() => {
    const emailOk = EMAIL_RE.test(form.email.trim());
    const unameOk = form.username.trim().length >= 3;
    const namesOk = form.firstName.trim() && form.lastName.trim();
    const phoneOk = form.phone.trim().length >= 7; // ✅ basic phone check
    const companyOk = form.companyName.trim().length >= 2;
    const matchOk = form.password === form.confirm;
    const docsOk =
      files.length > 0 && files.length <= MAX_FILES && files.every((f) => f.size <= MAX_BYTES);
    return (
      emailOk &&
      unameOk &&
      !!namesOk &&
      phoneOk &&
      companyOk &&
      pwdOk &&
      matchOk &&
      form.consent &&
      docsOk
    );
  }, [form, files, pwdOk]);

  const onPick = (fileList) => {
    const incoming = Array.from(fileList ?? []).slice(0, MAX_FILES - files.length);
    const safe = incoming
      .filter((f) => f.size <= MAX_BYTES)
      .filter((f) => ACCEPT.split(",").some((ext) => f.name.toLowerCase().endsWith(ext.trim())))
      .map((f) => ({
        file: f,
        id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2)}`,
        name: f.name,
        size: f.size,
      }));
    setFiles((prev) => [...prev, ...safe].slice(0, MAX_FILES));
  };

  const onDrop = (e) => {
    e.preventDefault();
    if (busy) return;
    onPick(e.dataTransfer.files);
  };

  const onRemove = (id) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setErr("");

    try {
      const data = new FormData();
      data.append("firstName", form.firstName.trim());
      data.append("lastName", form.lastName.trim());
      data.append("username", form.username.trim());
      data.append("email", form.email.trim());
      data.append("phone", form.phone.trim());          // ✅ added
      data.append("company_name", form.companyName.trim()); // ✅ added
      data.append("password", form.password);
      data.append("verifyType", form.verifyType);
      files.forEach((f) => data.append("docs", f.file, f.name));

      const res = await fetch(`${API_BASE}/api/register/investor/`, {
        method: "POST",
        credentials: "include",
        headers: { "X-CSRFToken": getCookie("csrftoken") },
        body: data,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || json?.username || json?.email || "Signup failed");

      navigate(json?.next || "/investordashboard");
    } catch (error) {
      setErr(error.message || "There was a problem submitting your registration.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="regv-app">
      <Link to="/" className="auth-brand" aria-label="IdeaForge home">
        <img
          src="/logo-black.png"
          alt="IdeaForge"
          className="auth-logo"
          height={40}
        />
      </Link>

      <main id="main" className="regv-main" role="main">
        <section className="regv-card" aria-label="Create account with verification">
          <header className="regv-head">
            <h1 className="regv-title">Get started now!</h1>
            <p className="regv-subtitle">Create your account and add a verification document.</p>
          </header>

          <form className="regv-form" onSubmit={onSubmit} noValidate>
            {/* Basic info */}
            <div className="regv-grid">
              <div className="regv-field">
                <label htmlFor="fn" className="sr-only">First Name</label>
                <input id="fn" className="regv-input" placeholder="First Name"
                       value={form.firstName} onChange={update("firstName")} required />
              </div>

              <div className="regv-field">
                <label htmlFor="ln" className="sr-only">Last Name</label>
                <input id="ln" className="regv-input" placeholder="Last Name"
                       value={form.lastName} onChange={update("lastName")} required />
              </div>

              <div className="regv-field">
                <label htmlFor="un" className="sr-only">Username</label>
                <input id="un" className="regv-input" placeholder="Username" minLength={3}
                       value={form.username} onChange={update("username")} required autoComplete="username" />
              </div>

              <div className="regv-field">
                <label htmlFor="em" className="sr-only">Email</label>
                <input id="em" type="email" inputMode="email" autoComplete="email"
                       className="regv-input" placeholder="Email" value={form.email}
                       onChange={update("email")} required />
              </div>

              {/* ✅ New: Phone */}
              <div className="regv-field">
                <label htmlFor="ph" className="sr-only">Phone</label>
                <input id="ph" type="tel" inputMode="tel"
                       className="regv-input" placeholder="Phone Number"
                       value={form.phone} onChange={update("phone")} required />
              </div>

              {/* ✅ New: Company Name */}
              <div className="regv-field">
                <label htmlFor="cn" className="sr-only">Company Name</label>
                <input id="cn" className="regv-input" placeholder="Company Name"
                       value={form.companyName} onChange={update("companyName")} required />
              </div>

              <div className="regv-field">
                <label htmlFor="pw" className="sr-only">Password</label>
                <input id="pw" type="password" autoComplete="new-password"
                       className="regv-input" placeholder="Password"
                       value={form.password} onChange={update("password")} required />
              </div>

              <div className="regv-field">
                <label htmlFor="cp" className="sr-only">Confirm password</label>
                <input id="cp" type="password" autoComplete="new-password"
                       className="regv-input" placeholder="Confirm password"
                       value={form.confirm} onChange={update("confirm")} required />
              </div>
            </div>

            {/* Password rules checklist */}
            <ul aria-live="polite" style={{margin:"6px 0 0", paddingLeft: "18px", fontSize: ".9rem"}}>
              {pwdChecks.map((c) => (
                <li key={c.id} style={{color: c.ok ? "green" : "#b91c1c"}}>
                  {c.ok ? "✓" : "•"} {c.label}
                </li>
              ))}
              <li style={{color: form.password && form.confirm && form.password === form.confirm ? "green" : "#b91c1c"}}>
                {form.password && form.confirm && form.password === form.confirm ? "✓" : "•"} Passwords match
              </li>
            </ul>

            {/* Verification selector */}
            <fieldset className="regv-verify">
              <legend className="regv-verify__title">Verification Type</legend>
              <label className="regv-radio">
                <input type="radio" name="verifyType" value="ownership"
                       checked={form.verifyType === "ownership"} onChange={update("verifyType")} />
                <span>Company ownership (e.g., registration certificate)</span>
              </label>
              <label className="regv-radio">
                <input type="radio" name="verifyType" value="financial"
                       checked={form.verifyType === "financial"} onChange={update("verifyType")} />
                <span>Financial proof (e.g., recent bank slip)</span>
              </label>
            </fieldset>

            {/* Upload area */}
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
                <input
                  ref={pickerRef}
                  type="file"
                  accept={ACCEPT}
                  multiple
                  className="sr-only"
                  onChange={(e) => onPick(e.target.files)}
                />
              </div>

              {files.length > 0 && (
                <ul className="regv-files" role="list">
                  {files.map((f) => (
                    <li key={f.id} className="regv-file">
                      <div className="regv-file__meta">
                        <span className="regv-file__name">{f.name}</span>
                        <span className="regv-file__size">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      <button type="button" className="regv-file__remove"
                              onClick={() => onRemove(f.id)} aria-label={`Remove ${f.name}`}>
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Consent */}
            <label className="regv-consent">
              <input type="checkbox" checked={form.consent} onChange={update("consent")} />
              <span>I confirm these documents are mine and I consent to secure processing for verification.</span>
            </label>

            {err && <p className="regv-error" role="alert">{err}</p>}

            {/* Submit */}
            <button type="submit" className="regv-btn" disabled={!valid || busy}>
              {busy ? "Submitting..." : "Register"}
            </button>
          </form>

          <div className="regv-meta">
            <p>Already a user? <a href="/login" className="regv-link">Log in here</a></p>
            <p className="regv-fine">Password must meet the rules above.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
