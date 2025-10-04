import React, { useEffect, useMemo, useRef, useState } from "react";
import "../styles/InvestorInterest.css";
import Header from "../components/Header.jsx";
import Footer from "../components/footer.jsx";
import api, { API_BASE } from "../lib/api";

/* ---------------- Helpers ---------------- */
const cx = (...xs) => xs.filter(Boolean).join(" ");

function useDots(on) {
  const [dots, setDots] = useState("");
  useEffect(() => {
    if (!on) return setDots("");
    const t = setInterval(
      () => setDots((d) => (d.length >= 3 ? "" : d + ".")),
      300
    );
    return () => clearInterval(t);
  }, [on]);
  return dots;
}

/* ---------- Badge chip ---------- */
function Badge({ children }) {
  return <span className="ii-chip">{children}</span>;
}

/* ---------- Bookmark star ---------- */
function Bookmark({ active, onClick, label = "Bookmark" }) {
  return (
    <button
      type="button"
      className={cx("ii-star", active && "ii-star--active")}
      aria-pressed={!!active}
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <span aria-hidden className="ii-star__glyph">
        ★
      </span>
    </button>
  );
}

/* ---------- Card ---------- */
function Card({ onClick, children }) {
  return (
    <article
      className="ii-card"
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {children}
    </article>
  );
}

/* ---------- Strength pill for competitors ---------- */
function PriorityPill({ level }) {
  const lv = String(level || "").toLowerCase();
  if (!lv) return null;
  const cls =
    lv === "high"
      ? "ii-pill ii-pill--high"
      : lv === "medium"
      ? "ii-pill ii-pill--medium"
      : lv === "low"
      ? "ii-pill ii-pill--low"
      : "ii-pill";
  const label = lv.charAt(0).toUpperCase() + lv.slice(1);
  return <span className={cls}>{label}</span>;
}

