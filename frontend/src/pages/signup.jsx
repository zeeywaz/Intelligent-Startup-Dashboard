import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/signup.css";
import { API_BASE, getCookie } from "../lib/api";

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

  const valid = useMemo(() => {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
    const unameOk = form.username.trim().length >= 3;
    const namesOk = form.firstName.trim() && form.lastName.trim();
    const pwdOk = form.password.length >= 6 && form.password === form.confirm;
    return emailOk && unameOk && !!namesOk && pwdOk;
  }, [form]);

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
        const firstErr = typeof data === "object" && data ? Object.values(data)[0] : "Registration failed.";
        throw new Error(Array.isArray(firstErr) ? firstErr.join(" ") : String(firstErr));
      }

      nav(data?.next || "/userdashboard", { replace: true });
    } catch (e2) {
      setErr(e2.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reg-app">
      <a href="/" className="reg-brand" aria-label="IdeaForge home">ideaForge</a>
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
                <label htmlFor="cp" className="sr-only">Confirm password</label>
                <input id="cp" type="password" autoComplete="new-password"
                       className="reg-input" placeholder="Confirm password"
                       value={form.confirm} onChange={update("confirm")} required minLength={6} />
              </div>

              <div className="reg-field">
                <label htmlFor="pw" className="sr-only">Password</label>
                <input id="pw" type="password" autoComplete="new-password"
                       className="reg-input" placeholder="Password"
                       value={form.password} onChange={update("password")} required minLength={6} />
              </div>
            </div>

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
