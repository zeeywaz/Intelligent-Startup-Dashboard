import React, { useMemo, useRef, useState } from "react";
import "../styles/investor_sigup.css";

/**
 * Helpers
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FILES = 3;
const MAX_BYTES = 10 * 1024 * 1024; // 10MB per file
const ACCEPT = ".pdf,.png,.jpg,.jpeg";

export default function InvestorSignUpPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirm: "",
    birthday: "",
    verifyType: "ownership", // 'ownership' | 'financial'
    consent: false,
  });

  const [files, setFiles] = useState([]); // [{file, id, name, size}]
  const [busy, setBusy] = useState(false);
  const pickerRef = useRef(null);

  const update = (key) => (e) => setForm((s) => ({ ...s, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const valid = useMemo(() => {
    const emailOk = EMAIL_RE.test(form.email.trim());
    const unameOk = form.username.trim().length >= 3;
    const namesOk = form.firstName.trim() && form.lastName.trim();
    const pwdOk = form.password.length >= 6 && form.password === form.confirm;
    const docsOk = files.length > 0 && files.length <= MAX_FILES && files.every(f => f.size <= MAX_BYTES);
    return emailOk && unameOk && !!namesOk && pwdOk && form.consent && docsOk;
  }, [form, files]);

  const onPick = (fileList) => {
    const incoming = Array.from(fileList ?? []).slice(0, MAX_FILES - files.length);
    const safe = incoming
      .filter(f => f.size <= MAX_BYTES)
      .filter(f => ACCEPT.split(",").some(ext => f.name.toLowerCase().endsWith(ext.trim())))
      .map((f) => ({ file: f, id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2)}`, name: f.name, size: f.size }));

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

    try {
      // Build payload; back end can extract text & create embeddings server-side.
      const data = new FormData();
      data.append("firstName", form.firstName.trim());
      data.append("lastName", form.lastName.trim());
      data.append("username", form.username.trim());
      data.append("email", form.email.trim());
      data.append("password", form.password);
      data.append("birthday", form.birthday.trim());
      data.append("verifyType", form.verifyType);
      files.forEach((f, i) => data.append("docs", f.file, f.name));

      // Example POST (adjust URL/auth as needed):
      // const res = await fetch("/api/auth/signup-with-docs", { method: "POST", body: data, credentials: "include" });
      // if (!res.ok) throw new Error("Signup failed");
      // await res.json();

      alert(`Submitted sign up for ${form.username} with ${files.length} document(s).`);
    } catch (err) {
      console.error(err);
      alert("There was a problem submitting your registration.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="regv-app">
      <a href="/" className="regv-brand" aria-label="IdeaForge home">ideaForge</a>

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

              <div className="regv-field">
                <label htmlFor="cp" className="sr-only">Confirm password</label>
                <input id="cp" type="password" autoComplete="new-password"
                       className="regv-input" placeholder="Confirm password"
                       value={form.confirm} onChange={update("confirm")} required minLength={6} />
              </div>

              <div className="regv-field">
                <label htmlFor="pw" className="sr-only">Password</label>
                <input id="pw" type="password" autoComplete="new-password"
                       className="regv-input" placeholder="Password"
                       value={form.password} onChange={update("password")} required minLength={6} />
              </div>
            </div>

            <div className="regv-field regv-field--wide">
              <label htmlFor="bd" className="sr-only">Birthday</label>
              <input id="bd" className="regv-input" placeholder="Birthday (DD/MM/YY)"
                     value={form.birthday} onChange={update("birthday")} inputMode="numeric" />
            </div>

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
                <p className="regv-drop__hint">Drag & drop or <button type="button" className="regv-link" onClick={() => pickerRef.current?.click()}>browse</button> (PDF/JPG/PNG, max {MAX_FILES} files, ≤ 10MB each)</p>
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
                      <button type="button" className="regv-file__remove" onClick={() => onRemove(f.id)} aria-label={`Remove ${f.name}`}>Remove</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Consent */}
            <label className="regv-consent">
              <input type="checkbox" checked={form.consent} onChange={update("consent")} />
              <span>
                I confirm these documents are mine and I consent to secure processing for verification.
              </span>
            </label>

            {/* Submit */}
            <button type="submit" className="regv-btn" disabled={!valid || busy}>
              {busy ? "Submitting..." : "Register"}
            </button>
          </form>

          <div className="regv-meta">
            <p>Already a user? <a href="/login" className="regv-link">Log in here</a></p>
            <p className="regv-fine">Uploads are encrypted in transit; avoid passwords or unrelated sensitive data in attachments.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
