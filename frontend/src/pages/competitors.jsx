import React, { useEffect, useMemo, useRef, useState } from "react";
import "../styles/competitors.css";
import Header from "../components/Header.jsx";
import Footer from "../components/footer.jsx";
import { API_BASE } from "../lib/api";
import useServerBookmarks from "../hooks/useServerBookmarks";

const PAGE_SIZE = 15;
const API = `${API_BASE || ""}/api`;

/* ---- small helpers ---- */
const useDebounced = (v, ms = 350) => {
  const [val, setVal] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setVal(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return val;
};

const normalize = (json, currentPage, pageSize) => {
  if (json && Array.isArray(json.results)) {
    const total = Number(json.count || 0);
    return { items: json.results, total, nextPage: json.next ? currentPage + 1 : currentPage, hasMore: !!json.next };
  }
  if (json && Array.isArray(json.items)) {
    const total = Number(json.total || 0);
    const page = Number(json.page || currentPage);
    const pageCount = Number(json.pageCount || Math.ceil(total / pageSize));
    return { items: json.items, total, nextPage: page < pageCount ? page + 1 : page, hasMore: page < pageCount };
  }
  if (Array.isArray(json)) {
    const total = json.length;
    const start = (currentPage - 1) * pageSize;
    const items = json.slice(start, start + pageSize);
    return { items, total, nextPage: start + pageSize < total ? currentPage + 1 : currentPage, hasMore: start + pageSize < total };
  }
  return { items: [], total: 0, nextPage: currentPage, hasMore: false };
};

async function getJSON(url) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/* ---- UI bits ---- */
function StrengthBadge({ strength }) {
  const s = String(strength || "").toLowerCase();
  const cls = s === "high" ? "cmp-strength--high" : s === "medium" ? "cmp-strength--med" : "cmp-strength--low";
  const label = s ? s[0].toUpperCase() + s.slice(1) : "Low";
  return <span className={`cmp-strength ${cls}`}>{label}</span>;
}

function Card({ item, bookmarked, onBookmark }) {
  const site =
    item.website && /^https?:\/\//i.test(item.website) ? item.website : item.website ? `https://${item.website}` : null;
  return (
    <article className="cmp-card" role="listitem">
      <div className="cmp-card__top">
        <span className="cmp-pill">{item?.category?.name || "Uncategorized"}</span>
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
    </article>
  );
}

/* ---- Page ---- */
export default function CompetitorsPage() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("idle");
  const [errMsg, setErrMsg] = useState("");
  const [q, setQ] = useState("");
  const dq = useDebounced(q, 350);

  // server-backed bookmarks
  const { isBookmarked, toggle } = useServerBookmarks("competitor");

  async function fetchPage(nextPage, replace = false) {
    if (replace) setStatus("loading");
    setErrMsg("");

    const usp = new URLSearchParams();
    if (dq.trim()) {
      usp.set("q", dq.trim());
      usp.set("search", dq.trim()); // support either
    }
    usp.set("page", String(nextPage));
    usp.set("limit", String(PAGE_SIZE));
    usp.set("page_size", String(PAGE_SIZE));

    const json = await getJSON(`${API}/competitors/?${usp.toString()}`);
    const norm = normalize(json, nextPage, PAGE_SIZE);

    setTotal(norm.total);
    setHasMore(norm.hasMore);
    setPage(norm.nextPage);
    setRows((prev) => (replace ? norm.items : [...prev, ...norm.items]));
    setStatus("ready");
  }

  // initial + on search change
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
    return () => {
      cancel = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dq]);

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
  }, [page, hasMore, status]); // eslint-disable-line

  const headerSubtitle = useMemo(
    () => (dq ? "Search results" : "Browse competitors. Scroll to load more."),
    [dq]
  );

  return (
    <div className="cmp-app">
      <Header />
      <main id="main" className="cmp-main" role="main">
        <section className="cmp-panel" aria-label="Competitors">
          <div className="cmp-head">
            <div className="cmp-titles">
              <h2 className="cmp-title">Competitors</h2>
              <p className="cmp-subtitle">{headerSubtitle}</p>
            </div>

            <div className="cmp-searchbar">
              <div className="cmp-searchbar__icon" aria-hidden>
                <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L20 21.5 21.5 20l-6-6z"/></svg>
              </div>
              <input
                className="cmp-searchbar__input"
                type="search"
                placeholder="Enter Name Or Category"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {dq && (
                <button className="cmp-searchbar__clear" onClick={() => setQ("")} aria-label="Clear search" type="button">
                  <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round"/></svg>
                </button>
              )}
              <a className="cmp-bookmarks-link" href="/userdashboard#bookmarks">★ Bookmarks</a>
            </div>
          </div>

          {status === "error" && rows.length === 0 && <div className="state error">Error: {errMsg}</div>}

          <div className="cmp-grid" role="list">
            {rows.map((it) => (
              <Card
                key={it.id}
                item={it}
                bookmarked={isBookmarked(it.id)}
                onBookmark={() => toggle(it.id).catch(() => {})}
              />
            ))}
          </div>

          <div ref={loaderRef} style={{ height: 1 }} />
          <div className="state">
            {status === "loading" && <span>Loading…</span>}
            {!hasMore && rows.length > 0 && <span className="muted">Showing {rows.length}{total ? ` of ${total}` : ""}</span>}
            {!rows.length && status === "ready" && <span>No competitors found.</span>}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
