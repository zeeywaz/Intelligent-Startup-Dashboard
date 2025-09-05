// mystartup.jsx
// - Adds an accessible Modal that opens when you click any row card
// - No new dependencies
// - Simple state (selected item + type) and clean handlers

import React, { useEffect, useRef, useState } from "react";
import "../styles/mystartup.css";

/* ===========================
   Header (unchanged)
   =========================== */
function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="hdr">
      <nav className="nav" aria-label="Primary">
        <div className="nav__left">
          <button
            type="button"
            className="nav__menu-btn"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <svg
              className="icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <h1 className="brand">
            <a href="#" className="brand__link">
              Idea Forge
            </a>
          </h1>
        </div>

        <div className="nav__links">
          <a href="#" className="nav__link">About Us</a>
          <a href="#" className="nav__link">Contact</a>
        </div>

        <div className="nav__right">
          <img
            src="https://placehold.co/64x64/000000/FFFFFF?text=%F0%9F%94%94"
            alt="Notifications"
            className="notif"
            width="64"
            height="64"
          />
          <div className="avatar">
            <img
              src="https://placehold.co/99x98/FFFFFF/000000?text=%F0%9F%91%A4"
              alt="Profile"
              className="avatar__img"
              width="99"
              height="98"
            />
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="mobile-menu" role="dialog" aria-label="Mobile navigation">
          <a href="#" className="mobile-menu__link">About Us</a>
          <a href="#" className="mobile-menu__link">Contact</a>
        </div>
      )}
    </header>
  );
}

/* ===========================
   Footer (unchanged)
   =========================== */
