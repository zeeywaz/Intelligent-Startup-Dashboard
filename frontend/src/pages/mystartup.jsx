import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/mystartup.css";
import Header from "../components/Header.jsx";
import Footer from "../components/footer.jsx";
import api, { API_BASE } from "../lib/api";

/* ---------------- Helpers ---------------- */
const cx = (...xs) => xs.filter(Boolean).join(" ");

function useDots(on) {
  const [dots, setDots] = useState("");
  useEffect(() => {
    if (!on) return setDots("");
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 300);
    return () => clearInterval(t);
  }, [on]);
  return dots;
}

/* Investor field helpers */
const invId = (x) => (x && (x.id ?? x.investor_id ?? x.user_id)) || null;
const invName = (x) => {
  if (!x) return "Investor";
  const maybe =
    x.investor_name ??
    x.full_name ??
    (x.user && (x.user.first_name || x.user.last_name)
      ? `${x.user.first_name || ""} ${x.user.last_name || ""}`.trim()
      : "");
  const primary = maybe || x.company || x.company_name;
  return primary || "Investor";
};
const invEmail = (x) => (x?.email ?? x?.email_address) || "";
const invPhone = (x) => (x?.phone ?? x?.phone_number) || "";
const invScore = (x) => {
  const r = x?.credit_score ?? x?.rating ?? (typeof x?.score === "number" ? x.score : null);
  return Number.isFinite(r) ? Number(r) : null;
};
const invVerified = (x) => {
  const raw = (x?.verification_status || x?.verified || "").toString().toLowerCase();
  if (raw === "approved" || raw === "true" || raw === "verified") return "ok";
  if (raw === "pending") return "pending";
  return "unverified";
};