/* ---------- Modal ---------- */
function Modal({ open, title, children, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="ii-modal"
      role="dialog"
      aria-modal="true"
      ref={ref}
      onMouseDown={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="ii-modal__panel" role="document">
        <header className="ii-modal__header">
          <h2 className="ii-modal__title">{title}</h2>
          <button className="ii-modal__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
        <div className="ii-modal__body">{children}</div>
        <footer className="ii-modal__footer">
          <button className="ii-btn ii-btn--ghost" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function InvestorInterest() {
  const [competitors, setCompetitors] = useState([]);
  const [competitorsMeta, setCompetitorsMeta] = useState({
    total: 0,
    next_offset: null,
    fallback: false,
  });
  const [competitorsBusy, setCompetitorsBusy] = useState(false);

  // Server bookmark id sets (only competitor kind required here)
  const [bmIds, setBmIds] = useState({
    competitor: new Set(),
  });

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [open, setOpen] = useState(false);
  const [focusItem, setFocusItem] = useState(null);

  const dots = useDots(loading);
  const isBookmarked = (id) => bmIds.competitor?.has(id);

  const refreshBookmarkIds = async () => {
    try {
      const data = await api.bookmarkIds("competitor");
      if (Array.isArray(data?.ids)) {
        setBmIds({ competitor: new Set(data.ids) });
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("bookmarkIds failed", e);
    }
  };

  const toggleBookmark = async (id) => {
    try {
      await api.toggleBookmark("competitor", id);
      await refreshBookmarkIds();
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(e?.message || "Failed to toggle bookmark.");
    }
  };

  // Fetch all competitors (no idea dependency) - paginated
  const fetchCompetitors = async (offset = null, limit = 12) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (offset != null) params.set("offset", String(offset));
    try {
      const res = await fetch(`${API_BASE}/api/competitors/?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("fetchCompetitors error", err);
      throw err;
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");
        await api.csrf().catch(() => {});

        // initial competitors page
        const data = await fetchCompetitors(null, 12);
        const items = Array.isArray(data) ? data : data.items || [];
        setCompetitors(items);
        setCompetitorsMeta({
          total: data.total || items.length,
          next_offset: data.next_offset ?? null,
          fallback: data.fallback ?? false,
        });

        // bookmark ids for competitors
        await refreshBookmarkIds();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        setErr("Failed to load competitors.");
      } finally {
        setLoading(false);
      }
    })();
  }, []); // run once

  const loadMoreCompetitors = async () => {
    if (competitorsBusy || competitorsMeta.next_offset == null) return;
    try {
      setCompetitorsBusy(true);
      const data = await fetchCompetitors(competitorsMeta.next_offset, 12);
      const items = Array.isArray(data) ? data : data.items || [];
      setCompetitors((prev) => [...prev, ...items]);
      setCompetitorsMeta({
        total: data.total || competitors.length + items.length,
        next_offset: data.next_offset ?? null,
        fallback: data.fallback ?? false,
      });
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(e?.message || "Failed to load more competitors.");
    } finally {
      setCompetitorsBusy(false);
    }
  };

  const show = (obj) => {
    setFocusItem(obj);
    setOpen(true);
  };
  const hide = () => {
    setOpen(false);
    setFocusItem(null);
  };

  // Build "Bookmarked" from currently loaded competitors
  const bookmarkedCards = useMemo(() => {
    return competitors
      .filter((c) => c?.id != null && isBookmarked(c.id))
      .map((c) => ({ key: `competitor-${c.id}`, kind: "competitor", obj: c }));
  }, [competitors, bmIds]);

  return (
    <>
      <Header />
      <div className="ii-app">
        <main className="ii-container">
          <section className="ii-pagehead">
            <h1 className="ii-pagehead__title">Investor Interests {loading ? dots : ""}</h1>
            <p className="ii-pagehead__subtitle">All competitors — plus your bookmarked ones</p>
          </section>

          {loading && <p className="ii-thinking">Loading{dots}</p>}
          {err && <p className="ii-err">{err}</p>}

          {!loading && !err && (
            <div className="ii-grid">
              {/* All Competitors */}
              <section className="ii-panel">
                <header className="ii-panel__header">
                  <h3 className="ii-panel__title">All Competitors</h3>
                </header>

                {competitors.length === 0 ? (
                  <p className="ii-muted">No competitors listed.</p>
                ) : (
                  <>
                    <div className="ii-cards">
                      {competitors.map((it) => (
                        <Card key={`competitor-${it.id}`} onClick={() => show(it)}>
                          <div className="ii-card__content">
                            <div className="ii-card__main">
                              <h4 className="ii-card__title">{it.name}</h4>
                              <p className="ii-card__sub">{it.description}</p>
                            </div>
                            <div className="ii-card__meta">
                              {it.website && (
                                <a
                                  href={it.website}
                                  className="ii-btn ii-btn--tiny"
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Website
                                </a>
                              )}
                              <PriorityPill level={it.strength} />
                              <Bookmark active={isBookmarked(it.id)} onClick={() => toggleBookmark(it.id)} />
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    <div className="ii-panel__footer">
                      {competitorsMeta.next_offset != null ? (
                        <button
                          className="ii-btn ii-btn--ghost"
                          onClick={loadMoreCompetitors}
                          disabled={competitorsBusy}
                        >
                          {competitorsBusy ? "Loading…" : "Load more"}
                        </button>
                      ) : (
                        <span className="ii-muted ii-small">End of list</span>
                      )}
                    </div>
                  </>
                )}
              </section>

              {/* Bookmarked Competitors */}
              <section className="ii-panel">
                <header className="ii-panel__header">
                  <h3 className="ii-panel__title">Bookmarked Competitors</h3>
                </header>

                {bookmarkedCards.length === 0 ? (
                  <p className="ii-muted">No bookmarked competitors yet. Tap ★ to save one.</p>
                ) : (
                  <div className="ii-cards">
                    {bookmarkedCards.map((bm) => {
                      const o = bm.obj;
                      return (
                        <Card key={bm.key} onClick={() => show(o)}>
                          <div className="ii-card__content">
                            <div className="ii-card__main">
                              <h4 className="ii-card__title">{o.name}</h4>
                              <p className="ii-card__sub">{o.description}</p>
                            </div>
                            <div className="ii-card__meta">
                              {o.website && (
                                <a
                                  href={o.website}
                                  className="ii-btn ii-btn--tiny"
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Website
                                </a>
                              )}
                              <PriorityPill level={o.strength} />
                              <Bookmark active onClick={() => toggleBookmark(o.id)} />
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}
        </main>

        <div className="ii-actions ii-actions--sticky">
          <button className="ii-btn ii-btn--ghost" onClick={() => window.history.back()}>
            Back
          </button>
        </div>

        <Modal open={open} title={focusItem ? focusItem.name : "Competitor Details"} onClose={hide}>
          {focusItem && (
            <div className="ii-modal-grid">
              <div>
                <strong>Name</strong>
                <div>{focusItem.name}</div>
              </div>
              <div>
                <strong>Strength</strong>
                <div>{focusItem.strength || "—"}</div>
              </div>
              <div>
                <strong>Category</strong>
                <div>{focusItem?.category?.name || focusItem.category || "—"}</div>
              </div>
              <div>
                <strong>Website</strong>
                <div>
                  {focusItem.website ? (
                    <a href={focusItem.website} target="_blank" rel="noreferrer" className="ii-link">
                      {focusItem.website}
                    </a>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
              {focusItem.investor_match_reason && (
                <div className="ii-modal-grid-full">
                  <strong>Why Investors Are Interested</strong>
                  <div>{focusItem.investor_match_reason}</div>
                </div>
              )}
              <div className="ii-modal-grid-full">
                <strong>Description</strong>
                <div>{focusItem.description || "—"}</div>
              </div>
              {focusItem.funding_status && (
                <div>
                  <strong>Funding Status</strong>
                  <div>{focusItem.funding_status}</div>
                </div>
              )}
              {focusItem.growth_metrics && (
                <div>
                  <strong>Growth Metrics</strong>
                  <div>{focusItem.growth_metrics}</div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
      <Footer />
    </>
  );
}