function Footer() {
  return (
    <footer className="ftr">
      <div className="container">
        <div className="ftr__cols">
          <div className="ftr__social">
            <div className="ftr__icons" aria-label="Socials">
              <svg className="ftr_icon ftr_icon--fill" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14.2737 10.1635L23.2023 0H21.0872L13.3313 8.82305L7.14125 0H0L9.3626 13.3433L0 24H2.11504L10.3002 14.6806L16.8388 24H23.98M2.8784 1.5619H6.12769L21.0856 22.5148H17.8355" />
              </svg>
              <svg className="ftr_icon ftr_icon--fill" viewBox="0 0 25 24" aria-hidden="true">
                <path d="M12.98 2.163C16.184 2.163 16.564 2.175 17.83 2.233C21.082 2.381 22.601 3.924 22.749 7.152C22.807 8.417 22.818 8.797 22.818 12.001C22.818 15.206 22.806 15.585 22.749 16.85C22.6 20.075 21.085 21.621 17.83 21.769C16.564 21.827 16.186 21.839 12.98 21.839C9.77598 21.839 9.39598 21.827 8.13098 21.769C4.87098 21.62 3.35998 20.07 3.21198 16.849C3.15398 15.584 3.14198 15.205 3.14198 12C3.14198 8.796 3.15498 8.417 3.21198 7.151C3.36098 3.924 4.87598 2.38 8.13098 2.232C9.39698 2.175 9.77598 2.163 12.98 2.163Z" />
              </svg>
              <svg className="ftr_icon ftr_icon--fill" viewBox="0 0 25 24" aria-hidden="true">
                <path d="M20.595 3.184C16.991 2.938 8.96398 2.939 5.36498 3.184C1.46798 3.45 1.00898 5.804 0.97998 12C1.00898 18.185 1.46398 20.549 5.36498 20.816C8.96498 21.061 16.991 21.062 20.595 20.816C24.492 20.55 24.951 18.196 24.98 12C24.951 5.815 24.496 3.451 20.595 3.184ZM9.97998 16V8L17.98 11.993L9.97998 16Z" />
              </svg>
              <svg className="ftr_icon ftr_icon--fill" viewBox="0 0 25 24" aria-hidden="true">
                <path d="M19.98 0H5.97998C3.21898 0 0.97998 2.239 0.97998 5V19C0.97998 21.761 3.21898 24 5.97998 24H19.98C22.742 24 24.98 21.761 24.98 19V5Z" />
              </svg>
            </div>
          </div>

          <div className="ftr__col">
            <h5 className="ftr__title">Navigation</h5>
            <a href="#" className="ftr__link">Resources and Services</a>
            <a href="#" className="ftr__link">Other Business/ Competitors</a>
            <a href="#" className="ftr__link">Sponsors/Investors</a>
            <a href="#" className="ftr__link">My startup</a>
            <a href="#" className="ftr__link">Brainstorming</a>
          </div>

          <div className="ftr__col">
            <h5 className="ftr__title">Explore</h5>
            <a href="#" className="ftr__link">Navigation</a>
            <a href="#" className="ftr__link">Analytics</a>
            <a href="#" className="ftr__link">Collaboration features</a>
          </div>

          <div className="ftr__col">
            <h5 className="ftr__title">Resources</h5>
            <a href="#" className="ftr__link">About Us</a>
            <a href="#" className="ftr__link">Contact</a>
            <a href="#" className="ftr__link">Help Us Improve</a>
          </div>
        </div>

        <div className="ftr__contacts">
          <div className="contact">
            <svg className="contact__icon" fill="none" viewBox="0 0 40 40" aria-hidden="true">
              <path
                d="M36.6666 10c0-1.833-1.5-3.333-3.333-3.333H6.6667C4.8334 6.667 3.3334 8.167 3.3334 10V30c0 1.833 1.5 3.333 3.3333 3.333h26.6666C35.1666 33.333 36.6666 31.833 36.6666 30V10Z"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div>
              <h6 className="contact__title">Email</h6>
              <p className="contact__text">
                Reach us at:
                <br />
                <br />
                support@IDEAFORGE.com
              </p>
            </div>
          </div>

          <div className="contact">
            <svg className="contact__icon" fill="none" viewBox="0 0 40 40" aria-hidden="true">
              <path
                d="M25.083 8.333c1.628.318 3.124 1.114 4.297 2.287 1.173 1.173 1.969 2.669 2.287 4.297M36.667 28.2V33.2c0 .464-.095.923-.281 1.349a3.334 3.334 0 0 1-1.8 1.821c-.44.162-.906.218-1.368.176-5.128-.557-10.055-2.31-14.382-5.116-4.027-2.559-7.44-5.973-9.999-10"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div>
              <h6 className="contact__title">Phone</h6>
              <p className="contact__text">
                Call us anytime:
                <br />
                <br />
                +94 123456789
              </p>
            </div>
          </div>

          <div className="contact">
            <svg className="contact_icon contact_icon--solid" viewBox="0 0 40 40" aria-hidden="true" />
            <div>
              <h6 className="contact__title">Office</h6>
              <p className="contact__text">123, sample St. Colombo 10</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ===========================
   Panel Shell (unchanged)
   =========================== */
function SectionShell({ title, children, rounded = "30px" }) {
  return (
    <section className="panel" style={{ borderRadius: rounded }}>
      <h4 className="panel__title">{title}</h4>
      {children}
    </section>
  );
}

/* =========================================================
   Row (card) — already interactive via CSS classes
   Now we just pass onClick to open the modal.
   ========================================================= */
function Row({ title, subtitle, right, badge, onClick }) {
  const isInteractive = typeof onClick === "function";

  const handleKeyDown = (e) => {
    if (!isInteractive) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`row ${isInteractive ? "row--interactive" : ""}`}
      {...(isInteractive
        ? {
            role: "button",
            tabIndex: 0,
            "aria-label": title,
            onClick,
            onKeyDown: handleKeyDown,
          }
        : {})}
    >
      <div>
        <p className="row__title">{title}</p>
        {subtitle && <p className="row__sub">{subtitle}</p>}
      </div>
      <div className="row__right">
        {right && <p className="row__meta">{right}</p>}
        {badge && <span className="row__badge">{badge}</span>}
      </div>
    </div>
  );
}

/* =========================================================
   Modal component (accessible)
   - Focus trap (lightweight): focuses close button on open
   - ESC closes modal
   - Click on backdrop closes modal
   ========================================================= */
function Modal({ open, title, children, onClose }) {
  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Focus close button when opened
  useEffect(() => {
    if (open && closeBtnRef.current) {
      closeBtnRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      ref={dialogRef}
      onMouseDown={(e) => {
        // close when clicking backdrop (but NOT when clicking the panel)
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="modal__panel" role="document">
        <div className="modal__header">
          <h2 id="modal-title" className="modal__title">{title}</h2>
          <button
            type="button"
            className="modal__close"
            aria-label="Close dialog"
            onClick={onClose}
            ref={closeBtnRef}
          >
            ✕
          </button>
        </div>
        <div className="modal__body">{children}</div>
        <div className="modal__footer">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===========================
   Main Page
   =========================== */
export default function Startup() {
  const name = "TechFlow";

  const investors = [
    { name: "Venture Capital Partners", type: "VC Fund", amount: "$2M", status: "Interested" },
    { name: "Angel Investor Group", type: "Angel", amount: "$500K", status: "Meeting Scheduled" },
    { name: "Innovation Fund", type: "Corporate VC", amount: "$1.5M", status: "Under Review" },
  ];

  const resources = [
    { name: "AWS Cloud Credits", provider: "Amazon", value: "$10K", category: "Infrastructure" },
    { name: "Legal Services Package", provider: "StartupLaw", value: "$5K", category: "Legal" },
    { name: "Marketing Automation", provider: "HubSpot", value: "$3K", category: "Marketing" },
  ];

  const bookmarks = [
    { title: "How to Scale Your Startup", type: "Article", source: "TechCrunch", date: "2 days ago" },
    { title: "Fundraising Best Practices", type: "Video", source: "Y Combinator", date: "1 week ago" },
    { title: "Product-Market Fit Guide", type: "Whitepaper", source: "First Round", date: "3 days ago" },
  ];

  const businesses = [
    { name: "FlowTech Solutions", location: "San Francisco", industry: "SaaS", employees: "50-100", funding: "Series A" },
    { name: "DataStream Inc", location: "Austin", industry: "Analytics", employees: "25-50", funding: "Seed" },
    { name: "CloudBridge", location: "Seattle", industry: "Infrastructure", employees: "100-200", funding: "Series B" },
  ];

  // Modal state
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState(null); // selected object
  const [kind, setKind] = useState("");   // "investor" | "resource" | "business" | "bookmark"

  const show = (k, obj) => {
    setKind(k);
    setItem(obj);
    setOpen(true);
  };

  const hide = () => {
    setOpen(false);
    setItem(null);
    setKind("");
  };

  // Render modal content per kind
  const renderModalBody = () => {
    if (!item) return null;

    if (kind === "investor") {
      return (
        <div className="modal-grid">
          <div><strong>Name</strong><div>{item.name}</div></div>
          <div><strong>Type</strong><div>{item.type}</div></div>
          <div><strong>Amount</strong><div>{item.amount}</div></div>
          <div><strong>Status</strong><div>{item.status}</div></div>
        </div>
      );
    }
    if (kind === "resource") {
      return (
        <div className="modal-grid">
          <div><strong>Name</strong><div>{item.name}</div></div>
          <div><strong>Provider</strong><div>{item.provider}</div></div>
          <div><strong>Category</strong><div>{item.category}</div></div>
          <div><strong>Value</strong><div>{item.value}</div></div>
        </div>
      );
    }
    if (kind === "business") {
      return (
        <div className="modal-grid">
          <div><strong>Name</strong><div>{item.name}</div></div>
          <div><strong>Location</strong><div>{item.location}</div></div>
          <div><strong>Industry</strong><div>{item.industry}</div></div>
          <div><strong>Employees</strong><div>{item.employees}</div></div>
          <div><strong>Funding</strong><div>{item.funding}</div></div>
        </div>
      );
    }
    if (kind === "bookmark") {
      return (
        <div className="modal-grid">
          <div><strong>Title</strong><div>{item.title}</div></div>
          <div><strong>Type</strong><div>{item.type}</div></div>
          <div><strong>Source</strong><div>{item.source}</div></div>
          <div><strong>Date</strong><div>{item.date}</div></div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="app">
      <Header />

      <main className="pb-12" role="main">
        <section className="hero">
          <h2 className="hero__h2">Your Startup: {name}</h2>
          <h3 className="hero__h3">Where do you want to start</h3>
        </section>

        {/* Primary panels */}
        <section className="grid2" aria-label="Primary panels">
          <SectionShell title="Saved Investors / Sponsors">
            <div className="list" role="list">
              {investors.map((it) => (
                <Row
                  key={it.name}
                  title={it.name}
                  subtitle={it.type}
                  right={it.amount}
                  badge={it.status}
                  onClick={() => show("investor", it)}
                />
              ))}
            </div>
          </SectionShell>

          <SectionShell title="Saved Resources / Services" rounded="44px">
            <div className="list" role="list">
              {resources.map((it) => (
                <Row
                  key={it.name}
                  title={it.name}
                  subtitle={'${it.provider} • ${it.category}'}
                  right={it.value}
                  onClick={() => show("resource", it)}
                />
              ))}
            </div>
          </SectionShell>
        </section>

        {/* Secondary panels */}
        <section className="grid2" aria-label="Secondary panels">
          <SectionShell title="Similar Businesses around You">
            <div className="list" role="list">
              {businesses.map((it) => (
                <Row
                  key={it.name}
                  title={it.name}
                  subtitle={'${it.location} • ${it.industry} • ${it.employees}'}
                  right={it.funding}
                  onClick={() => show("business", it)}
                />
              ))}
            </div>
          </SectionShell>

          <SectionShell title="Book Marked">
            <div className="list" role="list">
              {bookmarks.map((it) => (
                <Row
                  key={it.title}
                  title={it.title}
                  subtitle={'${it.type} • ${it.source}'}
                  right={it.date}
                  onClick={() => show("bookmark", it)}
                />
              ))}
            </div>
          </SectionShell>
        </section>

        {/* Page actions */}
        <div className="actions">
          <button type="button" className="btn" onClick={() => window.alert("Change Idea clicked")}>
            Change Idea
          </button>
          <button type="button" className="btn" onClick={() => window.history.back()}>
            Back
          </button>
        </div>
      </main>

      {/* Modal */}
      <Modal
        open={open}
        title={
          item
            ? (kind === "bookmark" ? item.title : item.name || "Details")
            : "Details"
        }
        onClose={hide}
      >
        {renderModalBody()}
      </Modal>

      <Footer />
    </div>
  );
}