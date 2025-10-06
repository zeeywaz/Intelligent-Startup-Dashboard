import React, { useEffect, useRef, useState } from "react";
import "../styles/profile.css";
import Header from "../components/Header.jsx";
import Footer from "../components/footer.jsx";
import { Pencil, Camera, Trash, Lock } from "lucide-react";
import { API_BASE } from "../lib/api";

/* ---------- small helper to read csrftoken cookie ---------- */
function getCSRFCookie() {
  const m = document.cookie.match(/(^|;)\s*csrftoken=([^;]+)/);
  return m ? decodeURIComponent(m[2]) : "";
}

/* ---------- Reusable input ---------- */
function TextField({ id, label, type = "text", value, onChange, readOnly }) {
  return (
    <div className="prof-field">
      <label htmlFor={id} className="prof-label">{label}</label>
      <input
        id={id}
        className="prof-input"
        type={type}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        aria-readonly={readOnly}
      />
    </div>
  );
}

/* ---------- Avatar uploader (client-side preview only) ---------- */
function Avatar({ src, onPick }) {
  const fileRef = useRef(null);
  return (
    <div className="prof-avatar">
      <img src={src} alt="Profile avatar" className="prof-avatar__img" />
      <button
        type="button"
        className="prof-btn prof-btn--primary prof-avatar__btn"
        onClick={() => fileRef.current?.click()}
      >
        <Camera size={16} aria-hidden />
        <span>Change Photo</span>
        <Pencil size={14} className="prof-btn__trail" aria-hidden />
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(URL.createObjectURL(f));
        }}
      />
    </div>
  );
}

