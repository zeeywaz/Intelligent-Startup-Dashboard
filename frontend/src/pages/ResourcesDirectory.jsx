import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "../components/Header.jsx";
import Footer from "../components/footer.jsx";
import "../styles/resources-directory.css";
import { API_BASE } from "../lib/api";
import useServerBookmarks from "../hooks/useServerBookmarks";

/** how many to request at a time */
const PAGE_SIZE = 20;

/** API base that works in Vite/CRA */
const API_URL = `${API_BASE}/api/resources/`; // trailing slash to match DRF route

const TYPE_LABEL = {
  WAREHOUSE: "Warehouses",
  WHOLESALE: "Wholesalers",
  OFFICE: "Office Spaces",
  TRANSPORT: "Transport services",
  SECURITY: "Security services",
  SAAS: "SaaS",
};

const SLUG_TO_TYPE = {
  warehouses: "WAREHOUSE",
  wholesalers: "WHOLESALE",
  offices: "OFFICE",
  transport: "TRANSPORT",
  security: "SECURITY",
  saas: "SAAS",
  SAAS: "SAAS",
};

function getRequestedType() {
  const usp = new URLSearchParams(window.location.search);
  const t = usp.get("type");
  if (t) return String(t).toUpperCase();
  const seg = decodeURIComponent(
    window.location.pathname.split("/").filter(Boolean).pop() || ""
  );
  return SLUG_TO_TYPE[String(seg).toLowerCase()] || "WAREHOUSE";
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

/** Normalize API shapes to {items, total, hasMore, nextPage} */
function normalizeApiResult(json, currentPage, pageSize) {
  if (json && Array.isArray(json.results)) {
    const total = Number(json.count || 0);
    const hasMore = Boolean(json.next);
    return {
      items: json.results,
      total,
      hasMore,
      nextPage: hasMore ? currentPage + 1 : currentPage,
    };
  }
  if (json && Array.isArray(json.items)) {
    const total = Number(json.total || 0);
    const page = Number(json.page || currentPage);
    const pageCount = Number(json.pageCount || Math.ceil(total / pageSize));
    const hasMore = page < pageCount;
    return {
      items: json.items,
      total,
      hasMore,
      nextPage: hasMore ? page + 1 : currentPage,
    };
  }
  if (Array.isArray(json)) {
    const total = json.length;
    const start = (currentPage - 1) * pageSize;
    const items = json.slice(start, start + pageSize);
    const hasMore = start + pageSize < total;
    return {
      items,
      total,
      hasMore,
      nextPage: hasMore ? currentPage + 1 : currentPage,
    };
  }
  return { items: [], total: 0, hasMore: false, nextPage: currentPage };
}

function coordsToLatLon(geo_data) {
  if (!geo_data) return null;
  const m = /\(?\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)?/.exec(geo_data);
  if (!m) return null;
  const a = parseFloat(m[1]);
  const b = parseFloat(m[2]);
  const latLikely = Math.abs(a) <= 90 && Math.abs(b) > 90;
  const lat = latLikely ? a : b;
  const lon = latLikely ? b : a;
  if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon };
  return null;
}

/* ------------------ Confirm modal (Promise-based) ------------------ */
/* Local, accessible, and avoids window.confirm() */
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

