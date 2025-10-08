import React, { useCallback, useEffect, useMemo, useState } from "react";
import Header from "../components/Header.jsx";
import Footer from "../components/footer.jsx";
import "../styles/investors.css";

/* ---------- helpers ---------- */
const API_BASE = "http://localhost:8000";
const has = (v) => v !== null && v !== undefined && String(v).trim() !== "";
const isVerified = (status) => String(status || "").toLowerCase() === "approved";

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    for (const c of document.cookie.split(";")) {
      const cookie = c.trim();
      if (cookie.startsWith(name + "=")) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

function normalizeBookmarks(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((b) => {
      const bookmark_id = b.bookmark_id ?? b.id ?? b.pk ?? null;
      let investor_id = null;
      if (b.investor_id != null) investor_id = b.investor_id;
      else if (b.investor != null) {
        if (typeof b.investor === "number") investor_id = b.investor;
        else investor_id = b.investor?.investor_id ?? b.investor?.id ?? b.investor?.pk ?? null;
      }
      const user_id = b.user_id ?? (typeof b.user === "number" ? b.user : null);
      const created_date = b.created_date ?? b.created_at ?? b.created ?? null;
      return { bookmark_id, investor_id, user_id, created_date };
    })
    .filter((x) => x.bookmark_id != null);
}

/* ---------- small UI bits ---------- */
function Avatar({ name }) {
  const letter = (name || "?").trim().charAt(0).toUpperCase() || "?";
  const bucket = (() => {
    const s = String(name || "?");
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h) % 5;
  })();
  return <div className={`cmp-avatar pfp-${bucket}`} aria-hidden>{letter}</div>;
}

function BookmarkBtn({ on, onClick, title }) {
  return (
    <button
      type="button"
      className={`cmp-bookmark ${on ? "is-on" : ""}`}
      aria-pressed={on}
      aria-label={on ? "Unbookmark" : "Bookmark"}
      title={title || (on ? "Unbookmark" : "Bookmark")}
      onClick={onClick}
    >
      <svg className="cmp-bookmark__svg" viewBox="0 0 24 24" aria-hidden>
        <path d="M6 2h12a1 1 0 0 1 1 1v19l-7-4-7 4V3a1 1 0 0 1 1-1z" />
      </svg>
    </button>
  );
}

/* ------------------ Confirm modal  ------------------ */
function ConfirmModal({ state, onClose }) {
  if (!state) return null;
  const { message } = state;
  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true" aria-label="Confirm dialog">
      <div className="confirm-box" role="document">
        <div className="confirm-message">{message}</div>
        <div className="confirm-actions" style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
          <button onClick={() => onClose(false)} className="confirm-btn cancel">Cancel</button>
          <button onClick={() => onClose(true)} className="confirm-btn confirm">Confirm</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Edit modal  ---------- */
function EditInvestorModal({ open, initial, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    investor_name: "",
    company_name: "",
    email_address: "",
    phone: "",
    credit_score: 0,
    verification_status: "pending",
  }));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm({
      investor_name: initial?.investor_name || "",
      company_name: initial?.company_name || "",
      email_address: initial?.email_address || "",
      phone: initial?.phone || "",
      credit_score: Number(initial?.credit_score ?? 0),
      verification_status: (initial?.verification_status || "pending").toString().toLowerCase(),
    });
  }, [open, initial]);

  const update = (k, parse = (v) => v) => (e) =>
    setForm((s) => ({ ...s, [k]: parse(e.target.value) }));

  const close = () => !busy && onClose?.();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const payload = { ...form };
      await onSave(payload);
    } catch (ex) {
      setErr(ex?.message || "Failed to save");
      setBusy(false);
      return;
    }
    setBusy(false);
  };

  if (!open) return null;
  return (
    <div className="adm-modal" role="dialog" aria-modal="true" aria-label="Edit investor">
      <div className="adm-dialog">
        <header className="adm-dialog__header">
          <h3>Edit investor</h3>
          <button className="adm-icon-btn" onClick={close} aria-label="Close">×</button>
        </header>

        <form className="adm-form" onSubmit={submit}>
          <div className="adm-grid">
            <label className="adm-field">
              <span>Investor name</span>
              <input value={form.investor_name} onChange={update("investor_name")} required />
            </label>
            <label className="adm-field">
              <span>Company name</span>
              <input value={form.company_name} onChange={update("company_name")} />
            </label>
            <label className="adm-field">
              <span>Email</span>
              <input type="email" value={form.email_address} onChange={update("email_address")} />
            </label>
            <label className="adm-field">
              <span>Phone</span>
              <input value={form.phone} onChange={update("phone")} />
            </label>
            <label className="adm-field">
              <span>Credit score</span>
              <input type="number" value={form.credit_score} onChange={update("credit_score", (v)=> Number(v))} />
            </label>
            <label className="adm-field">
              <span>Verification</span>
              <select value={form.verification_status} onChange={update("verification_status")}>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>
          </div>

          {err && <div className="adm-error">{err}</div>}

          <footer className="adm-dialog__footer">
            <button type="button" className="adm-btn ghost" onClick={close} disabled={busy}>Cancel</button>
            <button type="submit" className="adm-btn save" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
          </footer>
        </form>
      </div>
    </div>
  );
}

