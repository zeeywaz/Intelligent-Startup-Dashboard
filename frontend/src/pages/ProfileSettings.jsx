import React, { useRef, useState } from "react";

export default function ProfileSettings() {
  const [form, setForm] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "johndoe@gmail.com",
    password: "*************",
    username: "johndoe88",
    birthday: "1999-02-10",
  });

  const [original, setOriginal] = useState(form);
  const [isEditing, setIsEditing] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState(
    "https://api.builder.io/api/v1/image/assets/TEMP/d0c62b3e4a5fb854df9077f7664f28a5ec5bfd6f?width=754"
  );
  const [smallAvatarUrl] = useState(
    "https://api.builder.io/api/v1/image/assets/TEMP/322bd0ac4bb99d0f5d0694143b643899336c615b?width=200"
  );
  const fileRef = useRef(null);

  const [showDelete, setShowDelete] = useState(false);
  const [toast, setToast] = useState(null);

  const onEdit = () => {
    setOriginal(form);
    setIsEditing(true);
  };

  const onCancel = () => {
    setForm(original);
    setIsEditing(false);
    setToast({ type: "error", message: "Changes discarded" });
    dismissToastAfterDelay();
  };

  const onSave = () => {
    setIsEditing(false);
    setToast({ type: "success", message: "Profile updated successfully" });
    dismissToastAfterDelay();
  };

  const dismissToastAfterDelay = () => {
    window.clearTimeout(window.__pf_toast_timer);
    window.__pf_toast_timer = window.setTimeout(() => setToast(null), 2500);
  };

  const onChange = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const onChangePhoto = () => fileRef.current?.click();

  const onFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
    setToast({ type: "success", message: "Photo updated (not yet saved)" });
    dismissToastAfterDelay();
  };

  const confirmDelete = () => setShowDelete(true);
  const cancelDelete = () => setShowDelete(false);
  const performDelete = () => {
    setShowDelete(false);
    setToast({ type: "success", message: "Account deleted (demo)" });
    dismissToastAfterDelay();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-profile-blue/60 flex flex-col relative">
      {/* Header */}
      <header className="flex items-center justify-between px-6 sm:px-10 lg:px-14 pt-8">
        <h1 className="font-outfit font-extrabold text-3xl sm:text-4xl lg:text-5xl text-black select-none">
          ideaForge
        </h1>
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gray-200 shadow-card border border-white/40">
          <img src={smallAvatarUrl} alt="Profile" className="w-full h-full object-cover" />
        </div>
      </header>

      {/* Main content */}
      <main className="mt-8 sm:mt-12 flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-start justify-center gap-12 lg:gap-20">
            {/* Left: avatar + button */}
            <section className="flex flex-col items-center lg:items-center gap-6 w-full lg:w-[360px]">
              <h2 className="font-outfit font-black text-3xl sm:text-4xl text-black">
                Your Profile
              </h2>
              <div className="flex flex-col items-center gap-6">
                <div className="w-56 h-56 sm:w-72 sm:h-72 lg:w-[360px] lg:h-[360px] rounded-full overflow-hidden bg-gray-200 shadow-2xl border-8 border-white/40">
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={onFileSelected} className="hidden" />
                <button
                  type="button"
                  onClick={onChangePhoto}
                  className="inline-flex items-center gap-3 rounded-3xl bg-profile-purple px-8 py-3 text-white font-outfit font-semibold shadow-card hover:brightness-105 active:translate-y-px transition"
                >
                  <span>Change Photo</span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </button>
              </div>
            </section>

            {/* Right: card form */}
            <section className="flex-1 w-full">
              <div className="relative bg-white rounded-3xl shadow-card p-6 sm:p-10">
                {/* Edit / Save / Cancel controls */}
                <div className="absolute top-3 right-5 flex gap-3">
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={onEdit}
                      className="inline-flex items-center gap-2 rounded-full bg-profile-purple text-white font-semibold px-5 py-2.5 shadow-card hover:brightness-105 focus:ring-2 focus:ring-profile-purple/60"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                        <path d="m15 5 4 4" />
                      </svg>
                      Edit
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={onSave}
                        className="inline-flex items-center gap-2 rounded-full bg-green-600 text-white font-semibold px-5 py-2.5 shadow-card hover:brightness-105 focus:ring-2 focus:ring-green-600/60"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={onCancel}
                        className="inline-flex items-center gap-2 rounded-full bg-gray-200 text-gray-800 font-semibold px-5 py-2.5 shadow hover:bg-gray-300 focus:ring-2 focus:ring-gray-400/60"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>

                {/* Form grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Field label="First Name" type="text" value={form.firstName} readOnly={!isEditing} onChange={(v) => onChange("firstName", v)} />
                  <Field label="Last Name" type="text" value={form.lastName} readOnly={!isEditing} onChange={(v) => onChange("lastName", v)} />
                  <Field label="Email" type="email" value={form.email} readOnly={!isEditing} onChange={(v) => onChange("email", v)} />
                  <Field label="Password" type="password" value={form.password} readOnly={!isEditing} onChange={(v) => onChange("password", v)} />
                  <Field label="Username" type="text" value={form.username} readOnly={!isEditing} onChange={(v) => onChange("username", v)} />
                  <Field label="Birthday" type="date" value={form.birthday} readOnly={!isEditing} onChange={(v) => onChange("birthday", v)} />
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Delete floating button */}
      <div className="fixed right-6 bottom-6 z-50">
        <button
          type="button"
          onClick={confirmDelete}
          className="inline-flex items-center gap-3 rounded-3xl bg-profile-red text-white font-outfit font-semibold px-6 py-3 shadow-card hover:brightness-105 active:translate-y-px focus:ring-2 focus:ring-red-500/60"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            <line x1="10" x2="10" y1="11" y2="17" />
            <line x1="14" x2="14" y1="11" y2="17" />
          </svg>
          Delete Account
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDelete && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={cancelDelete} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-900">Delete account?</h3>
            <p className="mt-2 text-gray-600">This action is permanent in a real app. For this demo, we will just show a toast.</p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button type="button" onClick={cancelDelete} className="rounded-full bg-gray-200 text-gray-800 px-5 py-2.5 font-medium hover:bg-gray-300 focus:ring-2 focus:ring-gray-400/60">
                Cancel
              </button>
              <button type="button" onClick={performDelete} className="rounded-full bg-profile-red text-white px-5 py-2.5 font-semibold shadow hover:brightness-105 focus:ring-2 focus:ring-red-500/60">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-50">
          <div className={`rounded-full px-5 py-2.5 shadow-card text-white font-medium ${toast.type === "success" ? "bg-green-600" : "bg-gray-800"}`}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, type, value, readOnly, onChange }) {
  const isPassword = type === "password";
  const inputBase =
    "w-full px-5 sm:px-6 py-3.5 text-base sm:text-lg font-roboto rounded-2xl border shadow-inner focus:outline-none transition placeholder:text-gray-400";

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm sm:text-base font-roboto font-semibold text-black">{label}</label>
      <input
        type={type}
        readOnly={readOnly}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={[
          inputBase,
          readOnly
            ? "bg-white border-[1px] border-border-gray text-input-gray italic"
            : "bg-white border-[1px] border-profile-purple/60 focus:ring-2 focus:ring-profile-purple/40",
        ].join(" ")}
        {...(type === "date" && !readOnly ? { max: new Date().toISOString().slice(0, 10) } : {})}
        {...(isPassword && readOnly ? { type: "text" } : {})}
      />
    </div>
  );
}
