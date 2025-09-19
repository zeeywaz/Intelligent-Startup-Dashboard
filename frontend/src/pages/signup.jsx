import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/signup.css";
import { API_BASE, getCookie } from "../lib/api";

const PWD_RULES = [
  { id: "len",    test: (s) => s.length >= 8,                     label: "At least 8 characters" },
  { id: "up",     test: (s) => /[A-Z]/.test(s),                   label: "One uppercase letter (A–Z)" },
  { id: "low",    test: (s) => /[a-z]/.test(s),                   label: "One lowercase letter (a–z)" },
  { id: "dig",    test: (s) => /\d/.test(s),                      label: "One number (0–9)" },
  { id: "spec",   test: (s) => /[~!@#$%^&*()_\-+={}\[\]|\\:;\"'<>,.?/`]/.test(s), label: "One special character" },
  { id: "space",  test: (s) => !/\s/.test(s),                     label: "No spaces" },
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
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const update = (key) => (e) => setForm((s) => ({ ...s, [key]: e.target.value }));

  const pwdChecks = useMemo(
    () => PWD_RULES.map((r) => ({ id: r.id, ok: r.test(form.password), label: r.label })),
    [form.password]
  );
  const pwdOk = pwdChecks.every((c) => c.ok);

  const valid = useMemo(() => {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
    const unameOk = form.username.trim().length >= 3;
    const namesOk = form.firstName.trim() && form.lastName.trim();
    const matchOk = form.password === form.confirm;
    return emailOk && unameOk && !!namesOk && pwdOk && matchOk;
  }, [form, pwdOk]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!valid || loading) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        credentials: "include",
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          username: form.username,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const firstErr =
          (typeof data === "object" && data && (data.error || Object.values(data)[0])) ||
          "Registration failed.";
        throw new Error(Array.isArray(firstErr) ? firstErr.join(" ") : String(firstErr));
      }

      nav(data?.next || "/chatbot", { replace: true });
    } catch (e2) {
      setErr(e2.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reg-app">
      <Link to="/" className="auth-brand" aria-label="IdeaForge home">
  <img
    src="/logo-black.png"   // or /logo-white.png depending on background
    alt="IdeaForge"
    className="auth-logo"
    height={40}
  />
</Link>

      <main id="main" className="reg-main" role="main">
        <section className="reg-card" aria-label="Create account">
          <header className="reg-head">
            <h1 className="reg-title">Get started now!</h1>
            <p className="reg-subtitle">Start building your dream startup!</p>
          </header>

          {err ? <p style={{ color: "crimson", textAlign: "center" }}>{err}</p> : null}

          <form className="reg-form" onSubmit={onSubmit} noValidate>
            <div className="reg-grid">
              <div className="reg-field">
                <label htmlFor="fn" className="sr-only">First Name</label>
                <input id="fn" className="reg-input" placeholder="First Name"
                       value={form.firstName} onChange={update("firstName")} required />
              </div>

              <div className="reg-field">
                <label htmlFor="ln" className="sr-only">Last Name</label>
                <input id="ln" className="reg-input" placeholder="Last Name"
                       value={form.lastName} onChange={update("lastName")} required />
              </div>

              <div className="reg-field">
                <label htmlFor="un" className="sr-only">Username</label>
                <input id="un" className="reg-input" placeholder="Username"
                       value={form.username} onChange={update("username")}
                       required minLength={3} autoComplete="username" />
              </div>

              <div className="reg-field">
                <label htmlFor="em" className="sr-only">Email</label>
                <input id="em" type="email" inputMode="email" autoComplete="email"
                       className="reg-input" placeholder="Email"
                       value={form.email} onChange={update("email")} required />
              </div>

              <div className="reg-field">
                <label htmlFor="pw" className="sr-only">Password</label>
                <input id="pw" type="password" autoComplete="new-password"
                       aria-describedby="pwd-help"
                       className="reg-input" placeholder="Password"
                       value={form.password} onChange={update("password")} required />
              </div>

              <div className="reg-field">
                <label htmlFor="cp" className="sr-only">Confirm password</label>
                <input id="cp" type="password" autoComplete="new-password"
                       className="reg-input" placeholder="Confirm password"
                       value={form.confirm} onChange={update("confirm")} required />
              </div>
            </div>

            {/* Password rules checklist */}
            <ul id="pwd-help" aria-live="polite" style={{margin:"6px 0 0", paddingLeft: "18px", fontSize: ".9rem"}}>
              {pwdChecks.map((c) => (
                <li key={c.id} style={{color: c.ok ? "green" : "#b91c1c"}}>
                  {c.ok ? "✓" : "•"} {c.label}
                </li>
              ))}
              <li style={{color: form.password && form.confirm && form.password === form.confirm ? "green" : "#b91c1c"}}>
                {form.password && form.confirm && form.password === form.confirm ? "✓" : "•"} Passwords match
              </li>
            </ul>

            <button type="submit" className="reg-btn" disabled={!valid || loading}>
              {loading ? "Registering..." : "Register"}
            </button>
          </form>

          <div className="reg-meta">
            <p>Already a user? <a href="/login" className="reg-link">Log in here</a></p>
            <p className="reg-fine">
              Are you an investor looking for start-ups?{" "}
              <a href="/investor_signup" className="reg-link">Click here to sign up as an investor</a>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
