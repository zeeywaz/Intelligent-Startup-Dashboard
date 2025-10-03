import React, { useEffect, useMemo, useState } from "react";
import Header from "../components/Header.jsx";
import Footer from "../components/footer.jsx";
import "../styles/admin_user.css";

/* ---- CONFIG ----
   Default backend API base. Change this if your Django server runs somewhere else.
   Example: "http://127.0.0.1:8000/api" or "https://api.myapp.com/api"
*/
const API_BASE = (typeof window !== "undefined" && window.__API_BASE__) || "http://localhost:8000/api";

/* Cookie helper to read CSRF token (Django default cookie name: csrftoken) */
function getCookie(name) {
  if (typeof document === "undefined") return null;
  const matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)"
  ));
  return matches ? decodeURIComponent(matches[1]) : null;
}

/* Small UI helpers */
function Badge({ kind = "pending", children }) {
  return <span className={`ad-badge ad-badge--${kind}`}>{children}</span>;
}
function SmallButton({ kind = "ghost", children, ...props }) {
  return (
    <button className={`ad-btn ad-btn--${kind}`} {...props}>
      {children}
    </button>
  );
}

/* Simple modal for viewing attached docs */
function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="ad-modal" role="dialog" aria-modal="true" aria-labelledby="ad-modal-title">
      <div className="ad-modal__panel">
        <div className="ad-modal__head">
          <h3 id="ad-modal-title" className="ad-modal__title">{title}</h3>
          <button className="ad-btn ad-btn--ghost" onClick={onClose} aria-label="Close">Close</button>
        </div>
        <div className="ad-modal__body">{children}</div>
      </div>
    </div>
  );
}

