import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/resources.css";
import Header from "../components/Header.jsx";
import Footer from "../components/footer.jsx";

/** Card data  */
const CATALOG = [
  { id: "warehouses", title: "Warehouses", blurb: "Find out possible locations to store your physical goods.", mark: "W" },
  { id: "wholesalers", title: "Wholesalers", blurb: "Find sources to get your goods from.", mark: "W" },
  { id: "offices", title: "Office Spaces", blurb: "Organize and track your startup tasks efficiently with meetings.", mark: "O" },
  { id: "transport", title: "Transport services", blurb: "Deliver your goods from one location to another without delays.", mark: "T" },
  { id: "security", title: "Security services", blurb: "Make sure your store is secure.", mark: "S" },
  { id: "saas", title: "SAAS", blurb: "Utilize software solutions to enhance your business operations.", mark: "S" },
];

/** backend type */
const TYPE_MAP = {
  warehouses: "WAREHOUSE",
  wholesalers: "WHOLESALE",
  offices: "OFFICE",
  transport: "TRANSPORT",
  security: "SECURITY",
  saas: "SAAS",
};

export default function ResourcesPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CATALOG;
    return CATALOG.filter(
      (x) =>
        x.title.toLowerCase().includes(q) ||
        x.blurb.toLowerCase().includes(q) ||
        x.id.toLowerCase().includes(q)
    );
  }, [query]);

  const goExplore = (slug) => {
    const type = TYPE_MAP[slug] || "WAREHOUSE";
    // Opens the directory page filtered by this type
    navigate(`/resources/directory?type=${encodeURIComponent(type)}`);
  };

  return (
    <div className="rs-app">
      <Header />

      <main id="main" className="rs-main" role="main">
        <header className="rs-hero">
          <h1 className="rs-title">Resources &amp; Services</h1>
          <p className="rs-subtitle">
            Find helpful tools, guides, and services to boost your startup journey.
          </p>

          <div className="rs-search" role="search">
            <button type="button" className="rs-search__btn" aria-label="Open search filters">
              <span aria-hidden>≡</span>
            </button>
            <input
              className="rs-search__input"
              placeholder="Hinted search text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span className="rs-search__icon" aria-hidden>🔍</span>
          </div>
        </header>

        <section className="rs-grid" aria-label="Resource categories">
          {items.length === 0 ? (
            <p className="rs-empty">No results for “{query}”. Try a different search.</p>
          ) : (
            items.map((x) => (
              <article key={x.id} className="rs-card">
                <div className="rs-card__mark" aria-hidden>{x.mark}</div>
                <h3 className="rs-card__title">{x.title}</h3>
                <p className="rs-card__text">{x.blurb}</p>
                <div className="rs-card__actions">
                  <button
                    type="button"
                    className="rs-btn"
                    onClick={() => goExplore(x.id)}
                    aria-label={`Explore ${x.title}`}
                  >
                    Explore
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