/* ---------- Password Modal ---------- */
function PasswordModal({ open, onClose, onSuccess }) {
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const dialogRef = useRef(null);

  useEffect(() => {
    if (open) {
      setP1(""); setP2(""); setErr("");
      setTimeout(() => dialogRef.current?.focus(), 0);
    }
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setErr("");

    try {
      setBusy(true);
      const res = await fetch(`${API_BASE}/api/profile/change-password/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCSRFCookie(),
        },
        body: JSON.stringify({ newPassword: p1, confirmPassword: p2 }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      onSuccess(j?.message || "Password updated.");
      onClose();
    } catch (e2) {
      setErr(e2.message || "Couldn't change password.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;
  return (
    <div className="prof-modal__backdrop" onMouseDown={onClose}>
      <div
        className="prof-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwd-title"
        onMouseDown={(e) => e.stopPropagation()}
        tabIndex={-1}
        ref={dialogRef}
      >
        <h3 id="pwd-title" className="prof-modal__title">
          Change Password
        </h3>

        <form onSubmit={submit} className="prof-modal__form">
          <label className="prof-label" htmlFor="np1">New password</label>
          <input
            id="np1"
            className="prof-input"
            type="password"
            minLength={6}
            value={p1}
            onChange={(e) => setP1(e.target.value)}
            required
          />
          <label className="prof-label" htmlFor="np2">Confirm new password</label>
          <input
            id="np2"
            className="prof-input"
            type="password"
            minLength={6}
            value={p2}
            onChange={(e) => setP2(e.target.value)}
            required
          />

          {err && <p className="prof-error" role="alert">{err}</p>}

          <div className="prof-modal__actions">
            <button type="button" className="prof-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="prof-btn prof-btn--primary" disabled={busy}>
              <Lock size={16} aria-hidden /> {busy ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function ProfilePage() {
  const [editing, setEditing] = useState(false);
  const [avatar, setAvatar] = useState(
    "https://placehold.co/320x320/7091E6/FFFFFF?text=%F0%9F%90%95"
  );
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
  });
  const [statusMsg, setStatusMsg] = useState("");
  const [err, setErr] = useState("");

  const [pwdOpen, setPwdOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Investor view-only info
  const [investor, setInvestor] = useState(null);         // { verification_status, credit_score, ... }
  const [loadingInvestor, setLoadingInvestor] = useState(false);

  const update = (key) => (e) => setForm((s) => ({ ...s, [key]: e.target.value }));

  // Load current user and (if investor) their verification/score
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/me/`, { credentials: "include" });
        const j = await res.json();
        if (j?.authenticated) {
          const u = j.user || {};
          const email = u.email || "";
          setForm({
            firstName: u.firstName || "",
            lastName:  u.lastName  || "",
            email:     email,
            username:  u.username  || "",
          });

          // Try to find an investor record by email; if found, show read-only section.
          if (email) {
            setLoadingInvestor(true);
            try {
              const ires = await fetch(
                `${API_BASE}/api/investors/?search=${encodeURIComponent(email)}`,
                { credentials: "include" }
              );
              if (ires.ok) {
                const data = await ires.json();
                const list = Array.isArray(data) ? data : (data.results || data.items || []);
                const match = list.find(
                  (it) =>
                    String(it.email_address || it.email || "")
                      .toLowerCase() === String(email).toLowerCase()
                );
                if (match) setInvestor(match);
              }
            } finally {
              setLoadingInvestor(false);
            }
          }
        }
      } catch {/* ignore */}
    })();
  }, []);

  const onEditToggle = () => {
    setStatusMsg("");
    setErr("");
    setEditing((v) => !v);
  };

  const onSave = async () => {
    setErr(""); setStatusMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/profile/`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCSRFCookie(),
        },
        body: JSON.stringify(form),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      setStatusMsg("Profile saved successfully.");
      setEditing(false);
    } catch (e) {
      setErr(e.message || "Could not save profile.");
    }
  };

  const onDelete = async () => {
    if (!window.confirm("Delete your account? This cannot be undone.")) return;

    try {
      setDeleting(true);
      setErr(""); setStatusMsg("");

      const res = await fetch(`${API_BASE}/api/account/`, {
        method: "DELETE",
        credentials: "include",
        headers: { "X-CSRFToken": getCSRFCookie() },
      });

      if (res.status === 204) {
        setStatusMsg("Your account has been deleted.");
        setTimeout(() => { window.location.href = "/"; }, 800);
      } else if (res.status === 401) {
        setErr("Please log in to delete your account.");
      } else {
        const j = await res.json().catch(() => ({}));
        setErr(j?.error || `Delete failed (HTTP ${res.status}).`);
      }
    } catch (e) {
      setErr(e.message || "Network error while deleting account.");
    } finally {
      setDeleting(false);
    }
  };

  const status = (investor?.verification_status || "pending").toLowerCase();
  const score = typeof investor?.credit_score === "number" ? investor.credit_score : null;

  return (
    <div className="prof-app">
      <Header />

      <main id="main" className="prof-main" role="main">
        <h2 className="prof-heading">Your Profile</h2>

        <section className="prof-layout" aria-label="Profile">
          {/* Left column: avatar */}
          <Avatar src={avatar} onPick={setAvatar} />

          {/* Right column: card */}
          <div className="prof-card">
            <div className="prof-card__actions">
              {editing ? (
                <>
                  <button type="button" className="prof-btn" onClick={onEditToggle}>Cancel</button>
                  <button type="button" className="prof-btn prof-btn--primary" onClick={onSave}>
                    Save
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="prof-btn prof-btn--primary prof-edit-btn"
                  onClick={onEditToggle}
                >
                  <span>Edit</span>
                  <Pencil size={16} aria-hidden />
                </button>
              )}
            </div>

            <div className="prof-grid">
              <TextField
                id="fn" label="First Name"
                value={form.firstName} onChange={update("firstName")}
                readOnly={!editing}
              />
              <TextField
                id="ln" label="Last Name"
                value={form.lastName} onChange={update("lastName")}
                readOnly={!editing}
              />
              <TextField
                id="email" label="Email" type="email"
                value={form.email} onChange={update("email")}
                readOnly={!editing}
              />
              <TextField
                id="un" label="Username"
                value={form.username} onChange={update("username")}
                readOnly={!editing}
              />
            </div>

            {/* Investor read-only section */}
            {(loadingInvestor || investor) && (
              <>
                <div className="prof-line" />
                <div className="prof-meta">
                  <div className="prof-meta__head">
                    <h3 className="prof-section-title">Investor Verification</h3>
                    {loadingInvestor && <span className="prof-muted">Loading…</span>}
                  </div>

                  {investor ? (
                    <>
                      <div className="prof-meta-grid">
                        <div className="prof-meta-item">
                          <div className="prof-label">Verification status</div>
                          <div>
                            <span className={`prof-badge prof-badge--${status}`}>
                              {investor.verification_status || "pending"}
                            </span>
                          </div>
                        </div>
                        <div className="prof-meta-item">
                          <div className="prof-label">Credit score</div>
                          <div>
                            <span className="prof-chip prof-chip--score">
                              {score ?? "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="prof-note">
                        These values are set by our team during verification and can’t be edited.
                      </p>
                    </>
                  ) : (
                    <p className="prof-muted">No investor profile found for this account.</p>
                  )}
                </div>
              </>
            )}

            <div className="prof-line" />

            <div className="prof-actions-row">
              <button
                type="button"
                className="prof-btn prof-btn--ghost"
                onClick={() => setPwdOpen(true)}
              >
                <Lock size={16} aria-hidden /> Change Password
              </button>
            </div>

            {statusMsg && <p className="prof-ok">{statusMsg}</p>}
            {err && <p className="prof-error" role="alert">{err}</p>}
          </div>
        </section>

        {/* Danger zone */}
        <div className="prof-danger">
          <button
            type="button"
            className="prof-btn prof-btn--danger"
            onClick={onDelete}
            disabled={deleting}
          >
            <span>{deleting ? "Deleting…" : "Delete Account"}</span>
            <Trash size={18} aria-hidden />
          </button>
        </div>
      </main>

      <Footer />

      {/* Password modal */}
      <PasswordModal
        open={pwdOpen}
        onClose={() => setPwdOpen(false)}
        onSuccess={(msg) => setStatusMsg(msg)}
      />
    </div>
  );
}
