import React, { useMemo, useState, useEffect, useRef } from "react";
import "../styles/competitors.css";
import Header from "../components/Header.jsx";
import Footer from "../components/footer.jsx";
import { Search, List } from "lucide-react";

/* ===== Stars (lightweight, accessible) ===== */
function StarRating({ value = 0, outOf = 5 }) {
  const clamped = Math.max(0, Math.min(outOf, value));
  const filled = "★".repeat(Math.round(clamped));
  const empty = "☆".repeat(outOf - filled.length);
  return (
    <span className="cmp-stars" aria-label={`${clamped} out of ${outOf} stars`}>
      <span aria-hidden className="cmp-stars__filled">{filled}</span>
      <span aria-hidden className="cmp-stars__empty">{empty}</span>
    </span>
  );
}

/* ===== Modal (accessible) ===== */
function Modal({ open, title, children, onClose }) {
  const overlayRef = useRef(null);
  const closeRef = useRef(null);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Focus close on open
  useEffect(() => {
    if (open && closeRef.current) closeRef.current.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="cmp-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cmp-modal-title"
      ref={overlayRef}
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="cmp-modal__panel" role="document">
        <div className="cmp-modal__header">
          <h2 id="cmp-modal-title" className="cmp-modal__title">{title}</h2>
          <button
            type="button"
            className="cmp-btn cmp-btn--ghost"
            onClick={onClose}
            ref={closeRef}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>
        <div className="cmp-modal__body">{children}</div>
        <div className="cmp-modal__footer">
          <button type="button" className="cmp-btn cmp-btn--ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== Card ===== */
function CompetitorCard({ item, onOpen }) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen();
    }
  };
  return (
    <article
      className="cmp-card cmp-card--interactive"
      role="button"
      tabIndex={0}
      aria-label={`Open ${item.name} details`}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
    >
      <StarRating value={item.rating} />
      <h3 className="cmp-card__title">{item.name}</h3>
      <p className="cmp-card__type">{item.type}</p>
    </article>
  );
}

/* ===== Page ===== */
export default function CompetitorsPage() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const data = [
    { name: "Competitor",      type: "Business Type", rating: 4 },
    { name: "Apex Labs",       type: "SaaS",          rating: 3 },
    { name: "Zenith Corp",     type: "AI Platform",   rating: 4 },
    { name: "Nexus Digital",   type: "MarTech",       rating: 2 },
    { name: "Quantum Works",   type: "Analytics",     rating: 3 },
    { name: "Vector Systems",  type: "Cloud Infra",   rating: 3 },
    /* + More */
    { name: "Skyline Analytics", type: "Data Tools",    rating: 5 },
    { name: "Orion Cloud",       type: "PaaS",          rating: 4 },
    { name: "Pulse Metrics",     type: "HealthTech",    rating: 2 },
    { name: "TerraSoft",         type: "GreenTech",     rating: 3 },
    { name: "ByteForge",         type: "DevTools",      rating: 4 },
    { name: "Lumina AI",         type: "ML Ops",        rating: 5 },
  ];

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((x) =>
      [x.name, x.type].some((f) => f.toLowerCase().includes(q))
    );
  }, [query]);

  return (
    <div className="cmp-app">
      <Header />

      <main id="main" className="cmp-main" role="main">
        <section className="cmp-panel" aria-label="Competitors analysis">
          <div className="cmp-head">
            <div className="cmp-titles">
              <h2 className="cmp-title">Competitors Analysis</h2>
              <p className="cmp-subtitle">
                Compare market players and find your competitive edge.
              </p>
            </div>

            <div className="cmp-search">
              <List className="cmp-search__left" aria-hidden />
              <label htmlFor="cmp-search-input" className="sr-only">Search competitors</label>
              <input
                id="cmp-search-input"
                className="cmp-search__input"
                type="search"
                placeholder="Hinted search text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
              <Search className="cmp-search__right" aria-hidden />
            </div>
          </div>

          {/* Scrollable grid */}
          <div className="cmp-grid-scroll" aria-label="Competitors list (scrollable)">
            <div className="cmp-grid" role="list">
              {list.map((item, idx) => (
                <div role="listitem" key={`${item.name}-${idx}`} className="cmp-grid__item">
                  <CompetitorCard
                    item={item}
                    onOpen={() => { setSelected(item); setOpen(true); }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Modal */}
      <Modal
        open={open}
        title={selected ? selected.name : "Details"}
        onClose={() => { setOpen(false); setSelected(null); }}
      >
        {selected && (
          <div className="cmp-details">
            <div><strong>Name</strong><div>{selected.name}</div></div>
            <div><strong>Type</strong><div>{selected.type}</div></div>
            <div><strong>Rating</strong><div><StarRating value={selected.rating} /></div></div>
            <div className="cmp-details__note">
              Lightweight demo details. Wire real fields (pricing, features, region)
              when your API is ready.
            </div>
          </div>
        )}
      </Modal>

      <Footer />
    </div>
  );
}
