import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./InvestorInterest.css";
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
  return <span className="chip">{children}</span>;
}

/* ---------- Bookmark star ---------- */
function Bookmark({ active, onClick, label = "Bookmark" }) {
  return (
    <button
      type="button"
      className={cx("star", active && "star--active")}
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <span aria-hidden className="star__glyph">★</span>
    </button>
  );
}

/* ---------- Card ---------- */
function Card({ onClick, children }) {
  return (
    <article
      className="card"
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
      ? "pill pill--high"
      : lv === "medium"
      ? "pill pill--medium"
      : lv === "low"
      ? "pill pill--low"
      : "pill";
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
      className="modal"
      role="dialog"
      aria-modal="true"
      ref={ref}
      onMouseDown={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal__panel" role="document">
        <header className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
        <div className="modal__body">{children}</div>
        <footer className="modal__footer">
          <button className="btn btn--ghost" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function InvestorInterest() {
  const navigate = useNavigate();

  const [idea, setIdea] = useState(null);
  const [competitors, setCompetitors] = useState([]);
  const [competitorsMeta, setCompetitorsMeta] = useState({
    total: 0,
    next_offset: null,
    fallback: false,
  });
  const [competitorsBusy, setCompetitorsBusy] = useState(false);

  // Server bookmark id sets
  const [bmIds, setBmIds] = useState({
    competitor: new Set(),
  });

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [open, setOpen] = useState(false);
  const [focusItem, setFocusItem] = useState(null);

  const dots = useDots(loading);
  const isBookmarked = (kind, id) => bmIds[kind]?.has(id);

  const refreshBookmarkIds = async (kind) => {
    try {
      const data = await api.bookmarkIds(kind);
      if (Array.isArray(data?.ids)) {
        setBmIds((prev) => ({ ...prev, [kind]: new Set(data.ids) }));
      }
    } catch (e) {
      console.error("bookmarkIds failed", e);
    }
  };

  const toggleBookmark = async (kind, id) => {
    try {
      await api.toggleBookmark(kind, id);
      await refreshBookmarkIds(kind);
    } catch (e) {
      alert(e?.message || "Failed to toggle bookmark.");
    }
  };

  // Fetch competitors based on investor interests
  const fetchCompetitorsByInterest = async (offset = null) => {
    try {
      const params = new URLSearchParams({
        limit: "8",
        by_interest: "1", // Special parameter for investor interest based filtering
      });
      
      if (offset) {
        params.set("offset", String(offset));
      }
      
      const res = await fetch(`${API_BASE}/api/competitors/?${params}`, {
        credentials: "include",
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      return data;
    } catch (error) {
      console.error("Failed to fetch competitors by interest:", error);
      throw error;
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");

        // Make sure CSRF cookie exists
        await api.csrf().catch(() => {});

        // Get latest idea
        const rIdeas = await fetch(`${API_BASE}/api/ideas/mine/`, {
          credentials: "include",
        });
        const ideas = await rIdeas.json();
        if (!Array.isArray(ideas) || ideas.length === 0) {
          setErr("You don't have any saved ideas yet.");
          return;
        }
        const latest = ideas[0];
        setIdea(latest);

        // Fetch competitors based on investor interests
        const competitorsData = await fetchCompetitorsByInterest();
        
        setCompetitors(competitorsData.items || competitorsData.competitors || []);
        setCompetitorsMeta({
          total: competitorsData.total || 0,
          next_offset: competitorsData.next_offset || null,
          fallback: competitorsData.fallback || false,
        });

        // Fetch server bookmark ids for competitors
        await refreshBookmarkIds("competitor");
      } catch (e) {
        console.error(e);
        setErr("Failed to load investor interest data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadMoreCompetitors = async () => {
    if (competitorsBusy || competitorsMeta.next_offset == null) return;
    try {
      setCompetitorsBusy(true);
      const data = await fetchCompetitorsByInterest(competitorsMeta.next_offset);
      setCompetitors((prev) => [...prev, ...(data.items || data.competitors || [])]);
      setCompetitorsMeta({
        total: data.total || 0,
        next_offset: data.next_offset || null,
        fallback: data.fallback || false,
      });
    } catch (e) {
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

  // Build "Bookmarked" from competitors
  const bookmarkedCards = useMemo(() => {
    const out = [];
    for (const c of competitors) {
      if (bmIds.competitor.has(c.id)) {
        out.push({ key: `competitor-${c.id}`, kind: "competitor", obj: c });
      }
    }
    return out;
  }, [competitors, bmIds]);

  return (
    <>
      <Header />
      <div className="investor-interest-app">
        <main className="container">
          <section className="pagehead">
            <h1 className="pagehead__title">
              Investor Interest: {idea ? idea.title : "Loading"}
              {dots}
            </h1>
            <p className="pagehead__subtitle">
              Competitors matching investor interests in your business category
            </p>
          </section>

          {loading && <p className="thinking">Loading{dots}</p>}
          {err && <p className="err">{err}</p>}

          {!loading && !err && (
            <div className="investor-interest-grid">
              {/* Recommended Competitors */}
              <section className="panel">
                <header className="panel__header">
                  <h3 className="panel__title">Recommended Competitors</h3>
                  <Badge>
                    {competitorsMeta.fallback
                      ? "Showing all categories"
                      : idea?.category
                      ? `Category: ${idea.category}`
                      : "Category: —"}
                  </Badge>
                </header>

                {competitors.length === 0 ? (
                  <p className="muted">No competitors found matching investor interests.</p>
                ) : (
                  <>
                    <div className="cards">
                      {competitors.map((it) => {
                        const id = it.id;
                        const active = isBookmarked("competitor", id);
                        return (
                          <Card
                            key={`competitor-${id}`}
                            onClick={() => show(it)}
                          >
                            <div className="card__content">
                              <div className="card__main">
                                <h4 className="card__title">{it.name}</h4>
                                <p className="card__sub">{it.description}</p>
                                {it.investor_match_reason && (
                                  <p className="card__desc">
                                    <strong>Investor Interest:</strong> {it.investor_match_reason}
                                  </p>
                                )}
                              </div>
                              <div className="card__meta">
                                {it.website && (
                                  <a
                                    href={it.website}
                                    className="btn btn--tiny"
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    Website
                                  </a>
                                )}
                                <PriorityPill level={it.strength} />
                                <Bookmark
                                  active={active}
                                  onClick={() => toggleBookmark("competitor", id)}
                                />
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                    <div className="panel__footer">
                      {competitorsMeta.next_offset != null ? (
                        <button
                          className="btn btn--ghost"
                          onClick={loadMoreCompetitors}
                          disabled={competitorsBusy}
                        >
                          {competitorsBusy ? "Loading…" : "Load more competitors"}
                        </button>
                      ) : (
                        <span className="muted small">End of list</span>
                      )}
                    </div>
                  </>
                )}
              </section>

              {/* Bookmarked */}
              <section className="panel">
                <header className="panel__header">
                  <h3 className="panel__title">Bookmarked Competitors</h3>
                </header>

                {bookmarkedCards.length === 0 ? (
                  <p className="muted">No bookmarks yet. Tap ★ on any competitor to save.</p>
                ) : (
                  <div className="cards">
                    {bookmarkedCards.map((bm) => {
                      const o = bm.obj;
                      return (
                        <Card
                          key={bm.key}
                          onClick={() => show(o)}
                        >
                          <div className="card__content">
                            <div className="card__main">
                              <h4 className="card__title">{o.name}</h4>
                              <p className="card__sub">{o.description}</p>
                              {o.investor_match_reason && (
                                <p className="card__desc">
                                  <strong>Investor Interest:</strong> {o.investor_match_reason}
                                </p>
                              )}
                            </div>
                            <div className="card__meta">
                              {o.website && (
                                <a
                                  href={o.website}
                                  className="btn btn--tiny"
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Website
                                </a>
                              )}
                              <PriorityPill level={o.strength} />
                              <Bookmark
                                active
                                onClick={() => toggleBookmark("competitor", o.id)}
                              />
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

        {/* Always-visible actions */}
        <div className="actions actions--sticky">
          <button className="btn" onClick={() => navigate("/mystartup")}>
            Back to My Startup
          </button>
          <button className="btn btn--ghost" onClick={() => window.history.back()}>
            Back
          </button>
        </div>

        <Modal
          open={open}
          title={focusItem ? focusItem.name : "Competitor Details"}
          onClose={hide}
        >
          {focusItem && (
            <div className="modal-grid">
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
                <div>{focusItem?.category?.name || "—"}</div>
              </div>
              <div>
                <strong>Website</strong>
                <div>
                  {focusItem.website ? (
                    <a
                      href={focusItem.website}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {focusItem.website}
                    </a>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
              {focusItem.investor_match_reason && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <strong>Why Investors Are Interested</strong>
                  <div>{focusItem.investor_match_reason}</div>
                </div>
              )}
              <div style={{ gridColumn: "1 / -1" }}>
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