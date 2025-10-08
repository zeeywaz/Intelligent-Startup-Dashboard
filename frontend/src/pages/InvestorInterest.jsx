import React, { useEffect, useMemo, useRef, useState } from "react";
import "../styles/InvestorInterest.css";
import Header from "../components/Header.jsx";
import Footer from "../components/footer.jsx";
import api, { API_BASE } from "../lib/api";

/* ---------------- Constants & helpers ---------------- */
const API = `${API_BASE || ""}/api`;
const cx = (...xs) => xs.filter(Boolean).join(" ");
const uniqBy = (arr, key = (x) => x) => {
  const seen = new Set();
  const out = [];
  for (const it of arr) {
    const k = key(it);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(it);
    }
  }
  return out;
};
function useDots(on) {
  const [dots, setDots] = useState("");
  useEffect(() => {
    if (!on) return setDots("");
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 300);
    return () => clearInterval(t);
  }, [on]);
  return dots;
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

/* ---------- Small UI atoms ---------- */
function Badge({ children }) { return <span className="ii-chip">{children}</span>; }
function Pill({ tone = "soft", children }) {
  return <span className={cx("ii-pill", `ii-pill--${tone}`)}>{children}</span>;
}
function Bookmark({ active, onClick, label = "Bookmark" }) {
  return (
    <button
      type="button"
      className={cx("ii-star", active && "ii-star--active")}
      aria-pressed={!!active}
      aria-label={label}
      title={label}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
    >
      <span aria-hidden className="ii-star__glyph">★</span>
    </button>
  );
}
function Card({ onClick, children }) {
  return (
    <article
      className="ii-card"
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); }
      }}
    >
      {children}
    </article>
  );
}
function PriorityPill({ level }) {
  const lv = String(level || "").toLowerCase();
  const cls = lv === "high" ? "ii-pill ii-pill--high" : lv === "medium" ? "ii-pill ii-pill--medium" : "ii-pill ii-pill--low";
  const label = lv ? lv[0].toUpperCase() + lv.slice(1) : "Low";
  return <span className={cls}>{label}</span>;
}

