import React, { useEffect, useMemo, useRef, useState } from "react";
import "../styles/competitors.css";
import Header from "../components/Header.jsx";
import Footer from "../components/footer.jsx";

// Safe env detection (Vite or CRA)
const API_BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE) ||
  (typeof process !== "undefined" &&
    process.env &&
    process.env.REACT_APP_API_BASE) ||
  "http://127.0.0.1:8000/api";

const MAX_DEFAULT = 100; // default: show up to 100 high-strength
const LS_KEY = "ideaforge_bookmarks_competitors";

/* -----------------------------------------------------------
   Helpers
----------------------------------------------------------- */
function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function toTitleCase(s = "") {
  return String(s)
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

function isAbortError(e) {
  return e?.name === "AbortError" || String(e?.message || "").toLowerCase().includes("abort");
}

async function fetchJSON(url, signal) {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/* -----------------------------------------------------------
   Strength badge (red high, amber medium, green low)
----------------------------------------------------------- */
function StrengthBadge({ strength }) {
  const s = String(strength || "").toLowerCase();
  const cfg = {
    high: {
      cls: "cmp-strength--high",
      label: "High",
      icon: (
        <svg viewBox="0 0 24 24" className="cmp-strength__svg" aria-hidden>
          <path d="M13 3s3 3 3 6c0 2.5-2 4-4 4-2 0-3.5-1.5-3.5-3.2 0-1.9 1.1-3.2 1.1-3.2S7 6.5 7 11c0 4 3.2 7 5 7 3.2 0 5-3 5-6.2C17 7.9 13 3 13 3z"/>
        </svg>
      ),
    },
    medium: {
      cls: "cmp-strength--med",
      label: "Medium",
      icon: (
        <svg viewBox="0 0 24 24" className="cmp-strength__svg" aria-hidden>
          <path d="M12 2l4 8h-3v10h-2V10H8l4-8z"/>
        </svg>
      ),
    },
    low: {
      cls: "cmp-strength--low",
      label: "Low",
      icon: (
        <svg viewBox="0 0 24 24" className="cmp-strength__svg" aria-hidden>
          <path d="M12 21c-3.9 0-7-3.1-7-7 0-2.7 1.5-5.1 3.8-6.2-.4 1.1-.6 2.3-.3 3.5C9 13.6 10.9 15 13 15c1.8 0 3.4-.9 4.3-2.3.4.8.7 1.8.7 2.8 0 3.9-3.1 7-7 7z"/>
        </svg>
      ),
    },
  };
  const meta = cfg[s] || cfg.low;
  return (
    <span className={`cmp-strength ${meta.cls}`} title={`Strength: ${meta.label}`}>
      <span className="cmp-strength__icon">{meta.icon}</span>
      <span className="cmp-strength__label">{meta.label}</span>
    </span>
  );
}

/* -----------------------------------------------------------
   Bookmark toggle (localStorage-backed)
----------------------------------------------------------- */
function useBookmarks() {
  const [ids, setIds] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const arr = JSON.parse(raw || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  });

  const isBookmarked = (id) => ids.includes(id);

  const toggle = (item) => {
    setIds((prev) => {
      const has = prev.includes(item.id);
      const next = has ? prev.filter((x) => x !== item.id) : prev.concat(item.id);
      // persist ids
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      // persist minimal objects so userdashboard can render without refetch
      try {
        const objsKey = `${LS_KEY}_objs`;
        const raw = localStorage.getItem(objsKey);
        const map = raw ? JSON.parse(raw) : {};
        if (!has) {
          map[item.id] = {
            id: item.id,
            name: item.name,
            category: item?.category?.name || "",
            description: item.description || "",
            website: item.website || "",
            strength: item.strength || "",
          };
        } else {
          delete map[item.id];
        }
        localStorage.setItem(objsKey, JSON.stringify(map));
      } catch {}
      return next;
    });
  };

  return { ids, isBookmarked, toggle };
}

/* -----------------------------------------------------------
   Card
----------------------------------------------------------- */
function Card({ item, bookmarked, onBookmark }) {
  return (
    <article className="cmp-card" role="listitem">
      <div className="cmp-card__top">
        <span className="cmp-pill">{toTitleCase(item?.category?.name || "Uncategorized")}</span>
        <button
          className={`cmp-bookmark ${bookmarked ? "is-on" : ""}`}
          aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
          onClick={onBookmark}
          title={bookmarked ? "Bookmarked" : "Bookmark"}
        >
          <svg viewBox="0 0 24 24" aria-hidden className="cmp-bookmark__svg">
            <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
          </svg>
        </button>
      </div>

      <h3 className="cmp-card__title">{String(item.name || "").toUpperCase()}</h3>

      {item.description && <p className="cmp-card__desc">{item.description}</p>}

      <div className="cmp-card__meta">
        <StrengthBadge strength={item.strength} />
      </div>

      {item.website && (
        <a
          className="cmp-btn cmp-btn--primary"
          href={/^https?:\/\//.test(item.website) ? item.website : `https://${item.website}`}
          target="_blank"
          rel="noreferrer"
        >
          Visit website
        </a>
      )}
    </article>
  );
}

/* -----------------------------------------------------------
   Page
----------------------------------------------------------- */
export default function CompetitorsPage() {
  const [items, setItems] = useState([]);
  const [nextUrl, setNextUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const loaderRef = useRef(null);

  const [q, setQ] = useState("");
  const dq = useDebounced(q, 350);

  const { isBookmarked, toggle } = useBookmarks();

  // Build list URL based on mode (default high vs search)
  const listUrl = useMemo(() => {
    if (dq.trim()) {
      const u = new URL(`${API_BASE}/competitors/`);
      u.searchParams.set("search", dq.trim());
      return u.toString();
    }
    // default “Top High” mode: start from a search=high page (then strict-filter)
    const u = new URL(`${API_BASE}/competitors/`);
    u.searchParams.set("search", "high");
    return u.toString();
  }, [dq]);

  // Load first page
  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setErr("");
    fetchJSON(listUrl, ctrl.signal)
      .then((data) => {
        const arr = Array.isArray(data) ? data : data.results ?? [];
        // strict high filter when not searching
        const cleaned = dq.trim()
          ? arr
          : arr.filter((x) => String(x.strength || "").toLowerCase() === "high");
        setItems(cleaned.slice(0, MAX_DEFAULT)); // first batch; we'll append via infinite scroll
        setNextUrl(data.next || null);
      })
      .catch((e) => {
        if (isAbortError(e)) return;
        setErr(String(e.message || e));
        setItems([]);
        setNextUrl(null);
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [listUrl, dq]);

  // Infinite scroll
  useEffect(() => {
    if (!loaderRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting) return;
        if (!nextUrl) return;
        if (!dq && items.length >= MAX_DEFAULT) return; // cap at 100 in default mode

        (async () => {
          setLoading(true);
          try {
            const data = await fetchJSON(nextUrl);
            const arr = Array.isArray(data) ? data : data.results ?? [];
            const more = dq
              ? arr
              : arr.filter((x) => String(x.strength || "").toLowerCase() === "high");
            setItems((prev) => {
              const merged = prev.concat(more);
              return dq ? merged : merged.slice(0, MAX_DEFAULT);
            });
            setNextUrl(data.next || null);
          } catch (e) {
            if (!isAbortError(e)) setErr(String(e.message || e));
          } finally {
            setLoading(false);
          }
        })();
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(loaderRef.current);
    return () => io.disconnect();
  }, [nextUrl, dq, items.length]);

  // Clear search -> revert to “Top 100 High”
  const clearSearch = () => setQ("");

  return (
    <div className="cmp-app">
      <Header />

      <main id="main" className="cmp-main" role="main">
        <section className="cmp-panel" aria-label="Competitors">
          <div className="cmp-head">
            <div className="cmp-titles">
              <h2 className="cmp-title">Competitors</h2>
              <p className="cmp-subtitle">
                {dq ? "Search results" : `View High Rated Competition`}
              </p>
            </div>

            <div className="cmp-searchbar">
              <div className="cmp-searchbar__icon" aria-hidden>
                {/* search icon */}
                <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L20 21.5 21.5 20l-6-6zM4 9.5C4 6.46 6.46 4 9.5 4S15 6.46 15 9.5 12.54 15 9.5 15 4 12.54 4 9.5z"/></svg>
              </div>
              <input
                className="cmp-searchbar__input"
                type="search"
                placeholder="Enter Name Or Category"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {dq && (
                <button className="cmp-searchbar__clear" onClick={clearSearch} aria-label="Clear search">
                  {/* cross icon */}
                  <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round"/></svg>
                </button>
              )}

              <a className="cmp-bookmarks-link" href="/userdashboard#bookmarks">
                ★ Bookmarks
              </a>
            </div>
          </div>

          {err && <div className="state error">Error: {err}</div>}

          <div className="cmp-grid" role="list">
            {items.map((it) => (
              <Card
                key={it.id}
                item={it}
                bookmarked={isBookmarked(it.id)}
                onBookmark={() => toggle(it)}
              />
            ))}
          </div>

          {/* sentinel for infinite scroll */}
          <div ref={loaderRef} style={{ height: 1 }} />
          {loading && <div className="state">Loading…</div>}
          {!loading && !items.length && <div className="state">No competitors found.</div>}
        </section>
      </main>

      <Footer />
    </div>
  );
}
