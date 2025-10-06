// src/pages/AdminUser.jsx
import React, { useEffect, useMemo, useState } from "react";
import Header from "../components/Header.jsx";
import Footer from "../components/footer.jsx";
import { API_BASE, getCookie } from "../lib/api"; // adjust path if necessary
import "../styles/admin_user.css";

/* ---------- Tiny UI helpers ---------- */
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

/* ---------- Modal ---------- */
function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="ad-modal" role="dialog" aria-modal="true" aria-labelledby="ad-modal-title">
      <div className="ad-modal__panel">
        <div className="ad-modal__head">
          <h3 id="ad-modal-title" className="ad-modal__title">{title}</h3>
          <button className="ad-btn ad-btn--ghost" onClick={onClose} aria-label="Close">Close</button>
        </div>
        <div className="ad-modal__body">{children}</div>
        {footer ? <div className="ad-modal__foot">{footer}</div> : null}
      </div>
    </div>
  );
}

/* ---------- Approve (verify) modal ---------- */
function ApproveModal({ open, row, onClose, onApproved }) {
  const [score, setScore] = useState(row?.credit_score ?? 700);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setScore(row?.credit_score ?? 700);
  }, [open, row]);

  const investor_id = row?.investor_id || row?.id || row?.user_id;

  const submit = async () => {
    if (!investor_id) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/investor/${investor_id}/approve/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({ credit_score: Number(score) }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to approve");
      }
      onApproved?.(investor_id);
      onClose?.();
    } catch (e) {
      console.error(e);
      alert("Approve failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Verify & approve investor"
      onClose={onClose}
      footer={
        <div className="ad-actions">
          <button className="ad-btn ad-btn--ghost" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="ad-btn ad-btn--primary" onClick={submit} disabled={submitting}>
            {submitting ? "Approving…" : "Approve"}
          </button>
        </div>
      }
    >
      <div className="ad-verify">
        <div className="ad-verify__who">
          <div className="ad-verify__name">{row?.investor_name || row?.name || "Investor"}</div>
          <div className="ad-verify__meta">
            <span>{row?.email_address || row?.email || "—"}</span>
            {row?.company_name ? <span>• {row.company_name}</span> : null}
            {row?.phone ? <span>• {row.phone}</span> : null}
          </div>
        </div>

        <div className="ad-form">
          <label className="ad-field">
            <span className="ad-label">Credit score</span>
            <div className="ad-input-row">
              <input
                type="number"
                min="0"
                max="1000"
                step="1"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="ad-input"
                placeholder="e.g. 720"
              />
              <span className="ad-score-chip">{String(score || 0)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1000"
              step="5"
              value={Number(score) || 0}
              onChange={(e) => setScore(e.target.value)}
              className="ad-range"
              aria-label="Credit score slider"
            />
            <div className="ad-range__scale">
              <span>0</span><span>500</span><span>1000</span>
            </div>
          </label>

          <p className="ad-help">
            The score will be saved with the investor’s profile and shown where relevant. You can change it later by editing the investor.
          </p>
        </div>
      </div>
    </Modal>
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
  const [docList, setDocList] = useState([]);
  const [docTitle, setDocTitle] = useState("");

  // approve modal
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveRow, setApproveRow] = useState(null);

  const fetchPending = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/pending-investors/`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPending(data || []);
    } catch (e) {
      console.error("Failed to load pending:", e);
      setPending([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
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
  const openApprove = (row) => {
    setApproveRow(row);
    setApproveOpen(true);
  };
  const onApproved = async () => {
    await fetchPending();
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
      if (!res.ok) throw new Error(await res.text());
      await fetchPending();
      await fetchUsers();
    } catch (e) {
      console.error(e);
      alert("Reject failed.");
    }
  };

  /* ---- Doc modal / view ---- */
  const openDoc = async (row) => {
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
      const res = await fetch(`${API_BASE}/api/admin/investor/${investor_id}/docs/`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
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
      if (!res.ok) throw new Error(await res.text());
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

            {/* data-kind controls the responsive grid in CSS */}
            <div className="ad-table" role="table" aria-label="Pending investors" data-kind="pending">
              <div className="ad-tr ad-tr--head" role="row">
                <div className="ad-th" role="columnheader">Name</div>
                <div className="ad-th" role="columnheader">Email / Company</div>
                <div className="ad-th" role="columnheader">Phone</div>
                <div className="ad-th" role="columnheader">Credit</div>
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
                  <div className="ad-td ad-td--email" role="cell">
                    <div className="ad-strong ad-ellipsis">{r.email_address || r.email || "—"}</div>
                    <div className="ad-muted ad-ellipsis">{r.company_name || r.company || ""}</div>
                  </div>
                  <div className="ad-td ad-ellipsis" role="cell" title={r.phone || ""}>{r.phone || "—"}</div>
                  <div className="ad-td" role="cell">
                    {typeof r.credit_score === "number"
                      ? <span className="ad-score-pill">{r.credit_score}</span>
                      : <span className="ad-score-pill ad-score-pill--muted">0</span>}
                  </div>
                  <div className="ad-td" role="cell">
                    <Badge kind={r.verification_status === "approved" ? "active" : "pending"}>
                      {r.verification_status || "pending"}
                    </Badge>
                  </div>
                  <div className="ad-td ad-td--actions" role="cell">
                    <div className="ad-actions">
                      <SmallButton kind="ghost" onClick={() => openDoc(r)}>View Docs</SmallButton>
                      <SmallButton kind="outline" onClick={() => rejectInvestor(r.investor_id)}>Reject</SmallButton>
                      <SmallButton kind="primary" onClick={() => openApprove(r)}>Approve</SmallButton>
                    </div>
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

            <div className="ad-table" role="table" aria-label="Manage users" data-kind="users">
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
                    No users available.
                  </div>
                </div>
              )}

              {filteredUsers.map((r) => (
                <div className="ad-tr" role="row" key={r.id}>
                  <div className="ad-td" role="cell">{`${r.first_name || ""} ${r.last_name || ""}`.trim()}</div>
                  <div className="ad-td ad-ellipsis" role="cell">{r.email}</div>
                  <div className="ad-td" role="cell">{r.date_joined ? new Date(r.date_joined).toLocaleDateString() : "—"}</div>
                  <div className="ad-td" role="cell"><Badge kind={r.is_active ? "active" : "pending"}>{r.is_active ? "active" : "inactive"}</Badge></div>
                  <div className="ad-td ad-td--actions" role="cell">
                    <div className="ad-actions">
                      <SmallButton kind="danger" onClick={() => deleteUser(r.id)}>Delete Account</SmallButton>
                    </div>
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
          <div className="ad-doclist">
            {docList.map((d, idx) => {
              const ext = (d.file_name || d.url || "").split(".").pop()?.toLowerCase() || "";
              const isImage = ["png","jpg","jpeg","gif","webp"].includes(ext);
              return (
                <div key={idx} className="ad-docrow">
                  <div className="ad-docrow__meta">
                    <div className="ad-strong ad-ellipsis">{d.file_name}</div>
                    <div className="ad-muted ad-ellipsis">{d.url}</div>
                  </div>
                  <div className="ad-docrow__actions">
                    <button className="ad-btn ad-btn--ghost" onClick={() => openInNewTab(d.url)}>
                      {isImage ? "Open Image" : "Open Document"}
                    </button>
                    <a className="ad-btn ad-btn--outline" href={d.url} target="_blank" rel="noopener noreferrer">Download</a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      {/* Approve (verify) Modal */}
      <ApproveModal
        open={approveOpen}
        row={approveRow}
        onClose={() => setApproveOpen(false)}
        onApproved={onApproved}
      />

      <Footer />
    </div>
  );
}
