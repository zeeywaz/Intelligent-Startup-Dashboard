import React, { useEffect, useMemo, useRef, useState } from "react";
import "../styles/competitors.css";
import Header from "../components/Header.jsx";
import Footer from "../components/footer.jsx";
import { API_BASE } from "../lib/api";
import useServerBookmarks from "../hooks/useServerBookmarks";

const PAGE_SIZE = 15;
const API = `${API_BASE || ""}/api`;

/* ---------- small helpers ---------- */
const useDebounced = (v, ms = 350) => {
  const [val, setVal] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setVal(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return val;
};

async function getJSON(url) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

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

/** Normalize various API shapes to { items, total, hasMore, nextPage } */
const normalize = (json, currentPage, pageSize) => {
  if (json && Array.isArray(json.results)) {
    const total = Number(json.count || 0);
    const hasMore = Boolean(json.next);
    return { items: json.results, total, hasMore, nextPage: hasMore ? currentPage + 1 : currentPage };
  }
  if (json && Array.isArray(json.items)) {
    const total = Number(json.total || 0);
    if (json.page || json.pageCount) {
      const page = Number(json.page || currentPage);
      const pageCount = Number(json.pageCount || Math.ceil(total / pageSize));
      const hasMore = page < pageCount;
      return { items: json.items, total, hasMore, nextPage: hasMore ? page + 1 : currentPage };
    }
    if (json.limit != null || json.offset != null) {
      const hasMore = json.next_offset != null && json.next_offset < total;
      return { items: json.items, total, hasMore, nextPage: hasMore ? currentPage + 1 : currentPage };
    }
    const hasMore = currentPage * pageSize < total;
    return { items: json.items, total, hasMore, nextPage: hasMore ? currentPage + 1 : currentPage };
  }
  if (Array.isArray(json)) {
    const total = json.length;
    const start = (currentPage - 1) * pageSize;
    const items = json.slice(start, start + pageSize);
    const hasMore = start + pageSize < total;
    return { items, total, hasMore, nextPage: hasMore ? currentPage + 1 : currentPage };
  }
  return { items: [], total: 0, hasMore: false, nextPage: currentPage };
};

/* ------------------ Confirm modal (Promise-based) ------------------ */
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

/* ---------- UI bits ---------- */
function StrengthBadge({ strength }) {
  const s = String(strength || "").toLowerCase();
  const cls = s === "high" ? "cmp-strength--high" : s === "medium" ? "cmp-strength--med" : "cmp-strength--low";
  const label = s ? s[0].toUpperCase() + s.slice(1) : "Low";
  return <span className={`cmp-strength ${cls}`}>{label}</span>;
}

function CompetitorCard({ item, bookmarked, onBookmark, isSuper, onEdit, onDelete }) {
  const cat = item?.category?.name || item?.category_name || "Uncategorized";
  const site =
    item.website && /^https?:\/\//i.test(item.website) ? item.website : item.website ? `https://${item.website}` : null;
  const id = item?.competitor_id ?? item?.id ?? item?.pk;

  return (
    <article className="cmp-card" role="listitem">
      <div className="cmp-card__top">
        <span className="cmp-pill">{cat}</span>
        <button
          type="button"
          className={`cmp-bookmark ${bookmarked ? "is-on" : ""}`}
          aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onBookmark?.();
          }}
          title={bookmarked ? "Bookmarked" : "Bookmark"}
        >
          <svg viewBox="0 0 24 24" className="cmp-bookmark__svg" aria-hidden>
            <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
          </svg>
        </button>
      </div>

      <h3 className="cmp-card__title">{String(item.name || "")}</h3>
      {item.description && <p className="cmp-card__desc">{item.description}</p>}

      <div className="cmp-card__meta">
        <StrengthBadge strength={item.strength} />
      </div>

      {site && (
        <a className="cmp-btn cmp-btn--primary" href={site} target="_blank" rel="noreferrer">
          Visit website
        </a>
      )}

      {isSuper && (
        <div className="adm-actions">
          <button className="adm-btn edit" onClick={() => onEdit(id)}>Edit</button>
          <button className="adm-btn delete" onClick={() => onDelete(id)}>Delete</button>
        </div>
      )}
    </article>
  );
}

