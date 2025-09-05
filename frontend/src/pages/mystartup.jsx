import React, { useEffect, useRef, useState } from "react";
import "../styles/mystartup.css";
import Header from "../components/Header.jsx";
import Footer from "../components/footer.jsx";

/* ===========================
   Panel
   =========================== */
function Panel({ title, children, rounded = "30px" }) {
  return (
    <section className="panel" style={{ borderRadius: rounded }}>
      <h4 className="panel__title">{title}</h4>
      {children}
    </section>
  );
}

/* ===========================
   List Item (row)
   =========================== */
function ListItem({ title, subtitle, right, badge, onClick }) {
  const isInteractive = typeof onClick === "function";

  const onKeyDown = (e) => {
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
        ? { role: "button", tabIndex: 0, "aria-label": title, onClick, onKeyDown }
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

/* ===========================
   Modal (accessible)
   =========================== */
function Modal({ open, title, children, onClose }) {
  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open && closeBtnRef.current) closeBtnRef.current.focus();
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
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="modal__panel" role="document">
        <div className="modal__header">
          <h2 id="modal-title" className="modal__title">
            {title}
          </h2>
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
   Page
   =========================== */
export default function StartupPage() {
  const startupName = "TechFlow";

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
  const [item, setItem] = useState(null);
  const [kind, setKind] = useState(""); // "investor" | "resource" | "business" | "bookmark"

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

  const renderModalBody = () => {
    if (!item) return null;
    if (kind === "investor") {
      return (
        <div className="modal-grid">
          <div>
            <strong>Name</strong>
            <div>{item.name}</div>
          </div>
          <div>
            <strong>Type</strong>
            <div>{item.type}</div>
          </div>
          <div>
            <strong>Amount</strong>
            <div>{item.amount}</div>
          </div>
          <div>
            <strong>Status</strong>
            <div>{item.status}</div>
          </div>
        </div>
      );
    }
    if (kind === "resource") {
      return (
        <div className="modal-grid">
          <div>
            <strong>Name</strong>
            <div>{item.name}</div>
          </div>
          <div>
            <strong>Provider</strong>
            <div>{item.provider}</div>
          </div>
          <div>
            <strong>Category</strong>
            <div>{item.category}</div>
          </div>
          <div>
            <strong>Value</strong>
            <div>{item.value}</div>
          </div>
        </div>
      );
    }
    if (kind === "business") {
      return (
        <div className="modal-grid">
          <div>
            <strong>Name</strong>
            <div>{item.name}</div>
          </div>
          <div>
            <strong>Location</strong>
            <div>{item.location}</div>
          </div>
          <div>
            <strong>Industry</strong>
            <div>{item.industry}</div>
          </div>
          <div>
            <strong>Employees</strong>
            <div>{item.employees}</div>
          </div>
          <div>
            <strong>Funding</strong>
            <div>{item.funding}</div>
          </div>
        </div>
      );
    }
    if (kind === "bookmark") {
      return (
        <div className="modal-grid">
          <div>
            <strong>Title</strong>
            <div>{item.title}</div>
          </div>
          <div>
            <strong>Type</strong>
            <div>{item.type}</div>
          </div>
          <div>
            <strong>Source</strong>
            <div>{item.source}</div>
          </div>
          <div>
            <strong>Date</strong>
            <div>{item.date}</div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="app">
      <Header />
      <main id="main" className="pb-12" role="main">
        <section className="hero">
          <h2 className="hero__h2">Your Startup: {startupName}</h2>
          <h3 className="hero__h3">Where do you want to start</h3>
        </section>

        {/* Primary panels */}
        <section className="grid2" aria-label="Primary panels">
          <Panel title="Saved Investors / Sponsors">
            <div className="list" role="list">
              {investors.map((it) => (
                <ListItem
                  key={it.name}
                  title={it.name}
                  subtitle={it.type}
                  right={it.amount}
                  badge={it.status}
                  onClick={() => show("investor", it)}
                />
              ))}
            </div>
          </Panel>

          <Panel title="Saved Resources / Services" rounded="44px">
            <div className="list" role="list">
              {resources.map((it) => (
                <ListItem
                  key={it.name}
                  title={it.name}
                  subtitle={`${it.provider} • ${it.category}`}
                  right={it.value}
                  onClick={() => show("resource", it)}
                />
              ))}
            </div>
          </Panel>
        </section>

        {/* Secondary panels */}
        <section className="grid2" aria-label="Secondary panels">
          <Panel title="Similar Businesses around You">
            <div className="list" role="list">
              {businesses.map((it) => (
                <ListItem
                  key={it.name}
                  title={it.name}
                  subtitle={`${it.location} • ${it.industry} • ${it.employees}`}
                  right={it.funding}
                  onClick={() => show("business", it)}
                />
              ))}
            </div>
          </Panel>

          <Panel title="Book Marked">
            <div className="list" role="list">
              {bookmarks.map((it) => (
                <ListItem
                  key={it.title}
                  title={it.title}
                  subtitle={`${it.type} • ${it.source}`}
                  right={it.date}
                  onClick={() => show("bookmark", it)}
                />
              ))}
            </div>
          </Panel>
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

      <Modal
        open={open}
        title={item ? (kind === "bookmark" ? item.title : item.name || "Details") : "Details"}
        onClose={hide}
      >
        {renderModalBody()}
      </Modal>

      <Footer />
    </div>
  );
}