/* ---------- Badge chip ---------- */
function Badge({ children, subtle = false }) {
  return <span className={cx("chip", subtle && "chip--subtle")}>{children}</span>;
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

/* ---------- Strength pill (competitors) ---------- */
function PriorityPill({ level }) {
  const lv = String(level || "").toLowerCase();
  if (!lv) return null;
  const cls =
    lv === "high" ? "pill pill--high" :
    lv === "medium" ? "pill pill--medium" :
    lv === "low" ? "pill pill--low" :
    "pill";
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
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </header>
        <div className="modal__body">{children}</div>
        <footer className="modal__footer">
          <button className="btn btn--ghost" onClick={onClose}>Close</button>
        </footer>
      </div>
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function StartupPage() {
  const navigate = useNavigate();

  const [idea, setIdea] = useState(null);
  const hasIdea = !!idea;

  const [resources, setResources] = useState([]);
  const [resourcesMeta, setResourcesMeta] = useState({ total: 0, next_offset: null, fallback: false });
  const [resourcesBusy, setResourcesBusy] = useState(false);

  const [competitors, setCompetitors] = useState([]);
  const [competitorsMeta, setCompetitorsMeta] = useState({ total: 0, next_offset: null, fallback: false });
  const [competitorsBusy, setCompetitorsBusy] = useState(false);

  const [investors, setInvestors] = useState([]);
  const [investorsMeta, setInvestorsMeta] = useState({ matched_count: 0, fallback: false });

  // Bookmark ids from server
  const [bmIds, setBmIds] = useState({
    resource: new Set(),
    competitor: new Set(),
    investor: new Set(),
  });

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [open, setOpen] = useState(false);
  const [focusItem, setFocusItem] = useState(null);
  const [focusKind, setFocusKind] = useState("");

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

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");

        await api.csrf().catch(() => {});

        // Latest idea
        const rIdeas = await fetch(`${API_BASE}/api/ideas/mine/`, { credentials: "include" });
        const ideas = await rIdeas.json();
        if (!Array.isArray(ideas) || ideas.length === 0) {
          setErr("You don’t have any saved ideas yet.");
          return;
        }
        const latest = ideas[0];
        setIdea(latest);

        // Page bundle
        const res = await fetch(`${API_BASE}/api/mystartup/${latest.idea_id}/?res_limit=8&comp_limit=8`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        setResources(data.resources || []);
        setResourcesMeta(data.resources_meta || { total: 0, next_offset: null, fallback: false });

        setCompetitors(data.competitors || []);
        setCompetitorsMeta(data.competitors_meta || { total: 0, next_offset: null, fallback: false });

        setInvestors(data.investors || []);
        setInvestorsMeta(data.investors_meta || { matched_count: 0, fallback: false });

        await Promise.all([
          refreshBookmarkIds("resource"),
          refreshBookmarkIds("competitor"),
          refreshBookmarkIds("investor"),
        ]);
      } catch (e) {
        console.error(e);
        setErr("Failed to load startup data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []); 

  const loadMoreResources = async () => {
    if (resourcesBusy || resourcesMeta.next_offset == null || !idea) return;
    try {
      setResourcesBusy(true);
      const params = new URLSearchParams({ limit: "8", offset: String(resourcesMeta.next_offset), fallback: "1" });
      if (idea.location) params.set("location", idea.location);
      const res = await fetch(`${API_BASE}/api/resources/?${params}`, { credentials: "include" });
      const data = await res.json();
      setResources((prev) => [...prev, ...(data.items || [])]);
      setResourcesMeta({ total: data.total, next_offset: data.next_offset, fallback: data.fallback });
    } finally {
      setResourcesBusy(false);
    }
  };

  const loadMoreCompetitors = async () => {
    if (competitorsBusy || competitorsMeta.next_offset == null || !idea) return;
    try {
      setCompetitorsBusy(true);
      const params = new URLSearchParams({ limit: "8", offset: String(competitorsMeta.next_offset), fallback: "1" });
      if (idea.category) params.set("category", idea.category);
      const res = await fetch(`${API_BASE}/api/competitors/?${params}`, { credentials: "include" });
      const data = await res.json();
      setCompetitors((prev) => [...prev, ...(data.items || [])]);
      setCompetitorsMeta({ total: data.total, next_offset: data.next_offset, fallback: data.fallback });
    } finally {
      setCompetitorsBusy(false);
    }
  };

  const show = (kind, obj) => { setFocusKind(kind); setFocusItem(obj); setOpen(true); };
  const hide = () => { setOpen(false); setFocusItem(null); setFocusKind(""); };

  // Build “Bookmarked” list from ids + visible data
  const bookmarkedCards = useMemo(() => {
    const out = [];
    for (const r of resources) if (bmIds.resource.has(r.resource_id)) out.push({ key: `resource-${r.resource_id}`, kind: "resource", obj: r });
    for (const c of competitors) if (bmIds.competitor.has(c.id)) out.push({ key: `competitor-${c.id}`, kind: "competitor", obj: c });
    for (const i of investors) { const iid = invId(i); if (iid != null && bmIds.investor.has(iid)) out.push({ key: `investor-${iid}`, kind: "investor", obj: i }); }
    return out;
  }, [resources, competitors, investors, bmIds]);

  return (
    <>
      <Header />
      <div className="startup-app">
        <main className="container">
          <section className="pagehead">
            <h1 className="pagehead__title">Your Startup: {idea ? idea.title : "Loading"}{dots}</h1>
            <p className="pagehead__subtitle">Smart picks tailored to your idea.</p>
          </section>

          {loading && <p className="thinking">Loading{dots}</p>}
          {err && <p className="err">{err}</p>}

          {!loading && !err && (
            <>
              <div className="grid">
                {/* Investors */}
                <section className="panel">
                  <header className="panel__header">
                    <h3 className="panel__title">Recommended Investors</h3>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <Badge subtle>{investors.length} shown</Badge>
                      <Badge>{investorsMeta.fallback ? "Matched + Top-ups" : `Matched: ${investorsMeta.matched_count}`}</Badge>
                    </div>
                  </header>

                  {investors.length === 0 ? (
                    <p className="muted">No investors to show.</p>
                  ) : (
                    <div className="cards">
                      {investors.map((it) => {
                        const id = invId(it);
                        const active = id != null && isBookmarked("investor", id);
                        const v = invVerified(it);
                        const score = invScore(it);
                        return (
                          <Card key={`investor-${id ?? Math.random()}`} onClick={() => show("investor", it)}>
                            <div className="card__content">
                              <div className="card__main">
                                <h4 className="card__title">{invName(it)}</h4>
                                <div className="row row--chips">
                                  <span className={cx("pill", v === "ok" ? "pill--ok" : "pill--muted")}>
                                    {v === "ok" ? "Verified" : v === "pending" ? "Pending" : "Unverified"}
                                  </span>
                                  {Number.isFinite(score) && <span className="pill pill--soft">Score {score}</span>}
                                </div>
                                {invEmail(it) && (
                                  <p className="card__sub">
                                    <a className="link" href={`mailto:${invEmail(it)}`}>{invEmail(it)}</a>
                                  </p>
                                )}
                                {invPhone(it) && <p className="card__sub">{invPhone(it)}</p>}
                              </div>
                              <div className="card__meta">
                                <Bookmark active={active} onClick={() => id != null && toggleBookmark("investor", id)} />
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Resources */}
                <section className="panel">
                  <header className="panel__header">
                    <h3 className="panel__title">Recommended Resources & Services</h3>
                    <Badge>
                      {resourcesMeta.fallback ? "Showing all locations" : idea?.location ? `Location: ${idea.location}` : "Location: —"}
                    </Badge>
                  </header>

                  {resources.length === 0 ? (
                    <p className="muted">No resources found.</p>
                  ) : (
                    <>
                      <div className="cards">
                        {resources.map((it) => {
                          const id = it.resource_id;
                          const active = isBookmarked("resource", id);
                          return (
                            <Card key={`resource-${id}`} onClick={() => show("resource", it)}>
                              <div className="card__content">
                                <div className="card__main">
                                  <h4 className="card__title">{it.name}</h4>
                                  <p className="card__sub">{[it.type, it.location].filter(Boolean).join(" • ")}</p>
                                  {it.description && <p className="card__desc">{it.description}</p>}
                                </div>
                                <div className="card__meta">
                                  {it.website && (
                                    <a href={it.website} className="btn btn--tiny" target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                                      Website
                                    </a>
                                  )}
                                  <Bookmark active={active} onClick={() => toggleBookmark("resource", id)} />
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                      <div className="panel__footer">
                        {resourcesMeta.next_offset != null ? (
                          <button className="btn btn--ghost" onClick={loadMoreResources} disabled={resourcesBusy}>
                            {resourcesBusy ? "Loading…" : "Load more"}
                          </button>
                        ) : (
                          <span className="muted small">End of list</span>
                        )}
                      </div>
                    </>
                  )}
                </section>
              </div>

              <div className="grid">
                {/* Competitors */}
                <section className="panel">
                  <header className="panel__header">
                    <h3 className="panel__title">Similar Businesses around You</h3>
                    <Badge>{competitorsMeta.fallback ? "Showing all categories" : idea?.category ? `Category: ${idea.category}` : "Category: —"}</Badge>
                  </header>

                  {competitors.length === 0 ? (
                    <p className="muted">No competitors listed yet.</p>
                  ) : (
                    <>
                      <div className="cards">
                        {competitors.map((it) => {
                          const id = it.id;
                          const active = isBookmarked("competitor", id);
                          return (
                            <Card key={`competitor-${id}`} onClick={() => show("business", it)}>
                              <div className="card__content">
                                <div className="card__main">
                                  <h4 className="card__title">{it.name}</h4>
                                  <p className="card__sub">{it.description}</p>
                                </div>
                                <div className="card__meta">
                                  {it.website && (
                                    <a href={it.website} className="btn btn--tiny" target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                                      Website
                                    </a>
                                  )}
                                  <PriorityPill level={it.strength} />
                                  <Bookmark active={active} onClick={() => toggleBookmark("competitor", id)} />
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                      <div className="panel__footer">
                        {competitorsMeta.next_offset != null ? (
                          <button className="btn btn--ghost" onClick={loadMoreCompetitors} disabled={competitorsBusy}>
                            {competitorsBusy ? "Loading…" : "Load more"}
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
                    <h3 className="panel__title">Bookmarked</h3>
                  </header>

                  {bookmarkedCards.length === 0 ? (
                    <p className="muted">No bookmarks yet. Tap ★ on any card to save.</p>
                  ) : (
                    <div className="cards">
                      {bookmarkedCards.map((bm) => {
                        const kind = bm.kind;
                        const o = bm.obj;

                        const v = kind === "investor" ? invVerified(o) : null;
                        const score = kind === "investor" ? invScore(o) : null;
                        const investorName = kind === "investor" ? invName(o) : null;
                        const investorEmail = kind === "investor" ? invEmail(o) : null;

                        return (
                          <Card key={bm.key} onClick={() => show(kind === "competitor" ? "business" : kind, o)}>
                            <div className="card__content">
                              <div className="card__main">
                                <h4 className="card__title">{kind === "investor" ? investorName : o.name || o.company}</h4>

                                {kind === "investor" ? (
                                  <>
                                    <div className="row row--chips">
                                      <span className={cx("pill", v === "ok" ? "pill--ok" : "pill--muted")}>
                                        {v === "ok" ? "Verified" : v === "pending" ? "Pending" : "Unverified"}
                                      </span>
                                      {Number.isFinite(score) && <span className="pill pill--soft">Score {score}</span>}
                                    </div>
                                    {investorEmail && (
                                      <p className="card__sub">
                                        <a className="link" href={`mailto:${investorEmail}`}>{investorEmail}</a>
                                      </p>
                                    )}
                                  </>
                                ) : (
                                  <p className="card__sub">{o.location || o.description || "—"}</p>
                                )}
                              </div>

                              <div className="card__meta">
                                {kind !== "investor" && o.website && (
                                  <a href={o.website} className="btn btn--tiny" target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                                    Website
                                  </a>
                                )}
                                <Bookmark
                                  active
                                  onClick={() => {
                                    const id = kind === "resource" ? o.resource_id : kind === "competitor" ? o.id : invId(o);
                                    if (id != null) toggleBookmark(kind, id);
                                  }}
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
            </>
          )}
        </main>

        {/* Sticky actions */}
        <div className="actions actions--sticky">
          <button className="btn" onClick={() => navigate("/chatbot")}>
            {hasIdea ? "Change Idea" : "Create Idea"}
          </button>
          <button className="btn btn--ghost" onClick={() => window.history.back()}>
            Back
          </button>
        </div>

        <Modal
          open={open}
          title={focusItem ? focusItem.name || focusItem.company || "Details" : "Details"}
          onClose={hide}
        >
          {focusItem && (
            <div className="modal-grid">
              {focusKind === "investor" && (
                <>
                  <div><strong>Company</strong><div>{focusItem.company || focusItem.company_name || "—"}</div></div>
                  <div><strong>Role</strong><div>{focusItem.role || "—"}</div></div>
                  <div><strong>Phone</strong><div>{invPhone(focusItem) || "—"}</div></div>
                  <div>
                    <strong>Email</strong>
                    <div>
                      {invEmail(focusItem) ? (
                        <a href={`mailto:${invEmail(focusItem)}`} target="_blank" rel="noreferrer">
                          {invEmail(focusItem)}
                        </a>
                      ) : "—"}
                    </div>
                  </div>
                </>
              )}
              {focusKind === "resource" && (
                <>
                  <div><strong>Name</strong><div>{focusItem.name}</div></div>
                  <div><strong>Type</strong><div>{focusItem.type || "—"}</div></div>
                  <div><strong>Location</strong><div>{focusItem.location || "—"}</div></div>
                  <div>
                    <strong>Website</strong>
                    <div>
                      {focusItem.website ? (
                        <a href={focusItem.website} target="_blank" rel="noreferrer">{focusItem.website}</a>
                      ) : "—"}
                    </div>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <strong>Description</strong><div>{focusItem.description || "—"}</div>
                  </div>
                </>
              )}
              {focusKind === "business" && (
                <>
                  <div><strong>Name</strong><div>{focusItem.name}</div></div>
                  <div><strong>Strength</strong><div>{focusItem.strength || "—"}</div></div>
                  <div><strong>Category</strong><div>{focusItem?.category?.name || "—"}</div></div>
                  <div>
                    <strong>Website</strong>
                    <div>
                      {focusItem.website ? (
                        <a href={focusItem.website} target="_blank" rel="noreferrer">{focusItem.website}</a>
                      ) : "—"}
                    </div>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <strong>Description</strong><div>{focusItem.description || "—"}</div>
                  </div>
                </>
              )}
            </div>
          )}
        </Modal>
      </div>
      <Footer />
    </>
  );
}
