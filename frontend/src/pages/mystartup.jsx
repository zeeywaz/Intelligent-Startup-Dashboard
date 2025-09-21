import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/mystartup.css";
import Header from "../components/Header.jsx";
import Footer from "../components/footer.jsx";

// Centralize your API base (align with the chatbot page)
const API_BASE =
  import.meta?.env?.VITE_API_BASE ||
  process.env.REACT_APP_API_BASE ||
  "http://127.0.0.1:8000";

/* ===========================
   Small helpers
   =========================== */
function normalizeToArray(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}
function useDots(isRunning) {
  const [dots, setDots] = useState("");
  useEffect(() => {
    if (!isRunning) return setDots("");
    const t = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 350);
    return () => clearInterval(t);
  }, [isRunning]);
  return dots;
}

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
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
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
      onMouseDown={(e) => { if (e.target === dialogRef.current) onClose(); }}
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
          <button type="button" className="btn btn--ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ===========================
   Tiny Loader (GPT-ish thinking)
   =========================== */
function Thinking({ label = "Thinking" }) {
  const dots = useDots(true);
  return <p className="thinking">{label}{dots}</p>;
}

/* ===========================
   Page
   =========================== */
export default function StartupPage() {
  const navigate = useNavigate();
  const startupName = "TechFlow";

  // data
  const [investors, setInvestors] = useState([]);
  const [resources, setResources] = useState([]);
  const [competitors, setCompetitors] = useState([]);

  // loading + error
  const [loadingInv, setLoadingInv] = useState(false);
  const [loadingRes, setLoadingRes] = useState(false);
  const [loadingComp, setLoadingComp] = useState(false);
  const [errInv, setErrInv] = useState("");
  const [errRes, setErrRes] = useState("");
  const [errComp, setErrComp] = useState("");

  // fetch: competitors
  useEffect(() => {
    (async () => {
      try {
        setLoadingComp(true);
        setErrComp("");
        const res = await fetch(`${API_BASE}/api/competitors/`, { credentials: "include" });
        const data = await res.json();
        setCompetitors(normalizeToArray(data));
      } catch (e) {
        console.error("Fetch error (competitors):", e);
        setErrComp("Failed to load competitors.");
        setCompetitors([]);
      } finally {
        setLoadingComp(false);
      }
    })();
  }, []);

  // fetch: investors (if you have this endpoint; else it stays empty gracefully)
  useEffect(() => {
    (async () => {
      try {
        setLoadingInv(true);
        setErrInv("");
        const res = await fetch(`${API_BASE}/api/investors/`, { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setInvestors(normalizeToArray(data));
      } catch (e) {
        console.warn("Fetch error (investors):", e.message || e);
        setErrInv("No investor endpoint or failed to load.");
        setInvestors([]);
      } finally {
        setLoadingInv(false);
      }
    })();
  }, []);

  // fetch: resources
  useEffect(() => {
    (async () => {
      try {
        setLoadingRes(true);
        setErrRes("");
        const res = await fetch(`${API_BASE}/api/resources/?limit=50`, { credentials: "include" });
        const data = await res.json();
        setResources(normalizeToArray(data));
      } catch (e) {
        console.error("Fetch error (resources):", e);
        setErrRes("Failed to load resources.");
        setResources([]);
      } finally {
        setLoadingRes(false);
      }
    })();
  }, []);

  const bookmarks = [
    { title: "How to Scale Your Startup", type: "Article", source: "TechCrunch", date: "2 days ago" },
    { title: "Fundraising Best Practices", type: "Video", source: "Y Combinator", date: "1 week ago" },
    { title: "Product-Market Fit Guide", type: "Whitepaper", source: "First Round", date: "3 days ago" },
  ];

  // Modal state
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState(null);
  const [kind, setKind] = useState(""); // "investor" | "resource" | "business" | "bookmark"

  const show = (k, obj) => { setKind(k); setItem(obj); setOpen(true); };
  const hide = () => { setOpen(false); setItem(null); setKind(""); };

  const renderModalBody = () => {
    if (!item) return null;

    // Match your serializers/models
    if (kind === "investor") {
      return (
        <div className="modal-grid">
          <div><strong>Name</strong><div>{item.investor_name || item.name}</div></div>
          <div><strong>Company</strong><div>{item.company_name || item.company || "—"}</div></div>
          <div><strong>Credit Score</strong><div>{item.credit_score ?? "—"}</div></div>
          <div><strong>Status</strong><div>{item.verification_status || "—"}</div></div>
        </div>
      );
    }
    if (kind === "resource") {
      return (
        <div className="modal-grid">
          <div><strong>Name</strong><div>{item.name}</div></div>
          <div><strong>Type</strong><div>{item.type || "—"}</div></div>
          <div><strong>Location</strong><div>{item.location || "—"}</div></div>
          <div><strong>Website</strong><div>{item.website ? <a href={item.website} target="_blank" rel="noreferrer">{item.website}</a> : "—"}</div></div>
          <div><strong>Description</strong><div>{item.description || "—"}</div></div>
        </div>
      );
    }
    if (kind === "business") {
      return (
        <div className="modal-grid">
          <div><strong>Name</strong><div>{item.name}</div></div>
          <div><strong>Strength</strong><div>{item.strength || "—"}</div></div>
          <div><strong>Website</strong><div>{item.website ? <a href={item.website} target="_blank" rel="noreferrer">{item.website}</a> : "—"}</div></div>
          <div><strong>Description</strong><div>{item.description || "—"}</div></div>
          <div><strong>Category</strong><div>{item?.category?.name || "—"}</div></div>
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
    <>
      {/* Keep header OUTSIDE the scoped wrapper so its size stays consistent */}
      <Header />

      <div className="startup-app">
        <main id="main" className="pb-12" role="main">
          <section className="hero">
            <h2 className="hero__h2">Your Startup: {startupName}</h2>
            <h3 className="hero__h3">Where do you want to start</h3>
          </section>

          {/* Primary panels */}
          <section className="grid2" aria-label="Primary panels">
            <Panel title="Recommended Investors">
              {loadingInv && <Thinking label="Finding investors" />}
              {errInv && <p className="err">{errInv}</p>}
              {!loadingInv && !errInv && investors.length === 0 && (
                <p className="muted">No investors to show.</p>
              )}
              {!loadingInv && !errInv && investors.length > 0 && (
                <div className="list" role="list">
                  {investors.map((it) => (
                    <ListItem
                      key={it.investor_id || it.id || it.investor_name}
                      title={it.investor_name || it.name}
                      subtitle={it.company_name || it.company || ""}
                      right={typeof it.credit_score !== "undefined" ? `Score: ${it.credit_score}` : ""}
                      badge={it.verification_status}
                      onClick={() => show("investor", it)}
                    />
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Recommended Resources & Services" rounded="44px">
              {loadingRes && <Thinking label="Gathering resources" />}
              {errRes && <p className="err">{errRes}</p>}
              {!loadingRes && !errRes && resources.length === 0 && (
                <p className="muted">No resources found.</p>
              )}
              {!loadingRes && !errRes && resources.length > 0 && (
                <div className="list scrollable" role="list">
                  {resources.map((it) => (
                    <ListItem
                      key={it.resource_id || it.name}
                      title={it.name}
                      subtitle={[it.type, it.location].filter(Boolean).join(" • ")}
                      right={it.website}
                      onClick={() => show("resource", it)}
                    />
                  ))}
                </div>
              )}
            </Panel>
          </section>

          {/* Secondary panels */}
          <section className="grid2" aria-label="Secondary panels">
            <Panel title="Similar Businesses around You" rounded="30px">
              {loadingComp && <Thinking label="Scanning similar businesses" />}
              {errComp && <p className="err">{errComp}</p>}
              {!loadingComp && !errComp && competitors.length === 0 && (
                <p className="muted">No competitors listed yet.</p>
              )}
              {!loadingComp && !errComp && competitors.length > 0 && (
                <div className="list scrollable" role="list">
                  {competitors.map((it) => (
                    <ListItem
                      key={it.id || it.name}
                      title={it.name}
                      subtitle={[it.description, it.strength].filter(Boolean).join(" • ")}
                      right={it.website}
                      onClick={() => show("business", it)}
                    />
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Bookmarked">
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
            <button
              type="button"
              className="btn"
              onClick={() => navigate("/chatbot")}
            >
              Change Idea
            </button>

            <button
              type="button"
              className="btn"
              onClick={() => window.history.back()}
            >
              Back
            </button>
          </div>
        </main>

        <Modal
          open={open}
          title={
            item
              ? (kind === "bookmark" ? item.title : item.name || item.investor_name || "Details")
              : "Details"
          }
          onClose={hide}
        >
          {renderModalBody()}
        </Modal>
      </div>

      {/* Keep footer outside too */}
      <Footer />
    </>
  );
}
