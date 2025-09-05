import React, { useMemo, useState } from "react";
import "../styles/investors.css";
import Header from "../components/Header.jsx";
import Footer from "../components/footer.jsx";
import { Search } from "lucide-react";

/* Reusable: Investor card */
function InvestorCard({ item }) {
  return (
    <article className="inv-card" role="article" aria-label={`Investor ${item.name}`}>
      <img
        src={item.avatar}
        alt={`${item.name} avatar`}
        className="inv-card__avatar"
        width="72"
        height="72"
      />
      <div className="inv-card__body">
        <h3 className="inv-card__title">{item.name}</h3>
        <p className="inv-card__line">
          <span className="inv-card__label">Phone:</span>{" "}
          <a href={`tel:${item.phone.replace(/\s+/g, "")}`} className="inv-link">
            {item.phone}
          </a>
        </p>
        <p className="inv-card__line">
          <span className="inv-card__label">Email:</span>{" "}
          <a href={`mailto:${item.email}`} className="inv-link">
            {item.email}
          </a>
        </p>
        <p className="inv-card__line">
          <span className="inv-card__label">Website:</span>{" "}
          <a href={item.website} target="_blank" rel="noopener noreferrer" className="inv-link">
            {item.website.replace(/^https?:\/\//, "")}
          </a>
        </p>
        <p className="inv-card__line">
          <span className="inv-card__label">Rating:</span> {item.rating ?? "—"}
        </p>
      </div>
    </article>
  );
}

/* Page */
export default function InvestorsPage() {
  const [query, setQuery] = useState("");

  const data = [
    {
      name: "Investor Name",
      phone: "123 456 678",
      email: "john@email.com",
      website: "https://john.com",
      rating: "",
      avatar: "https://placehold.co/72x72/7091E6/ffffff?text=%F0%9F%A6%85",
    },
    {
      name: "Alpha Capital",
      phone: "123 456 678",
      email: "alpha@capital.com",
      website: "https://alpha.capital",
      rating: "",
      avatar: "https://placehold.co/72x72/ADBBDA/000?text=%F0%9F%A6%85",
    },
    {
      name: "Sequoia Angels",
      phone: "123 456 678",
      email: "hello@sequoia.angels",
      website: "https://sequoia.angels",
      rating: "",
      avatar: "https://placehold.co/72x72/8697C4/ffffff?text=%F0%9F%A6%85",
    },
    {
      name: "Nova Ventures",
      phone: "123 456 678",
      email: "contact@novaventures.io",
      website: "https://novaventures.io",
      rating: "",
      avatar: "https://placehold.co/72x72/EDE8F5/000?text=%F0%9F%A6%85",
    },
    {
      name: "Orbit Partners",
      phone: "123 456 678",
      email: "team@orbit.vc",
      website: "https://orbit.vc",
      rating: "",
      avatar: "https://placehold.co/72x72/3D52A0/ffffff?text=%F0%9F%A6%85",
    },
    {
      name: "Catalyst Fund",
      phone: "123 456 678",
      email: "hi@catalyst.fund",
      website: "https://catalyst.fund",
      rating: "",
      avatar: "https://placehold.co/72x72/7091E6/ffffff?text=%F0%9F%A6%85",
    },
    /* NEW three cards */
    {
      name: "Horizon Equity",
      phone: "123 456 678",
      email: "contact@horizonequity.com",
      website: "https://horizonequity.com",
      rating: "",
      avatar: "https://placehold.co/72x72/ADBBDA/000?text=%F0%9F%A6%85",
    },
    {
      name: "BluePeak Capital",
      phone: "123 456 678",
      email: "hello@bluepeak.capital",
      website: "https://bluepeak.capital",
      rating: "",
      avatar: "https://placehold.co/72x72/8697C4/ffffff?text=%F0%9F%A6%85",
    },
    {
      name: "Meridian Angels",
      phone: "123 456 678",
      email: "team@meridianangels.com",
      website: "https://meridianangels.com",
      rating: "",
      avatar: "https://placehold.co/72x72/3D52A0/ffffff?text=%F0%9F%A6%85",
    },
  ];

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((x) =>
      [x.name, x.email, x.website].some((f) => f.toLowerCase().includes(q))
    );
  }, [query]);

  return (
    <div className="inv-app">
      <Header />

      <main id="main" className="inv-main" role="main">
        {/* Search */}
        <section className="inv-search" aria-label="Search investors">
          <label htmlFor="investor-search" className="sr-only">
            Search investors
          </label>
          <input
            id="investor-search"
            className="inv-search__input"
            type="search"
            placeholder="Search investors, emails, or websites…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          <Search className="inv-search__icon" aria-hidden />
        </section>

        {/* Scrollable grid */}
        <section
          className="inv-grid-scroll"
          aria-label="Investors list (scrollable)"
        >
          <div className="inv-grid" role="list">
            {list.map((item) => (
              <div role="listitem" key={`${item.name}-${item.email}`} className="inv-grid__item">
                <InvestorCard item={item} />
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