/* ---------- Modal ---------- */
function Modal({ open, title, children, onClose, footer }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
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
      onMouseDown={(e) => { if (e.target === ref.current) onClose?.(); }}
    >
      <div className="ii-modal__panel" role="document">
        <header className="ii-modal__header">
          <h2 className="ii-modal__title">{title}</h2>
          <button className="ii-modal__close" onClick={onClose} aria-label="Close">✕</button>
        </header>
        <div className="ii-modal__body">{children}</div>
        <footer className="ii-modal__footer">
          {footer ?? <button className="ii-btn ii-btn--ghost" onClick={onClose}>Close</button>}
        </footer>
      </div>
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function InvestorInterest() {
  const [me, setMe] = useState(null);
  const [investor, setInvestor] = useState(null);
  const [allCategories, setAllCategories] = useState([]); // [{id,name}]
  const [interestIds, setInterestIds] = useState([]);     // [category_id]

  // Data
  const [competitors, setCompetitors] = useState([]);
  const [ideas, setIdeas] = useState([]);

  // UX
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const dots = useDots(loading || busy);

  const [openDetails, setOpenDetails] = useState(false);
  const [focusItem, setFocusItem] = useState(null);

  // Bookmarks (competitors + ideas)
  const [bmIds, setBmIds] = useState({ competitor: new Set(), idea: new Set() });
  const isCompetitorBookmarked = (id) => bmIds.competitor?.has(id);
  const isIdeaBookmarked = (id) => bmIds.idea?.has(id);

  const refreshBookmarkIds = async () => {
    try {
      // Accept either {ids:[...]} or combined object
      const [c, i] = await Promise.all([
        api.bookmarkIds("competitor"),
        api.bookmarkIds("idea"),
      ]);
      const cIds = Array.isArray(c?.ids) ? c.ids : (c?.competitor || []);
      const iIds = Array.isArray(i?.ids) ? i.ids : (i?.idea || []);
      setBmIds({ competitor: new Set(cIds), idea: new Set(iIds) });
    } catch {
      // non-fatal
    }
  };
  const toggleCompetitorBookmark = async (id) => {
    try { await api.toggleBookmark("competitor", id); await refreshBookmarkIds(); }
    catch (e) { alert(e?.message || "Failed to toggle bookmark."); }
  };
  const toggleIdeaBookmark = async (ideaId) => {
    try { await api.toggleBookmark("idea", ideaId); await refreshBookmarkIds(); }
    catch (e) { alert(e?.message || "Failed to toggle bookmark."); }
  };

  /* ----------- Fetchers ----------- */
  async function fetchMe() {
    const res = await fetch(`${API}/me/`, { credentials: "include" });
    if (!res.ok) throw new Error(`me HTTP ${res.status}`);
    return res.json();
  }
  async function fetchInvestorByEmail(email) {
    const res = await fetch(`${API}/investors/?search=${encodeURIComponent(email)}`, { credentials: "include" });
    if (!res.ok) throw new Error(`investors HTTP ${res.status}`);
    const j = await res.json();
    const arr = Array.isArray(j) ? j : (j.results || j.items || []);
    const found = arr.find(x => String(x.email_address || "").toLowerCase() === String(email).toLowerCase());
    return found || arr[0] || null;
  }
  async function fetchCategories() {
    const res = await fetch(`${API}/categories/`, { credentials: "include" });
    if (!res.ok) throw new Error(`categories HTTP ${res.status}`);
    const j = await res.json();
    return Array.isArray(j) ? j : (j.results || j.items || []);
  }
  async function fetchInterests(invId) {
    const res = await fetch(`${API}/investors/${invId}/interests/`, { credentials: "include" });
    if (!res.ok) throw new Error(`interests HTTP ${res.status}`);
    const j = await res.json();
    return Array.isArray(j) ? j : (j.category_ids || []);
  }
  async function saveInterests(invId, ids) {
    const res = await fetch(`${API}/investors/${invId}/interests/`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken") },
      body: JSON.stringify({ category_ids: ids }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(t || `save interests HTTP ${res.status}`);
    }
    const j = await res.json();
    return j.category_ids || ids;
  }
  async function fetchCompetitors(limit = 500) {
    const params = new URLSearchParams({ limit: String(limit) });
    const res = await fetch(`${API}/competitors/?${params.toString()}`, { credentials: "include" });
    if (!res.ok) throw new Error(`competitors HTTP ${res.status}`);
    const j = await res.json();
    return Array.isArray(j) ? j : (j.items || []);
  }
  async function fetchIdeasForInterests(invId, limit = 100, offset = 0) {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    const res = await fetch(`${API}/investors/${invId}/my-interests/?${params.toString()}`, { credentials: "include" });
    if (!res.ok) throw new Error(`ideas HTTP ${res.status}`);
    const j = await res.json();
    return Array.isArray(j?.businessIdeas) ? j.businessIdeas : [];
  }

  /* ----------- Bootstrap ----------- */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true); setErr("");
        await api.csrf().catch(() => {});
        const meData = await fetchMe();
        setMe(meData?.user || null);

        const inv = await fetchInvestorByEmail(meData?.user?.email || "");
        if (!inv) throw new Error("Investor profile not found for this account.");
        setInvestor(inv);

        const cats = await fetchCategories();
        setAllCategories(cats);

        const ids = await fetchInterests(inv.investor_id);
        setInterestIds(ids);

        const comps = await fetchCompetitors(600);
        setCompetitors(comps);

        const is = await fetchIdeasForInterests(inv.investor_id, 100, 0);
        setIdeas(is);

        await refreshBookmarkIds();
      } catch (e) {
        setErr(e?.message || "Failed to load investor interests.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ----------- Derived ----------- */
  const catById = useMemo(() => {
    const map = new Map();
    for (const c of allCategories) map.set(c.id, c);
    return map;
  }, [allCategories]);
  const selectedCats = useMemo(() => interestIds.map((id) => catById.get(id)).filter(Boolean), [interestIds, catById]);

  const matchedCompetitors = useMemo(() => {
    if (!interestIds?.length) return [];
    const ids = new Set(interestIds);
    const filtered = competitors.filter((c) => {
      const cid = c?.category?.id ?? c?.category_id ?? c?.category?.pk;
      return cid != null && ids.has(Number(cid));
    });
    return uniqBy(filtered, (x) => x.id);
  }, [competitors, interestIds]);

  const bookmarkedCompetitors = useMemo(
    () => matchedCompetitors.filter((c) => isCompetitorBookmarked(c.id)),
    [matchedCompetitors, bmIds]
  );

  const bookmarkedIdeas = useMemo(
    () => ideas.filter((it) => isIdeaBookmarked(it.idea_id)),
    [ideas, bmIds]
  );

  /* ----------- Edit Interests modal ----------- */
  const [editOpen, setEditOpen] = useState(false);
  const [editSel, setEditSel] = useState(new Set());
  useEffect(() => { setEditSel(new Set(interestIds || [])); }, [editOpen, interestIds]);

  const toggleCat = (id) => setEditSel((prev) => {
    const n = new Set(prev);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  const handleSaveInterests = async () => {
    if (!investor) return;
    try {
      setBusy(true);
      const nextIds = await saveInterests(investor.investor_id, Array.from(editSel));
      setInterestIds(nextIds);
      const is = await fetchIdeasForInterests(investor.investor_id, 100, 0);
      setIdeas(is);
      setEditOpen(false);
    } catch (e) {
      alert(e?.message || "Failed to save interests.");
    } finally {
      setBusy(false);
    }
  };

  /* ----------- Details modal ----------- */
  const show = (obj) => { setFocusItem(obj); setOpenDetails(true); };
  const hide = () => { setOpenDetails(false); setFocusItem(null); };

  /* ----------- Render ----------- */
  const body = (() => {
    if (loading) return <p className="ii-thinking">Loading{dots}</p>;
    if (err) return <p className="ii-err">{err}</p>;

    return (
      <>
        {/* Filter bar */}
        <section className="ii-panel ii-filterbar">
          <div className="ii-panel__header">
            <h3 className="ii-panel__title">Your interested categories</h3>
            <div className="ii-filterbar__actions">
              <button className="ii-btn" onClick={() => setEditOpen(true)}>{busy ? `Saving${dots}` : "Edit interests"}</button>
              {interestIds.length > 0 && (
                <button
                  className="ii-btn ii-btn--ghost"
                  onClick={async () => {
                    if (!investor) return;
                    try {
                      setBusy(true);
                      const cleared = await saveInterests(investor.investor_id, []);
                      setInterestIds(cleared);
                      setIdeas([]);
                    } catch (e) {
                      alert(e?.message || "Failed to clear interests.");
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div className="ii-filterbar__chips">
            {selectedCats.length ? (
              selectedCats.map((c) => <Badge key={c.id}>{c.name}</Badge>)
            ) : (
              <p className="ii-muted">No interests yet. Click “Edit interests”.</p>
            )}
          </div>
        </section>

        <div className="ii-grid">
          {/* Competitors in my categories */}
          <section className="ii-panel">
            <header className="ii-panel__header">
              <h3 className="ii-panel__title">Competitors in your interests</h3>
              {interestIds.length > 0 && <Pill>{matchedCompetitors.length} matches</Pill>}
            </header>

            {interestIds.length === 0 ? (
              <p className="ii-muted">Pick at least one category to see matching competitors.</p>
            ) : matchedCompetitors.length === 0 ? (
              <p className="ii-muted">No competitors found for your selected categories.</p>
            ) : (
              <div className="ii-cards">
                {matchedCompetitors.map((it) => (
                  <Card key={`competitor-${it.id}`} onClick={() => show(it)}>
                    <div className="ii-card__content">
                      <div className="ii-card__main">
                        <h4 className="ii-card__title">{it.name}</h4>
                        <p className="ii-card__sub">{it?.category?.name || it.category || "—"}</p>
                        {it.description && <p className="ii-card__desc">{it.description}</p>}
                      </div>
                      <div className="ii-card__meta">
                        {it.website && (
                          <a
                            href={/^https?:\/\//i.test(it.website) ? it.website : `https://${it.website}`}
                            className="ii-btn ii-btn--tiny"
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Website
                          </a>
                        )}
                        <PriorityPill level={it.strength} />
                        <Bookmark active={isCompetitorBookmarked(it.id)} onClick={() => toggleCompetitorBookmark(it.id)} />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Ideas that match my interests */}
          <section className="ii-panel">
            <header className="ii-panel__header">
              <h3 className="ii-panel__title">Business ideas in your interests</h3>
              {interestIds.length > 0 && <Pill tone="soft">{ideas.length} ideas</Pill>}
            </header>

            {interestIds.length === 0 ? (
              <p className="ii-muted">Pick at least one category to see ideas.</p>
            ) : ideas.length === 0 ? (
              <p className="ii-muted">No ideas yet in your selected categories.</p>
            ) : (
              <div className="ii-cards">
                {ideas.map((it) => (
                  <Card key={`idea-${it.idea_id}`}>
                    <div className="ii-card__content">
                      <div className="ii-card__main">
                        <h4 className="ii-card__title">{it.title}</h4>
                        <p className="ii-card__sub">
                          {it.category ? <Badge>{it.category}</Badge> : null}{" "}
                          <span className="ii-small">{new Date(it.submission_date).toLocaleDateString()}</span>
                        </p>
                        {it.description && <p className="ii-card__desc">{it.description}</p>}
                      </div>
                      <div className="ii-card__meta">
                        <Bookmark
                          active={isIdeaBookmarked(it.idea_id)}
                          onClick={() => toggleIdeaBookmark(it.idea_id)}
                          label="Bookmark idea"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Bookmarked competitors subset */}
        <section className="ii-panel">
          <header className="ii-panel__header">
            <h3 className="ii-panel__title">Your bookmarked competitors (in these categories)</h3>
          </header>
          {bookmarkedCompetitors.length === 0 ? (
            <p className="ii-muted">No competitor bookmarks yet in your current interests.</p>
          ) : (
            <div className="ii-cards">
              {bookmarkedCompetitors.map((o) => (
                <Card key={`bm-${o.id}`} onClick={() => show(o)}>
                  <div className="ii-card__content">
                    <div className="ii-card__main">
                      <h4 className="ii-card__title">{o.name}</h4>
                      <p className="ii-card__sub">{o?.category?.name || o.category || "—"}</p>
                      {o.description && <p className="ii-card__desc">{o.description}</p>}
                    </div>
                    <div className="ii-card__meta">
                      <PriorityPill level={o.strength} />
                      <Bookmark active onClick={() => toggleCompetitorBookmark(o.id)} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Bookmarked ideas subset */}
        <section className="ii-panel">
          <header className="ii-panel__header">
            <h3 className="ii-panel__title">Your bookmarked ideas</h3>
          </header>
          {bookmarkedIdeas.length === 0 ? (
            <p className="ii-muted">No idea bookmarks yet.</p>
          ) : (
            <div className="ii-cards">
              {bookmarkedIdeas.map((it) => (
                <Card key={`bm-idea-${it.idea_id}`}>
                  <div className="ii-card__content">
                    <div className="ii-card__main">
                      <h4 className="ii-card__title">{it.title}</h4>
                      <p className="ii-card__sub">
                        {it.category ? <Badge>{it.category}</Badge> : null}{" "}
                        <span className="ii-small">{new Date(it.submission_date).toLocaleDateString()}</span>
                      </p>
                      {it.description && <p className="ii-card__desc">{it.description}</p>}
                    </div>
                    <div className="ii-card__meta">
                      <Bookmark
                        active={true}
                        onClick={() => toggleIdeaBookmark(it.idea_id)}
                        label="Remove bookmark"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </>
    );
  })();

  return (
    <>
      <Header />
      <div className="ii-app">
        <main className="ii-container">
          <section className="ii-pagehead">
            <h1 className="ii-pagehead__title">
              Investor Interests {loading || busy ? dots : ""}
            </h1>
            <p className="ii-pagehead__subtitle">
              Only categories you’re interested in will appear here.
            </p>
          </section>
          {body}
        </main>

        <div className="ii-actions ii-actions--sticky">
          <button className="ii-btn ii-btn--ghost" onClick={() => window.history.back()}>
            Back
          </button>
        </div>

        {/* Competitor details */}
        <Modal open={openDetails} title={focusItem ? focusItem.name : "Competitor"} onClose={() => { setOpenDetails(false); setFocusItem(null); }}>
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
                    <a
                      href={/^https?:\/\//i.test(focusItem.website) ? focusItem.website : `https://${focusItem.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="ii-link"
                    >
                      {focusItem.website}
                    </a>
                  ) : "—"}
                </div>
              </div>
              <div className="ii-modal-grid-full">
                <strong>Description</strong>
                <div>{focusItem.description || "—"}</div>
              </div>
            </div>
          )}
        </Modal>

        {/* Edit interests */}
        <Modal
          open={editOpen}
          title="Edit your interested categories"
          onClose={() => setEditOpen(false)}
          footer={
            <>
              <button className="ii-btn ii-btn--ghost" onClick={() => setEditOpen(false)} disabled={busy}>
                Cancel
              </button>
              <button className="ii-btn" onClick={handleSaveInterests} disabled={busy}>
                {busy ? `Saving${dots}` : "Save"}
              </button>
            </>
          }
        >
          <div className="ii-catlist">
            {allCategories.length === 0 ? (
              <p className="ii-muted">No categories found.</p>
            ) : (
              allCategories.map((c) => (
                <label key={c.id} className="ii-check">
                  <input
                    type="checkbox"
                    checked={editSel.has(c.id)}
                    onChange={() => toggleCat(c.id)}
                  />
                  <span>{c.name}</span>
                </label>
              ))
            )}
          </div>
        </Modal>
      </div>
      <Footer />
    </>
  );
}
