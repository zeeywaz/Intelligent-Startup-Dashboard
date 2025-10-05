// src/pages/AdminUser.jsx
import React, { useEffect, useMemo, useState } from "react";
import Header from "../components/Header.jsx";
import Footer from "../components/footer.jsx";
import { API_BASE, getCookie } from "../lib/api"; // adjust path if necessary
import "../styles/admin_user.css";

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

/* Modal */
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
  const [pending, setPending] = useState([]);
  const [users, setUsers] = useState([]);

  // search
  const [qPending, setQPending] = useState("");
  const [qUsers, setQUsers] = useState("");

  // doc modal state
  const [docOpen, setDocOpen] = useState(false);
  const [docLoading, setDocLoading] = useState(false);
  const [docList, setDocList] = useState([]); // [{file_name, url}]
  const [docTitle, setDocTitle] = useState("");

  const fetchPending = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/pending-investors/`, {
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed (${res.status})`);
      }
      const data = await res.json();
      setPending(data || []);
    } catch (e) {
      console.error("Failed to load pending:", e);
      setPending([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/`, {
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed (${res.status})`);
      }
      const data = await res.json();
      setUsers(data || []);
    } catch (e) {
      console.error("Failed to load users:", e);
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchPending();
    fetchUsers();
  }, []);

  const filteredPending = useMemo(() => {
    const q = qPending.trim().toLowerCase();
    if (!q) return pending;
    return pending.filter(
      (r) =>
        (r.investor_name || r.name || "").toLowerCase().includes(q) ||
        (r.email_address || r.email || "").toLowerCase().includes(q) ||
        (r.company_name || r.company || "").toLowerCase().includes(q)
    );
  }, [pending, qPending]);

  const filteredUsers = useMemo(() => {
    const q = qUsers.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (r) =>
        (r.first_name || r.name || "").toLowerCase().includes(q) ||
        (r.email || "").toLowerCase().includes(q)
    );
  }, [users, qUsers]);

  /* ---- Actions ---- */
  const approveInvestor = async (investor_id) => {
    // eslint-disable-next-line no-restricted-globals
    if (!window.confirm("Approve this investor?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/investor/${investor_id}/approve/`, {
        method: "POST",
        credentials: "include",
        headers: { "X-CSRFToken": getCookie("csrftoken") },
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to approve");
      }
      await fetchPending();
    } catch (e) {
      console.error(e);
      alert("Approve failed.");
    }
  };

  const rejectInvestor = async (investor_id) => {
    // eslint-disable-next-line no-restricted-globals
    if (!window.confirm("Reject and delete this investor (including account)?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/investor/${investor_id}/reject/`, {
        method: "POST",
        credentials: "include",
        headers: { "X-CSRFToken": getCookie("csrftoken") },
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to reject");
      }
      await fetchPending();
      await fetchUsers();
    } catch (e) {
      console.error(e);
      alert("Reject failed.");
    }
  };

  /* ---- Doc modal / view ---- */
  const openDoc = async (row) => {
    // row must contain investor_id
    const investor_id = row.investor_id || row.id || row.user_id;
    if (!investor_id) {
      alert("No investor id available.");
      return;
    }
    setDocLoading(true);
    setDocTitle(`${row.investor_name || row.name || row.email || "Investor"} — documents`);
    setDocList([]);
    setDocOpen(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/investor/${investor_id}/docs/`, {
        credentials: "include",
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Failed (${res.status})`);
      }
      const data = await res.json();
      // data expected: [{ file_name, url }, ...]
      setDocList(data || []);
    } catch (e) {
      console.error("Failed to load docs:", e);
      setDocList([]);
      alert("Could not load documents. Check server logs.");
    } finally {
      setDocLoading(false);
    }
  };

  const openInNewTab = (url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener");
  };

  const deleteUser = async (userId) => {
    // eslint-disable-next-line no-restricted-globals
    if (!window.confirm("Delete account? This is destructive.")) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/`, {
        method: "DELETE",
        credentials: "include",
        headers: { "X-CSRFToken": getCookie("csrftoken") },
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to delete");
      }
      fetchUsers();
      fetchPending();
    } catch (e) {
      console.error(e);
      alert("Delete failed.");
    }
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
                <input
                  value={qPending}
                  onChange={(e) => setQPending(e.target.value)}
                  placeholder="Search pending investors"
                  aria-label="Search pending investors"
                />
              </div>
            </div>

            <div className="ad-table" role="table" aria-label="Pending investors">
              <div className="ad-tr ad-tr--head" role="row">
                <div className="ad-th" role="columnheader">Name</div>
                <div className="ad-th" role="columnheader">Email / Company</div>
                <div className="ad-th" role="columnheader">Phone</div>
                <div className="ad-th" role="columnheader">Status</div>
                <div className="ad-th ad-th--actions" role="columnheader"></div>
              </div>

              {filteredPending.length === 0 && (
                <div className="ad-tr" role="row">
                  <div className="ad-td" role="cell" style={{ padding: "1rem" }}>
                    No pending investors.
                  </div>
                </div>
              )}

              {filteredPending.map((r) => (
                <div className="ad-tr" role="row" key={r.investor_id || r.user_id || r.id}>
                  <div className="ad-td" role="cell">{r.investor_name || r.name || "—"}</div>
                  <div className="ad-td" role="cell">
                    <div style={{ fontWeight: 700 }}>{r.email_address || r.email || "—"}</div>
                    <div style={{ color: "#6b7280", fontSize: ".9rem" }}>{r.company_name || r.company || ""}</div>
                  </div>
                  <div className="ad-td" role="cell">{r.phone || "—"}</div>
                  <div className="ad-td" role="cell"><Badge kind={r.verification_status === "approved" ? "active" : "pending"}>{r.verification_status || "pending"}</Badge></div>
                  <div className="ad-td ad-td--actions" role="cell">
                    <SmallButton kind="ghost" onClick={() => openDoc(r)}>View Attached Doc</SmallButton>
                    <SmallButton kind="outline" onClick={() => rejectInvestor(r.investor_id)}>Reject</SmallButton>
                    <SmallButton kind="primary" onClick={() => approveInvestor(r.investor_id)}>Approve</SmallButton>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Manage Users */}
          <section className="ad-panel">
            <div className="ad-panel__bar">
              <h2 className="ad-panel__title">Manage Users</h2>
              <div className="ad-search">
                <span aria-hidden>🔎</span>
                <input
                  value={qUsers}
                  onChange={(e) => setQUsers(e.target.value)}
                  placeholder="Search users"
                  aria-label="Search users"
                />
              </div>
            </div>

            <div className="ad-table" role="table" aria-label="Manage users">
              <div className="ad-tr ad-tr--head" role="row">
                <div className="ad-th" role="columnheader">Name</div>
                <div className="ad-th" role="columnheader">Email</div>
                <div className="ad-th" role="columnheader">Date Created</div>
                <div className="ad-th" role="columnheader">Status</div>
                <div className="ad-th ad-th--actions" role="columnheader"></div>
              </div>

              {filteredUsers.length === 0 && (
                <div className="ad-tr" role="row">
                  <div className="ad-td" role="cell" style={{ padding: "1rem" }}>
                    No users available (implement /api/admin/users/ to populate).
                  </div>
                </div>
              )}

              {filteredUsers.map((r) => (
                <div className="ad-tr" role="row" key={r.id}>
                  <div className="ad-td" role="cell">{`${r.first_name || ""} ${r.last_name || ""}`.trim()}</div>
                  <div className="ad-td" role="cell">{r.email}</div>
                  <div className="ad-td" role="cell">{r.date_joined ? new Date(r.date_joined).toLocaleDateString() : "—"}</div>
                  <div className="ad-td" role="cell"><Badge kind={r.is_active ? "active" : "pending"}>{r.is_active ? "active" : "inactive"}</Badge></div>
                  <div className="ad-td ad-td--actions" role="cell">
                    <SmallButton kind="danger" onClick={() => deleteUser(r.id)}>Delete Account</SmallButton>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Doc Modal */}
      <Modal open={docOpen} title={docTitle} onClose={() => setDocOpen(false)}>
        {docLoading && <div>Loading documents…</div>}

        {!docLoading && docList.length === 0 && <div>No documents attached.</div>}

        {!docLoading && docList.length > 0 && (
          <div style={{ display: "grid", gap: 12 }}>
            {docList.map((d, idx) => {
              const ext = (d.file_name || d.url || "").split(".").pop()?.toLowerCase() || "";
              const isImage = ["png","jpg","jpeg","gif","webp"].includes(ext);
              return (
                <div key={idx} style={{ borderRadius: 8, padding: 8, background: "#fafafa", display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{d.file_name}</div>
                    <div style={{ color: "#6b7280", fontSize: ".9rem" }}>{d.url}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {isImage ? (
                      <button className="ad-btn ad-btn--ghost" onClick={() => openInNewTab(d.url)}>Open Image</button>
                    ) : (
                      <button className="ad-btn ad-btn--ghost" onClick={() => openInNewTab(d.url)}>Open Document</button>
                    )}
                    <a className="ad-btn ad-btn--outline" href={d.url} target="_blank" rel="noopener noreferrer">Download</a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      <Footer />
    </div>
  );
}
