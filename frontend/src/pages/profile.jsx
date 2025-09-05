import React, { useRef, useState } from "react";
import "../styles/profile.css";
import Header from "../components/Header.jsx";
import Footer from "../components/footer.jsx";
import { Pencil, Camera, Trash } from "lucide-react";

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

/* ---------- Avatar uploader ---------- */
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

/* ---------- Page ---------- */
export default function ProfilePage() {
  const [editing, setEditing] = useState(false);
  const [avatar, setAvatar] = useState(
    "https://placehold.co/320x320/7091E6/FFFFFF?text=%F0%9F%90%95"
  );
  const [form, setForm] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "johndoe@gmail.com",
    password: "**************",
    username: "johndoe88",
    birthday: "02/10/1999",
  });

  const update = (key) => (e) => setForm((s) => ({ ...s, [key]: e.target.value }));

  const onEditToggle = () => setEditing((v) => !v);

  const onDelete = () => {
    if (window.confirm("Delete your account? This cannot be undone.")) {
      // TODO: wire to API
      alert("Account deletion requested.");
    }
  };

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
              <button
                type="button"
                className="prof-btn prof-btn--primary prof-edit-btn"
                onClick={onEditToggle}
                aria-pressed={editing}
              >
                <span>{editing ? "Done" : "Edit"}</span>
                <Pencil size={16} aria-hidden />
              </button>
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
                id="pwd" label="Password" type="password"
                value={form.password} onChange={update("password")}
                readOnly={!editing}
              />
              <TextField
                id="un" label="Username"
                value={form.username} onChange={update("username")}
                readOnly={!editing}
              />
              <TextField
                id="bd" label="Birthday"
                value={form.birthday} onChange={update("birthday")}
                readOnly={!editing}
              />
            </div>
          </div>
        </section>

        {/* Danger zone */}
        <div className="prof-danger">
          <button type="button" className="prof-btn prof-btn--danger" onClick={onDelete}>
            <span>Delete Account</span>
            <Trash size={18} aria-hidden />
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