function IdeaCard({ idea, bookmarked, onBookmark, isSuper, onEdit, onDelete }) {
  const displayName =
    (idea?.user?.first_name || idea?.user?.last_name)
      ? `${idea.user.first_name || ""} ${idea.user.last_name || ""}`.trim()
      : idea?.user?.username
      ? `@${idea.user.username}`
      : "Unknown";
  const cat = idea?.category_name || "Uncategorised";
  const id = idea?.idea_id ?? idea?.id ?? idea?.pk;

  return (
    <article className="cmp-card" role="listitem">
      <div className="cmp-card__top">
        <span className="cmp-pill">{cat}</span>
        <button
          type="button"
          className={`cmp-bookmark ${bookmarked ? "is-on" : ""}`}
          aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onBookmark?.();
          }}
          title={bookmarked ? "Bookmarked" : "Bookmark"}
        >
          <svg viewBox="0 0 24 24" className="cmp-bookmark__svg" aria-hidden>
            <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
          </svg>
        </button>
      </div>

      <h3 className="cmp-card__title">{idea?.title || "(Untitled idea)"}</h3>
      {idea?.user && <p className="cmp-card__desc">by {displayName}</p>}
      {idea?.description && <p className="cmp-card__desc">{idea.description}</p>}

      {isSuper && (
        <div className="adm-actions">
          <button className="adm-btn edit" onClick={() => onEdit(id)}>Edit</button>
          <button className="adm-btn delete" onClick={() => onDelete(id)}>Delete</button>
        </div>
      )}
    </article>
  );
}

/* ---------- Edit modal (Competitor) ---------- */
function EditCompetitorModal({ open, initial, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    name: "",
    strength: "low",
    website: "",
    description: "",
    category_id: "",
  }));
  const [cats, setCats] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm({
      name: initial?.name || "",
      strength: (initial?.strength || "low").toString().toLowerCase(),
      website: initial?.website || "",
      description: initial?.description || "",
      category_id: initial?.category?.id ?? initial?.category_id ?? "",
    });
    (async () => {
      try {
        const j = await getJSON(`${API}/categories/`);
        setCats(Array.isArray(j) ? j : (j?.results || []));
      } catch {
        setCats([]);
      }
    })();
  }, [open, initial]);

  const update = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));
  const close = () => !busy && onClose?.();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const payload = {
        name: form.name?.trim(),
        strength: form.strength?.trim(),
        website: form.website?.trim(),
        description: form.description ?? "",
        category_id: form.category_id || null,
      };
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
    <div className="adm-modal" role="dialog" aria-modal="true" aria-label="Edit competitor">
      <div className="adm-dialog">
        <header className="adm-dialog__header">
          <h3>Edit competitor</h3>
          <button className="adm-icon-btn" onClick={close} aria-label="Close">×</button>
        </header>

        <form className="adm-form" onSubmit={submit}>
          <div className="adm-grid">
            <label className="adm-field">
              <span>Name</span>
              <input value={form.name} onChange={update("name")} required />
            </label>

            <label className="adm-field">
              <span>Strength</span>
              <select value={form.strength} onChange={update("strength")}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>

            <label className="adm-field">
              <span>Website</span>
              <input value={form.website} onChange={update("website")} placeholder="https://example.com" />
            </label>

            <label className="adm-field adm-field--full">
              <span>Description</span>
              <textarea value={form.description} onChange={update("description")} rows={3} />
            </label>

            <label className="adm-field">
              <span>Category</span>
              <select value={form.category_id || ""} onChange={update("category_id")}>
                <option value="">— Select —</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
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

/* ---------- Edit modal (Business Idea) ---------- */
function EditIdeaModal({ open, initial, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    title: "",
    description: "",
    target_audience: "",
    location: "",
    business_type: "",
    category_id: "", // optional (only change if admin picks one)
  }));
  const [cats, setCats] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // load categories for the category dropdown
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const j = await getJSON(`${API}/categories/`);
        const arr = Array.isArray(j) ? j : (j?.results || []);
        setCats(arr);
      } catch {
        setCats([]);
      }
    })();
  }, [open]);

  // prefill from current row
  useEffect(() => {
    if (!open) return;
    setForm((s) => ({
      ...s,
      title: initial?.title || "",
      description: initial?.description || "",
      target_audience: initial?.target_audience || "",
      location: initial?.location || "",
      business_type: initial?.business_type || "",
      // category_id will remain "" unless admin selects; that avoids changing it by accident
      category_id: "",
    }));
  }, [open, initial]);

  const update = (k) => (e) => setForm((cur) => ({ ...cur, [k]: e.target.value }));
  const close = () => !busy && onClose?.();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      // send only fields that have values (avoid overwriting with "")
      const payload = {};
      for (const [k, v] of Object.entries(form)) {
        if (k === "category_id") {
          if (String(v || "").trim()) payload.category_id = Number(v);
        } else if (String(v ?? "").trim() !== "") {
          payload[k] = v;
        }
      }
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
    <div className="adm-modal" role="dialog" aria-modal="true" aria-label="Edit idea">
      <div className="adm-dialog">
        <header className="adm-dialog__header">
          <h3>Edit business idea</h3>
          <button className="adm-icon-btn" onClick={close} aria-label="Close">×</button>
        </header>

        <form className="adm-form" onSubmit={submit}>
          <div className="adm-grid">
            <label className="adm-field">
              <span>Title</span>
              <input value={form.title} onChange={update("title")} required />
            </label>

            <label className="adm-field">
              <span>Location</span>
              <input value={form.location} onChange={update("location")} placeholder="Colombo, Kandy, …" />
            </label>

            <label className="adm-field">
              <span>Business type</span>
              <input value={form.business_type} onChange={update("business_type")} placeholder="Retail, SaaS, Food…" />
            </label>

            <label className="adm-field">
              <span>Target audience</span>
              <input value={form.target_audience} onChange={update("target_audience")} placeholder="Students, SMEs, etc." />
            </label>

            <label className="adm-field adm-field--full">
              <span>Description</span>
              <textarea rows={4} value={form.description} onChange={update("description")} />
            </label>

            <label className="adm-field">
              <span>Category</span>
              <select value={form.category_id || ""} onChange={update("category_id")}>
                <option value="">— Keep current —</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
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