/* ------------------ Page ------------------ */
export default function ResourcesDirectory() {
  const [type] = useState(getRequestedType);
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | error | ready
  const [errMsg, setErrMsg] = useState("");
  const [q, setQ] = useState("");
  const [onlyBookmarks, setOnlyBookmarks] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  // admin flag
  const [isSuper, setIsSuper] = useState(false);

  // Server bookmarks
  const { ids: bmIds, isBookmarked, toggle } = useServerBookmarks("resource");

  const sentinelRef = useRef(null);
  const ioRef = useRef(null);

  // Confirm modal state
  const [confirmState, setConfirmState] = useState(null);
  // showConfirm returns a Promise that resolves to true/false
  const showConfirm = (message) =>
    new Promise((resolve) => setConfirmState({ message, resolve }));

  // close handler called by modal buttons
  const handleConfirmClose = (result) => {
    if (confirmState && typeof confirmState.resolve === "function") {
      confirmState.resolve(Boolean(result));
    }
    setConfirmState(null);
  };

  // fetch current user info once to know superuser status
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
        // ignore: not authenticated or network error
      }
    })();
    return () => { mounted = false; };
  }, []);

  async function fetchPage(nextPage, replace = false) {
    if (replace) setStatus("loading");
    setErrMsg("");

    const usp = new URLSearchParams();
    usp.set("type", type);
    if (q.trim()) usp.set("search", q.trim());
    usp.set("page", String(nextPage));
    usp.set("page_size", String(PAGE_SIZE));

    const res = await fetch(`${API_URL}?${usp.toString()}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    const norm = normalizeApiResult(json, nextPage, PAGE_SIZE);
    setTotal(norm.total);
    setHasMore(norm.hasMore);
    setPage(norm.nextPage);
    setRows((prev) => (replace ? norm.items : [...prev, ...norm.items]));
    setStatus("ready");
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (cancelled) return;
        setRows([]);
        setPage(1);
        setHasMore(true);
        await fetchPage(1, true);
      } catch (e) {
        if (cancelled) return;
        setRows([]);
        setHasMore(false);
        setStatus("error");
        setErrMsg(e.message || "Failed to load");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, q]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    if (ioRef.current) ioRef.current.disconnect();
    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && status !== "loading") {
          fetchPage(page + 1).catch((e) => {
            setHasMore(false);
            setErrMsg(e.message || "Failed to load more");
            setStatus("error");
          });
        }
      },
      { rootMargin: "600px 0px 600px 0px" }
    );
    io.observe(sentinelRef.current);
    ioRef.current = io;
    return () => io.disconnect();
  }, [page, hasMore, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const prettyTitle = TYPE_LABEL[type] || type;

  const filtered = useMemo(() => {
    const base = onlyBookmarks
      ? rows.filter((r) =>
          isBookmarked(r?.resource_id ?? r?.id ?? r?.pk)
        )
      : rows;
    return base;
  }, [rows, onlyBookmarks, isBookmarked]);

  // --- Admin actions (PATCH/DELETE) ---
  async function handleDeleteResource(id) {
    const ok = await showConfirm("Delete this resource permanently?");
    if (!ok) return;
    try {
      const res = await fetch(`${API_URL}${id}/`, {
        method: "DELETE",
        credentials: "include",
        headers: { "X-CSRFToken": getCookie("csrftoken") },
      });
      if (!(res.ok || res.status === 204)) {
        const j = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(j.detail || `Failed (${res.status})`);
      }
      setRows((prev) => prev.filter((r) => (r.resource_id ?? r.id ?? r.pk) !== id));
    } catch (err) {
      alert("Delete failed: " + (err.message || "unknown"));
    }
  }

  async function handleEditResource(id) {
    const newName = window.prompt ? window.prompt("New resource name (leave empty to cancel):") : "";
    if (newName == null || String(newName).trim() === "") return;
    try {
      const res = await fetch(`${API_URL}${id}/`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({ name: newName }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(j.detail || `Failed (${res.status})`);
      }
      const updated = await res.json();
      setRows((prev) => prev.map((r) => ((r.resource_id ?? r.id ?? r.pk) === id ? { ...r, ...updated } : r)));
    } catch (err) {
      alert("Edit failed: " + (err.message || "unknown"));
    }
  }

  return (
    <div className="resources-page">
      <Header />

      <header className="resources-header">
        <h1>{prettyTitle}</h1>
        <p className="muted">
          Browse vetted {prettyTitle.toLowerCase()}. Use the star to bookmark.
        </p>

        <div className="toolbar">
          <div className="input-wrap">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              aria-hidden="true"
              className="search-icon"
            >
              <path
                d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L20 21.49 21.49 20 15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
                fill="currentColor"
              />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, location, or description…"
              aria-label="Search resources"
            />
          </div>

          <button
            type="button"
            className={`chip ${onlyBookmarks ? "chip-on" : ""}`}
            onClick={() => setOnlyBookmarks((v) => !v)}
            title="Show only bookmarked"
          >
            ★ Bookmarks {onlyBookmarks && `(${bmIds.size})`}
          </button>
        </div>
      </header>

      {status === "loading" && rows.length === 0 ? (
        <div className="loading">
          Loading {prettyTitle.toLowerCase()}…
        </div>
      ) : status === "error" && rows.length === 0 ? (
        <div className="empty">
          <div className="empty-card">
            <span className="emoji">⚠️</span>
            <h3>Couldn’t load data</h3>
            <p className="muted">Error: {errMsg}</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-card">
            <span className="emoji">🗂️</span>
            <h3>No results</h3>
            <p>
              Try clearing search or turning off the bookmarks filter.
            </p>
          </div>
        </div>
      ) : (
        <>
          <section className="card-grid">
            {filtered.map((row) => {
              const rid = row?.resource_id ?? row?.id ?? row?.pk;
              const coords = coordsToLatLon(row.geo_data);
              const website =
                row.website && String(row.website).trim().length > 0
                  ? row.website
                  : null;

              return (
                <article className="r-card" key={rid}>
                  <button
                    type="button"
                    className={`bookmark ${
                      isBookmarked(rid) ? "on" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggle(rid);
                    }}
                    aria-label={
                      isBookmarked(rid)
                        ? "Remove bookmark"
                        : "Add bookmark"
                    }
                    title={
                      isBookmarked(rid)
                        ? "Remove bookmark"
                        : "Add bookmark"
                    }
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path
                        d="M6 2h12a1 1 0 011 1v18l-7-4-7 4V3a1 1 0 011-1z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>

                  <div className={`type-badge t-${row.type}`}>
                    {TYPE_LABEL[row.type] || row.type}
                  </div>

                  <h3 className="name">{row.name}</h3>
                  {row.location && (
                    <div className="meta">
                      <svg
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                      >
                        <path
                          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"
                          fill="currentColor"
                        />
                      </svg>
                      {row.location}
                    </div>
                  )}
                  {row.description && (
                    <p className="desc" title={row.description}>
                      {row.description}
                    </p>
                  )}

                  <div className="actions">
                    {website && (
                      <a
                        className="btn"
                        href={website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Visit website
                      </a>
                    )}
                    {coords && (
                      <a
                        className="btn secondary"
                        href={`https://www.google.com/maps?q=${coords.lat},${coords.lon}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open map
                      </a>
                    )}
                  </div>

                  {isSuper && (
                    <div className="admin-actions">
                      <button type="button" className="admin-btn edit" onClick={() => handleEditResource(rid)}>Edit</button>
                      <button type="button" className="admin-btn delete" onClick={() => handleDeleteResource(rid)}>Delete</button>
                    </div>
                  )}
                </article>
              );
            })}
          </section>

          {/* infinite-scroll sentinel */}
          <div ref={sentinelRef} style={{ height: 1 }} />

          <div className="loading" style={{ textAlign: "center" }}>
            {status === "error" && rows.length > 0 && (
              <div className="muted">Error: {errMsg}</div>
            )}
            {!hasMore ? (
              <div className="muted">
                Showing {rows.length} of {total}
              </div>
            ) : (
              <button
                className="chip"
                type="button"
                onClick={() => fetchPage(page + 1)}
                disabled={status === "loading"}
              >
                {status === "loading" ? "Loading…" : "Load more"}
              </button>
            )}
          </div>
        </>
      )}

      {/* Confirm modal (rendered at page level) */}
      <ConfirmModal state={confirmState} onClose={handleConfirmClose} />

      <Footer />
    </div>
  );
}

// Optional helper for external buttons
export const openResourcesTab = (type) => {
  window.open(
    `/resources/directory?type=${encodeURIComponent(type)}`,
    "_blank",
    "noopener"
  );
};