export default function AdminUser() {
  /* ---- Pending investors (sample data until you wire real API) ---- */
  const [pending, setPending] = useState([
    { id: 1, name: "Akil Sabry", email: "akilsabry69@gmail.com", date: "August 22, 2025", status: "pending", docName: "Bank Slip (PDF)", docUrl: "/docs/akil-slip.pdf" },
    { id: 2, name: "Bill Gates", email: "billgates@gmail.com", date: "August 26, 2025", status: "pending", docName: "Company Ownership (Image)", docUrl: "/docs/bill-ownership.png" },
    { id: 3, name: "Elon Musk", email: "elonmusk@gmail.com", date: "August 29, 2025", status: "pending", docName: "Proof of Funds (PDF)", docUrl: "/docs/elon-proof.pdf" },
  ]);

  /* ---- Users fetched from backend ---- */
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");

  /* ---- Search ---- */
  const [qPending, setQPending] = useState("");
  const [qUsers, setQUsers] = useState("");

  const filteredPending = useMemo(() => {
    const q = qPending.trim().toLowerCase();
    if (!q) return pending;
    return pending.filter(r => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.date.toLowerCase().includes(q));
  }, [pending, qPending]);

  const filteredUsers = useMemo(() => {
    const q = qUsers.trim().toLowerCase();
    if (!q) return users;
    return users.filter(r => {
      const fullName = `${r.first_name || ""} ${r.last_name || ""}`.trim().toLowerCase();
      return fullName.includes(q) || (r.email || "").toLowerCase().includes(q) || (r.date_joined || "").toLowerCase().includes(q);
    });
  }, [users, qUsers]);

  /* ---- Fetch users from backend ---- */
  async function fetchUsers() {
    setUsersLoading(true);
    setUsersError("");
    try {
      // Use absolute URL to avoid React dev-server intercepting /api/ requests
      const resp = await fetch(`${API_BASE}/admin/users/`, {
        method: "GET",
        credentials: "include", // include cookies for session auth
        headers: { Accept: "application/json" },
      });

      if (resp.status === 403) {
        // Permission error - your session may not be an admin
        setUsersError("403 Forbidden — you must be an admin (or authenticate) to view users.");
        setUsers([]);
        return;
      }
      if (!resp.ok) {
        const txt = await resp.text().catch(() => null);
        throw new Error(txt || `HTTP ${resp.status}`);
      }
      const data = await resp.json();
      if (!Array.isArray(data)) {
        // In case your view returns {"users": [...] } adjust here accordingly
        console.warn("Unexpected users payload:", data);
        setUsers(Array.isArray(data.users) ? data.users : []);
      } else {
        setUsers(data);
      }
    } catch (err) {
      console.error("fetchUsers error:", err);
      setUsersError(err.message || "Failed to fetch users.");
    } finally {
      setUsersLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Actions ---- */
  const setInvestorStatus = (id, status) =>
    setPending(rows => rows.map(r => (r.id === id ? { ...r, status } : r)));

  async function deleteUser(id) {
    const ok = window.confirm("Are you sure you want to delete this account? This action cannot be undone.");
    if (!ok) return;

    try {
      const csrftoken = getCookie("csrftoken"); // Django CSRF cookie name
      const resp = await fetch(`${API_BASE}/admin/users/${id}/delete/`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Accept": "application/json",
          // include CSRF token for unsafe request if using session auth
          ...(csrftoken ? { "X-CSRFToken": csrftoken } : {}),
        },
      });

      if (resp.status === 204 || resp.status === 200) {
        // success — remove locally
        setUsers(rows => rows.filter(r => r.id !== id));
        return;
      }

      if (resp.status === 403) {
        const j = await resp.json().catch(() => null);
        alert((j && (j.detail || j.error)) || "Forbidden (not allowed to delete). Are you logged in as admin?");
        return;
      }

      // Try parse error
      let errMsg = `Delete failed (status ${resp.status})`;
      try {
        const j = await resp.json();
        errMsg = j.error || j.detail || JSON.stringify(j);
      } catch (e) {
        const txt = await resp.text().catch(() => "");
        if (txt) errMsg = txt;
      }
      alert(errMsg);
    } catch (err) {
      console.error("deleteUser error:", err);
      alert(err.message || "Delete failed");
    }
  }

  /* ---- Doc modal ---- */
  const [docOpen, setDocOpen] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docUrl, setDocUrl] = useState("");

  const openDoc = (row) => {
    setDocTitle(`${row.name} — ${row.docName || "Attached Document"}`);
    setDocUrl(row.docUrl || "");
    setDocOpen(true);
  };

  return (
    <div className="app">
      <Header />

      <main className="ad-main">
        <div className="ad-container">
          <h1 className="ad-h1">Admin Dashboard</h1>

          {/* Pending Investors */}
          <section className="ad-panel">
            <div className="ad-panel__bar">
              <h2 className="ad-panel__title">Pending Investors</h2>
              <div className="ad-search">
                <span aria-hidden>🔎</span>
                <input value={qPending} onChange={(e) => setQPending(e.target.value)} placeholder="Search" aria-label="Search pending investors" />
              </div>
            </div>

            <div className="ad-table" role="table" aria-label="Pending investors">
              <div className="ad-tr ad-tr--head" role="row">
                <div className="ad-th" role="columnheader">Name</div>
                <div className="ad-th" role="columnheader">Email</div>
                <div className="ad-th" role="columnheader">Date</div>
                <div className="ad-th" role="columnheader">Status</div>
                <div className="ad-th ad-th--actions" role="columnheader"></div>
              </div>

              {filteredPending.map((r) => (
                <div className="ad-tr" role="row" key={r.id}>
                  <div className="ad-td" role="cell">{r.name}</div>
                  <div className="ad-td" role="cell">{r.email}</div>
                  <div className="ad-td" role="cell">{r.date}</div>
                  <div className="ad-td" role="cell">
                    <Badge kind={r.status === "pending" ? "pending" : r.status === "approved" ? "active" : "pending"}>
                      {r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : "Pending"}
                    </Badge>
                  </div>
                  <div className="ad-td ad-td--actions" role="cell">
                    <SmallButton kind="ghost" onClick={() => openDoc(r)}>View Attached Doc</SmallButton>
                    <SmallButton kind="outline" onClick={() => setInvestorStatus(r.id, "rejected")}>Reject</SmallButton>
                    <SmallButton kind="primary" onClick={() => setInvestorStatus(r.id, "approved")}>Approve</SmallButton>
                  </div>
                </div>
              ))}

              {filteredPending.length === 0 && <p style={{ padding: "1rem" }}>No pending investors.</p>}
            </div>
          </section>

          {/* Manage Users */}
          <section className="ad-panel">
            <div className="ad-panel__bar">
              <h2 className="ad-panel__title">Manage Users</h2>
              <div className="ad-search">
                <span aria-hidden>🔎</span>
                <input value={qUsers} onChange={(e) => setQUsers(e.target.value)} placeholder="Search users" aria-label="Search users" />
              </div>
            </div>

            <div className="ad-table" role="table" aria-label="Manage users">
              <div className="ad-tr ad-tr--head" role="row">
                <div className="ad-th" role="columnheader">Name</div>
                <div className="ad-th" role="columnheader">Email</div>
                <div className="ad-th" role="columnheader">Date Created</div>
                <div className="ad-th ad-th--actions" role="columnheader"></div>
              </div>

              {usersLoading && <p style={{ padding: "1rem" }}>Loading users...</p>}
              {usersError && <p style={{ padding: "1rem", color: "crimson" }}>{usersError}</p>}

              {!usersLoading && !usersError && filteredUsers.map((r) => (
                <div className="ad-tr" role="row" key={r.id}>
                  <div className="ad-td" role="cell">{(r.first_name || "") + " " + (r.last_name || "")}</div>
                  <div className="ad-td" role="cell">{r.email}</div>
                  <div className="ad-td" role="cell">{r.date_joined ? new Date(r.date_joined).toLocaleDateString() : "—"}</div>
                  <div className="ad-td ad-td--actions" role="cell">
                    <SmallButton kind="danger" onClick={() => deleteUser(r.id)}>Delete Account</SmallButton>
                  </div>
                </div>
              ))}

              {!usersLoading && !usersError && filteredUsers.length === 0 && <p style={{ padding: "1rem" }}>No users found.</p>}
            </div>
          </section>
        </div>
      </main>

      {/* Doc Modal */}
      <Modal open={docOpen} title={docTitle} onClose={() => setDocOpen(false)}>
        {docUrl ? <iframe title="Attached Document" src={docUrl} className="ad-doc-viewer" /> : <p>No document attached.</p>}
      </Modal>

      <Footer />
    </div>
  );
}
