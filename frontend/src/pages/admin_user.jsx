import React, { useMemo, useState } from "react";
import Header from "../components/Header.jsx";
import Footer from "../components/footer.jsx";
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
  /* ---- Sample data (add your real API later) ---- */
  const [pending, setPending] = useState([
    {
      id: 1, name: "Akil Sabry", email: "akilsabry69@gmail.com",
      date: "August 22, 2025", status: "pending",
      docName: "Bank Slip (PDF)", docUrl: "/docs/akil-slip.pdf"
    },
    {
      id: 2, name: "Bill Gates", email: "billgates@gmail.com",
      date: "August 26, 2025", status: "pending",
      docName: "Company Ownership (Image)", docUrl: "/docs/bill-ownership.png"
    },
    {
      id: 3, name: "Elon Musk", email: "elonmusk@gmail.com",
      date: "August 29, 2025", status: "pending",
      docName: "Proof of Funds (PDF)", docUrl: "/docs/elon-proof.pdf"
    },
  ]);
  const [users, setUsers] = useState([
    { id: 11, name: "Harsudhan Tamilan", email: "harsudhan@ideaforge.com", created: "August 22, 2025", status: "active" },
    { id: 12, name: "Zeidh Kandian", email: "zeidh@ideaforge.com", created: "August 26, 2025", status: "active" },
    { id: 13, name: "Ashwin John", email: "ashwinjohn@ideaforge.com", created: "August 29, 2025", status: "active" },
  ]);

  /* ---- Search ---- */
  const [qPending, setQPending] = useState("");
  const [qUsers, setQUsers] = useState("");

  const filteredPending = useMemo(() => {
    const q = qPending.trim().toLowerCase();
    if (!q) return pending;
    return pending.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.date.toLowerCase().includes(q)
    );
  }, [pending, qPending]);

  const filteredUsers = useMemo(() => {
    const q = qUsers.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.created.toLowerCase().includes(q)
    );
  }, [users, qUsers]);

  /* ---- Actions ---- */
  const setInvestorStatus = (id, status) =>
    setPending((rows) => rows.map((r) => (r.id === id ? { ...r, status } : r)));

  const deleteUser = (id) => {
    const ok = window.confirm("Are you sure you want to delete this account? This action cannot be undone.");
    if (!ok) return;
    setUsers((rows) => rows.filter((r) => r.id !== id));
  };

  /* ---- Doc viewer modal ---- */
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
                <input
                  value={qPending}
                  onChange={(e) => setQPending(e.target.value)}
                  placeholder="Search"
                  aria-label="Search pending investors"
                />
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
                    <Badge kind="pending">Pending</Badge>
                  </div>
                  <div className="ad-td ad-td--actions" role="cell">
                    <SmallButton kind="ghost" onClick={() => openDoc(r)}>View Attached Doc</SmallButton>
                    <SmallButton kind="outline" onClick={() => setInvestorStatus(r.id, "rejected")}>Reject</SmallButton>
                    <SmallButton kind="primary" onClick={() => setInvestorStatus(r.id, "approved")}>Approve</SmallButton>
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
                  placeholder="Search"
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

              {filteredUsers.map((r) => (
                <div className="ad-tr" role="row" key={r.id}>
                  <div className="ad-td" role="cell">{r.name}</div>
                  <div className="ad-td" role="cell">{r.email}</div>
                  <div className="ad-td" role="cell">{r.created}</div>
                  <div className="ad-td" role="cell">
                    <Badge kind="active">Active</Badge>
                  </div>
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
        {docUrl ? (
          /* If it's a PDF same-origin, iframe works; images will also display */
          <iframe title="Attached Document" src={docUrl} className="ad-doc-viewer" />
        ) : (
          <p>No document attached.</p>
        )}
      </Modal>

      <Footer />
    </div>
  );
}