/* ---------- card ---------- */
function InvestorCard({ item, isBookmarked, onToggle, busy, isSuper, onEdit, onDelete }) {
  const name = item.investor_name || item.company_name || "Investor";
  const phone = item.phone;
  const email = item.email_address;
  const website = item.website;
  const rating = item.credit_score;
  const verified = isVerified(item.verification_status);
  const investorId = item.investor_id ?? item.id ?? null;

  const safeUrl = has(website)
    ? (String(website).startsWith("http") ? website : `https://${website}`)
    : null;

  return (
    <article className="cmp-card" role="article" aria-label={`Investor ${name}`}>
      <div className="cmp-card__top">
        <div style={{ display: "flex", alignItems: "center", gap: ".65rem" }}>
          <Avatar name={name} />
          <div>
            <div className="cmp-card__title">{name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
              <span className={`cmp-pill ${verified ? "" : "cmp-pill--muted"}`}>
                {verified ? "Verified" : "Unverified"}
              </span>
              {has(rating) && <span className="cmp-pill">Rating {rating}</span>}
            </div>
          </div>
        </div>

        <BookmarkBtn
          on={isBookmarked}
          onClick={() => onToggle(investorId)}
          title={busy ? "Working…" : undefined}
        />
      </div>

      <div className="cmp-card__desc">INVESTOR PROFILE</div>

      <div className="cmp-lines">
        {has(email) && (
          <p className="cmp-line">
            <strong>Email:</strong>{" "}
            <a href={`mailto:${email}`} className="cmp-link">{email}</a>
          </p>
        )}
        {has(phone) && (
          <p className="cmp-line">
            <strong>Phone:</strong>{" "}
            <a href={`tel:${String(phone).replace(/\s+/g, "")}`} className="cmp-link">{phone}</a>
          </p>
        )}
        {has(website) && (
          <p className="cmp-line">
            <strong>Website:</strong>{" "}
            <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="cmp-link">
              {String(website).replace(/^https?:\/\//, "")}
            </a>
          </p>
        )}
      </div>

      {safeUrl && (
        <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="cmp-btn--primary" style={{ marginTop: ".45rem" }}>
          Visit website
        </a>
      )}

      {isSuper && (
        <div className="adm-actions">
          <button className="adm-btn edit" onClick={() => onEdit(investorId)}>Edit</button>
          <button className="adm-btn delete" onClick={() => onDelete(investorId)}>Delete</button>
        </div>
      )}
    </article>
  );
}

/* ---------- page ---------- */
export default function InvestorsPage() {
  const [query, setQuery] = useState("");
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [ratingMin, setRatingMin] = useState(0);
  const [ratingMax, setRatingMax] = useState(1000);

  const [list, setList] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [processing, setProcessing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [isSuper, setIsSuper] = useState(false);

  const [editId, setEditId] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  const getBookmarkFor = (id) => bookmarks.find((b) => Number(b.investor_id) === Number(id));

  const fetchBookmarks = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/bookmarks/investors/`, { credentials: "include", cache: "no-store" });
      if (!res.ok) return [];
      const j = await res.json();
      return normalizeBookmarks(j);
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(`${API_BASE}/api/investors/`, { credentials: "include", cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to fetch investors (${res.status})`);
        const data = await res.json();
        if (!ok) return;
        setList(Array.isArray(data) ? data : []);
        setBookmarks(await fetchBookmarks());
      } catch (e) {
        if (!ok) return;
        setErr(e.message || "Failed to load");
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => { ok = false; };
  }, [fetchBookmarks]);

  // fetch me for superuser flag
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/me/`, { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        if (!mounted) return;
        setIsSuper(Boolean(data?.user?.is_superuser || data?.is_superuser));
      } catch (e) {}
    })();
    return () => { mounted = false; };
  }, []);

  const toggleBookmark = useCallback(
    async (investorId) => {
      if (processing.includes(investorId)) return;
      setProcessing((s) => [...s, investorId]);

      const existing = getBookmarkFor(investorId);
      try {
        if (existing) {
          const res = await fetch(`${API_BASE}/api/bookmarks/investors/${existing.bookmark_id}/delete/`, {
            method: "DELETE",
            headers: { "X-CSRFToken": getCookie("csrftoken") },
            credentials: "include",
          });
          if (!res.ok) throw new Error(`Delete failed (${res.status})`);
        } else {
          let res = await fetch(`${API_BASE}/api/bookmarks/investors/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken") },
            body: JSON.stringify({ investor_id: investorId }),
            credentials: "include",
          });
          if (res.status === 404) {
            res = await fetch(`${API_BASE}/api/bookmarks/investors/add/`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken") },
              body: JSON.stringify({ investor_id: investorId }),
              credentials: "include",
            });
          }
          if (!res.ok) throw new Error(`Create failed (${res.status})`);
          await res.json().catch(() => null);
        }
        setBookmarks(await fetchBookmarks());
      } catch (e) {
        setErr(e.message || "Bookmark action failed");
      } finally {
        setProcessing((s) => s.filter((x) => x !== investorId));
      }
    },
    [processing, fetchBookmarks]
  );

  // Confirm modal for investors
  const [confirmState, setConfirmState] = useState(null);
  const showConfirm = (message) =>
    new Promise((resolve) => setConfirmState({ message, resolve }));
  const handleConfirmClose = (result) => {
    if (confirmState && typeof confirmState.resolve === "function") {
      confirmState.resolve(Boolean(result));
    }
    setConfirmState(null);
  };

  // Admin actions for investors
  async function handleDeleteInvestor(id) {
    const ok = await showConfirm("Delete this investor permanently?");
    if (!ok) return;
    try {
      const res = await fetch(`${API_BASE}/api/investors/${id}/`, {
        method: "DELETE",
        credentials: "include",
        headers: { "X-CSRFToken": getCookie("csrftoken") },
      });
      if (!(res.ok || res.status === 204)) {
        const j = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(j.detail || `Failed (${res.status})`);
      }
      setList((prev) => prev.filter((it) => (it.investor_id ?? it.id ?? it.pk) !== id));
    } catch (err) {
      alert("Delete failed: " + (err.message || "unknown"));
    }
  }

  async function handleOpenEdit(id) {
    const row = list.find((it) => (it.investor_id ?? it.id ?? it.pk) === id);
    setEditId(id);
    setEditRow(row || null);
    setEditOpen(true);
  }

  async function handleSaveEdit(payload) {
    const res = await fetch(`${API_BASE}/api/investors/${editId}/`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(j.detail || `Failed (${res.status})`);
    }
    const updated = await res.json();
    setList((prev) =>
      prev.map((it) => ((it.investor_id ?? it.id ?? it.pk) === editId ? { ...it, ...updated } : it))
    );
    setEditOpen(false);
    setEditId(null);
    setEditRow(null);
  }

  const filtered = useMemo(() => {
    let rows = list.slice();
    const q = query.trim().toLowerCase();

    if (q) {
      rows = rows.filter((x) => {
        const hay = [
          x.investor_name,
          x.company_name,
          x.email_address,
          x.website,
          x.category_interest,
          Array.isArray(x.preferred_industries) ? x.preferred_industries.join(", ") : x.preferred_industries
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    rows = rows.filter((x) => {
      const r = Number(x.credit_score);
      if (Number.isNaN(r)) return false;
      return r >= ratingMin && r <= ratingMax;
    });

    if (bookmarkedOnly) {
      const setIds = new Set(bookmarks.map((b) => Number(b.investor_id)));
      rows = rows.filter((x) => setIds.has(Number(x.investor_id ?? x.id)));
    }
    return rows;
  }, [list, query, ratingMin, ratingMax, bookmarkedOnly, bookmarks]);

  /* ---- render ---- */
  return (
    <div className="inv-app">
      <Header />

      {/* Hero heading */}
      <section className="inv-hero">
        <h1 className="inv-hero__title">Sponsors / Investors</h1>
        <p className="inv-hero__subtitle">
          Browse, filter and bookmark preferred investors for your venture.
        </p>
      </section>

      <main className="inv-main" role="main">
        {/* Toolbar */}
        <section className="inv-toolbar" aria-label="Filters">
          {/* Search */}
          <div className="inv-field inv-field--search">
            <label className="inv-field__label" htmlFor="inv-q">Search</label>
            <div className="inv-search">
              <input
                id="inv-q"
                className="inv-search__input"
                type="search"
                placeholder="Name, company, email, website, interests…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <svg className="inv-search__icon" viewBox="0 0 24 24" aria-hidden>
                <path d="M10 2a8 8 0 106.32 13.906l4.387 4.387 1.414-1.414-4.387-4.387A8 8 0 0010 2zm0 2a6 6 0 110 12A6 6 0 0110 4z" />
              </svg>
            </div>
          </div>

          {/* Rating */}
          <div className="inv-field inv-field--rating">
            <label className="inv-field__label">Rating</label>
            <div className="inv-rating">
             
              <input
                type="range"
                min={0}
                max={1000}
                step={10}
                value={ratingMin}
                onChange={(e)=> setRatingMin(Number(e.target.value))}
                className="inv-range__thumb"
                aria-label="Min rating"
              />
              <input
                type="range"
                min={0}
                max={1000}
                step={10}
                value={ratingMax}
                onChange={(e)=> setRatingMax(Number(e.target.value))}
                className="inv-range__thumb"
                aria-label="Max rating"
              />
              <div className="inv-chips">
                <span className="inv-chip inv-chip--value">{ratingMin}</span>
                <span className="inv-chip inv-chip--sep">to</span>
                <span className="inv-chip inv-chip--value">{ratingMax}</span>
              </div>
            </div>
          </div>

          {/* Bookmarks toggle */}
          <div className="inv-field inv-field--toggle">
            <label className="inv-field__label">Bookmarks</label>
            <button
              type="button"
              className={`inv-toggle ${bookmarkedOnly ? "on" : ""}`}
              onClick={() => setBookmarkedOnly((v) => !v)}
              aria-pressed={bookmarkedOnly}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                <path d="M6 2h12a1 1 0 0 1 1 1v19l-7-4-7 4V3a1 1 0 0 1 1-1z" />
              </svg>
              {bookmarkedOnly ? "Show bookmarked" : "All"}
              {bookmarkedOnly && <span className="inv-badge">{bookmarks.length}</span>}
            </button>
          </div>

          {/* Reset */}
          <div className="inv-field inv-field--reset">
            <label className="inv-field__label sr-only">Reset filters</label>
            <button
              type="button"
              className="inv-reset"
              onClick={() => { setQuery(""); setRatingMin(0); setRatingMax(1000); setBookmarkedOnly(false); }}
              title="Reset filters"
            >
              Reset
            </button>
          </div>
        </section>

        {/* list */}
        {loading && <div className="inv-status">Loading investors…</div>}
        {err && <div className="inv-status inv-status--error">Error: {err}</div>}

        <div className="inv-grid">
          {filtered.map((it) => {
            const id = it.investor_id ?? it.id ?? Math.random();
            const bm = getBookmarkFor(id);
            const busy = processing.includes(id);
            return (
              <div className="inv-grid__item" key={`${id}-${it.email_address || ""}`} role="listitem">
                <InvestorCard
                  item={it}
                  isBookmarked={Boolean(bm)}
                  onToggle={toggleBookmark}
                  busy={busy}
                  isSuper={isSuper}
                  onEdit={handleOpenEdit}
                  onDelete={handleDeleteInvestor}
                />
              </div>
            );
          })}
          {!loading && filtered.length === 0 && (
            <div className="inv-empty">No investors match your filters.</div>
          )}
        </div>
      </main>

      {/* Edit modal */}
      {isSuper && (
        <EditInvestorModal
          open={editOpen}
          initial={editRow}
          onClose={() => { setEditOpen(false); setEditRow(null); setEditId(null); }}
          onSave={handleSaveEdit}
        />
      )}

      {/* Confirm modal */}
      <ConfirmModal state={confirmState} onClose={handleConfirmClose} />

      <Footer />
    </div>
  );
}