/* ---------- Page ---------- */
export default function CompetitorsPage() {
  // "ideas" = auth_user + business_idea cards; "companies" = competitors table
  const [mode, setMode] = useState("ideas"); // "ideas" | "companies"

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("idle");
  const [errMsg, setErrMsg] = useState("");
  const [q, setQ] = useState("");
  const dq = useDebounced(q, 350);
  const [onlyBookmarks, setOnlyBookmarks] = useState(false);

  // admin flag
  const [isSuper, setIsSuper] = useState(false);

  // edit modal state (companies)
  const [editId, setEditId] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  // edit modal state (ideas)
  const [editIdeaId, setEditIdeaId] = useState(null);
  const [editIdeaRow, setEditIdeaRow] = useState(null);
  const [editIdeaOpen, setEditIdeaOpen] = useState(false);

  // Server bookmarks, per kind
  const ideaBms = useServerBookmarks("idea");
  const cmpBms  = useServerBookmarks("competitor");

  const isBookmarked = useMemo(
    () => (id) => (mode === "ideas" ? ideaBms.isBookmarked(id) : cmpBms.isBookmarked(id)),
    [mode, ideaBms.isBookmarked, cmpBms.isBookmarked]
  );
  const toggleBookmark = useMemo(
    () => (id) => (mode === "ideas" ? ideaBms.toggle(id) : cmpBms.toggle(id)),
    [mode, ideaBms.toggle, cmpBms.toggle]
  );
  const bookmarkCount = mode === "ideas" ? (ideaBms.ids?.size || 0) : (cmpBms.ids?.size || 0);

  function getRowId(row) {
    if (mode === "ideas") return row?.idea_id ?? row?.id ?? row?.pk;
    return row?.competitor_id ?? row?.id ?? row?.pk;
  }

  const catNameOf = (row) => {
    if (mode === "ideas") return String(row?.category_name || "").trim();
    return String(row?.category?.name || row?.category_name || "").trim();
  };
  const isUncategorized = (name) => {
    const s = (name || "").trim().toLowerCase();
    return !s || s === "uncategorized" || s === "uncategorised";
  };

  async function fetchPage(nextPage, replace = false) {
    if (replace) setStatus("loading");
    setErrMsg("");

    const usp = new URLSearchParams();
    if (dq.trim()) {
      usp.set("q", dq.trim());
      usp.set("search", dq.trim());
    }
    usp.set("page", String(nextPage));
    usp.set("limit", String(PAGE_SIZE));
    usp.set("page_size", String(PAGE_SIZE));

    const endpoint = mode === "ideas" ? "competitor-ideas" : "competitors";
    const json = await getJSON(`${API}/${endpoint}/?${usp.toString()}`);
    const norm = normalize(json, nextPage, PAGE_SIZE);

    setTotal(norm.total);
    setHasMore(norm.hasMore);
    setPage(norm.nextPage);
    setRows((prev) => (replace ? norm.items : [...prev, ...norm.items]));
    setStatus("ready");
  }

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        if (cancel) return;
        setRows([]);
        setPage(1);
        setHasMore(true);
        await fetchPage(1, true);
      } catch (e) {
        if (cancel) return;
        setStatus("error");
        setErrMsg(e.message || "Failed to load");
      }
    })();
    return () => { cancel = true; };
    
  }, [dq, mode]);

  // fetch current user once to learn is_superuser
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/me/`, { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        if (!mounted) return;
        setIsSuper(Boolean(data?.user?.is_superuser || data?.is_superuser));
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  // infinite scroll
  const loaderRef = useRef(null);
  useEffect(() => {
    if (!loaderRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && status !== "loading") {
          fetchPage(page + 1).catch((e) => {
            setHasMore(false);
            setStatus("error");
            setErrMsg(e.message || "Failed to load more");
          });
        }
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(loaderRef.current);
    return () => io.disconnect();
  }, [page, hasMore, status]); 

  // bookmarks filter + push uncategorized to bottom 
  const filteredRows = useMemo(() => {
    const base = onlyBookmarks ? rows.filter((r) => isBookmarked(getRowId(r))) : rows;

    const decorated = base.map((r, i) => ({
      r,
      i,
      uncat: isUncategorized(catNameOf(r)),
    }));

    decorated.sort((a, b) => (a.uncat - b.uncat) || (a.i - b.i));

    return decorated.map((x) => x.r);
  }, [rows, onlyBookmarks, isBookmarked, mode]); 

  const headerSubtitle = useMemo(
    () => (dq ? "Search results" : mode === "ideas"
      ? "Browse founders and their startup ideas. Scroll to load more."
      : "Browse competing companies. Scroll to load more."),
    [dq, mode]
  );

  // Confirm modal state
  const [confirmState, setConfirmState] = useState(null);
  const showConfirm = (message) =>
    new Promise((resolve) => setConfirmState({ message, resolve }));
  const handleConfirmClose = (result) => {
    if (confirmState && typeof confirmState.resolve === "function") {
      confirmState.resolve(Boolean(result));
    }
    setConfirmState(null);
  };

  // ---------------- admin handlers: competitors ----------------
  async function handleDeleteCompetitor(id) {
    const ok = await showConfirm("Delete this competitor permanently?");
    if (!ok) return;
    try {
      const res = await fetch(`${API}/competitors/${id}/`, {
        method: "DELETE",
        credentials: "include",
        headers: { "X-CSRFToken": getCookie("csrftoken") },
      });
      if (!(res.ok || res.status === 204)) {
        const j = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(j.detail || `Failed (${res.status})`);
      }
      setRows((prev) => prev.filter((r) => {
        const rid = r?.competitor_id ?? r?.id ?? r?.pk;
        return rid !== id;
      }));
    } catch (err) {
      alert("Delete failed: " + (err.message || "unknown"));
    }
  }

  async function handleOpenEditCompetitor(id) {
    const row = rows.find((r) => (r?.competitor_id ?? r?.id ?? r?.pk) === id);
    setEditId(id);
    setEditRow(row || null);
    setEditOpen(true);
  }

  async function handleSaveEditCompetitor(payload) {
    const res = await fetch(`${API}/competitors/${editId}/`, {
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
    setRows((prev) =>
      prev.map((r) => {
        const rid = r?.competitor_id ?? r?.id ?? r?.pk;
        return rid === editId ? { ...r, ...updated } : r;
      })
    );
    setEditOpen(false);
    setEditId(null);
    setEditRow(null);
  }

  // ---------------- admin handlers: ideas ----------------
  async function handleDeleteIdea(id) {
    const ok = await showConfirm("Delete this business idea permanently?");
    if (!ok) return;
    try {
      const res = await fetch(`${API}/ideas/${id}/`, {
        method: "DELETE",
        credentials: "include",
        headers: { "X-CSRFToken": getCookie("csrftoken") },
      });
      if (!(res.ok || res.status === 204)) {
        const j = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(j.detail || `Failed (${res.status})`);
      }
      setRows((prev) => prev.filter((r) => (r?.idea_id ?? r?.id ?? r?.pk) !== id));
    } catch (err) {
      alert("Delete failed: " + (err.message || "unknown"));
    }
  }

  async function handleOpenEditIdea(id) {
    const row = rows.find((r) => (r?.idea_id ?? r?.id ?? r?.pk) === id);
    setEditIdeaId(id);
    setEditIdeaRow(row || null);
    setEditIdeaOpen(true);
  }

  async function handleSaveEditIdea(payload) {
    const res = await fetch(`${API}/ideas/${editIdeaId}/`, {
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

    setRows((prev) =>
      prev.map((r) => {
        const rid = r?.idea_id ?? r?.id ?? r?.pk;
        if (rid !== editIdeaId) return r;
        const next = { ...r };
        if (updated.title != null) next.title = updated.title;
        if (updated.description != null) next.description = updated.description;
        if (updated.category) next.category_name = updated.category; // admin serializer returns string field 'category'
        if (updated.location != null) next.location = updated.location;
        if (updated.business_type != null) next.business_type = updated.business_type;
        if (updated.target_audience != null) next.target_audience = updated.target_audience;
        return next;
      })
    );

    setEditIdeaOpen(false);
    setEditIdeaId(null);
    setEditIdeaRow(null);
  }

  return (
    <div className="cmp-app">
      <Header />

      <main id="main" className="cmp-main" role="main">
        <section className="cmp-panel" aria-label="Competitors">
          {/* Head */}
          <div className="cmp-head">
            <div className="cmp-titles">
              <h2 className="cmp-title">Competitors</h2>
              <p className="cmp-subtitle">{headerSubtitle}</p>
            </div>

            <div className="cmp-searchbar">
              <div className="cmp-searchbar__icon" aria-hidden>
                <svg viewBox="0 0 24 24">
                  <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L20 21.5 21.5 20l-6-6z"/>
                </svg>
              </div>
              <input
                className="cmp-searchbar__input"
                type="search"
                placeholder="Search by title, person, or company…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {dq && (
                <button
                  className="cmp-searchbar__clear"
                  onClick={() => setQ("")}
                  aria-label="Clear search"
                  type="button"
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
              <button
                type="button"
                className={`cmp-bookmarks-link ${onlyBookmarks ? "is-on" : ""}`}
                onClick={() => setOnlyBookmarks((v) => !v)}
                title="Show only bookmarked"
              >
                ★ Bookmarks {onlyBookmarks && `(${bookmarkCount})`}
              </button>
            </div>
          </div>

          <div className="cmp-mode-tabs" role="tablist" aria-label="Competitor modes">
            <button
              role="tab"
              aria-selected={mode === "ideas"}
              className={`cmp-tab ${mode === "ideas" ? "is-active" : ""}`}
              onClick={() => setMode("ideas")}
              type="button"
            >
              Ideas (people)
            </button>
            <button
              role="tab"
              aria-selected={mode === "companies"}
              className={`cmp-tab ${mode === "companies" ? "is-active" : ""}`}
              onClick={() => setMode("companies")}
              type="button"
            >
              Companies
            </button>
          </div>

          {status === "error" && filteredRows.length === 0 && (
            <div className="state error">Error: {errMsg}</div>
          )}

          <div className="cmp-grid" role="list">
            {filteredRows.map((row) => {
              const rid = getRowId(row);
              return mode === "ideas" ? (
                <IdeaCard
                  key={`idea-${rid}`}
                  idea={row}
                  bookmarked={isBookmarked(rid)}
                  onBookmark={() => toggleBookmark(rid).catch(() => {})}
                  isSuper={isSuper}
                  onEdit={handleOpenEditIdea}
                  onDelete={handleDeleteIdea}
                />
              ) : (
                <CompetitorCard
                  key={`cmp-${rid}`}
                  item={row}
                  bookmarked={isBookmarked(rid)}
                  onBookmark={() => toggleBookmark(rid).catch(() => {})}
                  isSuper={isSuper}
                  onEdit={handleOpenEditCompetitor}
                  onDelete={handleDeleteCompetitor}
                />
              );
            })}
          </div>

          <div ref={loaderRef} style={{ height: 1 }} />

          <div className="state">
            {status === "loading" && <span>Loading…</span>}
            {!hasMore && filteredRows.length > 0 && (
              <span className="muted">Showing {filteredRows.length}{total ? ` of ${total}` : ""}</span>
            )}
            {!filteredRows.length && status === "ready" && (
              <span>
                No {mode === "ideas" ? "ideas" : "companies"} found
                {onlyBookmarks ? " in your bookmarks." : "."}
              </span>
            )}
          </div>
        </section>
      </main>

      {/* Edit modals */}
      {isSuper && mode === "companies" && (
        <EditCompetitorModal
          open={editOpen}
          initial={editRow}
          onClose={() => { setEditOpen(false); setEditRow(null); setEditId(null); }}
          onSave={handleSaveEditCompetitor}
        />
      )}

      {isSuper && mode === "ideas" && (
        <EditIdeaModal
          open={editIdeaOpen}
          initial={editIdeaRow}
          onClose={() => { setEditIdeaOpen(false); setEditIdeaRow(null); setEditIdeaId(null); }}
          onSave={handleSaveEditIdea}
        />
      )}

      {/* Confirm modal */}
      <ConfirmModal state={confirmState} onClose={handleConfirmClose} />

      <Footer />
    </div>
  );
}
