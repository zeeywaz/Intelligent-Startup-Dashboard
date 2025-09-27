import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/mystartup.css";
import Header from "../components/Header.jsx";
import Footer from "../components/footer.jsx";

const API_BASE =
  import.meta?.env?.VITE_API_BASE ||
  process.env.REACT_APP_API_BASE ||
  "http://127.0.0.1:8000";

/* =========================== Helpers =========================== */
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

function Panel({ title, children, rounded = "30px" }) {
  return (
    <section className="panel" style={{ borderRadius: rounded }}>
      <h4 className="panel__title">{title}</h4>
      {children}
    </section>
  );
}

/* =========================== Row with Bookmark =========================== */
function ListItem({ title, subtitle, right, badge, onClick, onBookmark, bookmarked }) {
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
        <button
          type="button"
          className={`bookmark-btn ${bookmarked ? "active" : ""}`}
          aria-label="Bookmark"
          onClick={(e) => { e.stopPropagation(); onBookmark?.(); }}
        >
          {bookmarked ? "🔖" : "📑"}
        </button>
      </div>
    </div>
  );
}

/* =========================== Modal =========================== */
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

function Thinking({ label = "Thinking" }) {
  const dots = useDots(true);
  return <p className="thinking">{label}{dots}</p>;
}

/* =========================== Page =========================== */
export default function StartupPage() {
  const navigate = useNavigate();

  const [idea, setIdea] = useState(null);
  const [investors, setInvestors] = useState([]);
  const [resources, setResources] = useState([]);
  const [competitors, setCompetitors] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [open, setOpen] = useState(false);
  const [item, setItem] = useState(null);
  const [kind, setKind] = useState("");

  const show = (k, obj) => { setKind(k); setItem(obj); setOpen(true); };
  const hide = () => { setOpen(false); setItem(null); setKind(""); };

  // toggle bookmark
  const toggleBookmark = (obj, kind) => {
    const key = `${kind}-${obj.id || obj.resource_id || obj.name}`;
    if (bookmarks.find((b) => b.key === key)) {
      setBookmarks(bookmarks.filter((b) => b.key !== key));
    } else {
      setBookmarks([...bookmarks, { key, kind, obj }]);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");

        // get latest idea
        const resIdeas = await fetch(`${API_BASE}/api/ideas/mine/`, {
          credentials: "include",
        });
        const ideaList = await resIdeas.json();
        if (!Array.isArray(ideaList) || ideaList.length === 0) {
          setErr("You don’t have any saved ideas yet.");
          return;
        }
        const latestIdea = ideaList[0];
        setIdea(latestIdea);

        // fetch data
        const res = await fetch(`${API_BASE}/api/mystartup/${latestIdea.idea_id}/`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // sort investors: priority first
        const sortedInvestors = (data.investors || []).sort(
          (a, b) => (b.priority === true) - (a.priority === true)
        );

        setCompetitors(data.competitors || []);
        setResources(data.resources || []);
        setInvestors(sortedInvestors);
      } catch (e) {
        console.error("Fetch error:", e);
        setErr("Failed to load startup data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // render modal
  const renderModalBody = () => {
    if (!item) return null;
    if (kind === "investor") {
      return (
        <div className="modal-grid">
          <div><strong>Company</strong><div>{item.company || "—"}</div></div>
          <div><strong>Role</strong><div>{item.role || "—"}</div></div>
          <div><strong>Phone</strong><div>{item.phone || "—"}</div></div>
          <div><strong>Email</strong><div>{item.email || "—"}</div></div>
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
    return null;
  };

  return (
    <>
      <Header />

      <div className="startup-app">
        <main id="main" className="pb-12" role="main">
          <section className="hero">
            <h2 className="hero__h2">Your Startup: {idea ? idea.title : "Loading..."}</h2>
            <h3 className="hero__h3">Where do you want to start</h3>
          </section>

          {loading && <Thinking label="Loading startup data" />}
          {err && <p className="err">{err}</p>}

          {!loading && !err && (
            <>
              <section className="grid2" aria-label="Primary panels">
                <Panel title="Recommended Investors">
                  {investors.length === 0 ? (
                    <p className="muted">No investors to show.</p>
                  ) : (
                    <div className="list" role="list">
                      {investors.map((it) => {
                        const key = `investor-${it.id}`;
                        return (
                          <ListItem
                            key={key}
                            title={it.company || "Investor"}
                            subtitle={it.role || ""}
                            right={it.email}
                            onClick={() => show("investor", it)}
                            onBookmark={() => toggleBookmark(it, "investor")}
                            bookmarked={!!bookmarks.find((b) => b.key === key)}
                          />
                        );
                      })}
                    </div>
                  )}
                </Panel>

                <Panel title="Recommended Resources & Services" rounded="44px">
                  {resources.length === 0 ? (
                    <p className="muted">No resources found.</p>
                  ) : (
                    <div className="list scrollable" role="list">
                      {resources.map((it) => {
                        const key = `resource-${it.resource_id}`;
                        return (
                          <ListItem
                            key={key}
                            title={it.name}
                            subtitle={[it.type, it.location].filter(Boolean).join(" • ")}
                            right={it.website}
                            onClick={() => show("resource", it)}
                            onBookmark={() => toggleBookmark(it, "resource")}
                            bookmarked={!!bookmarks.find((b) => b.key === key)}
                          />
                        );
                      })}
                    </div>
                  )}
                </Panel>
              </section>

              <section className="grid2" aria-label="Secondary panels">
                <Panel title="Similar Businesses around You" rounded="30px">
                  {competitors.length === 0 ? (
                    <p className="muted">No competitors listed yet.</p>
                  ) : (
                    <div className="list scrollable" role="list">
                      {competitors.map((it) => {
                        const key = `competitor-${it.id}`;
                        return (
                          <ListItem
                            key={key}
                            title={it.name}
                            subtitle={[it.description, it.strength].filter(Boolean).join(" • ")}
                            right={it.website}
                            onClick={() => show("business", it)}
                            onBookmark={() => toggleBookmark(it, "competitor")}
                            bookmarked={!!bookmarks.find((b) => b.key === key)}
                          />
                        );
                      })}
                    </div>
                  )}
                </Panel>

                <Panel title="Bookmarked">
                  {bookmarks.length === 0 ? (
                    <p className="muted">No bookmarks yet.</p>
                  ) : (
                    <div className="list" role="list">
                      {bookmarks.map((bm) => (
                        <ListItem
                          key={bm.key}
                          title={
                            bm.kind === "investor"
                              ? bm.obj.company || "Investor"
                              : bm.obj.name
                          }
                          subtitle={
                            bm.kind === "investor"
                              ? bm.obj.role
                              : bm.obj.location || bm.obj.description
                          }
                          right={bm.kind === "investor" ? bm.obj.email : bm.obj.website}
                          onClick={() => show(bm.kind, bm.obj)}
                          onBookmark={() => toggleBookmark(bm.obj, bm.kind)}
                          bookmarked
                        />
                      ))}
                    </div>
                  )}
                </Panel>
              </section>

              <div className="actions">
                <button type="button" className="btn" onClick={() => navigate("/chatbot")}>
                  Change Idea
                </button>
                <button type="button" className="btn" onClick={() => window.history.back()}>
                  Back
                </button>
              </div>
            </>
          )}
        </main>

        <Modal
          open={open}
          title={item ? (item.name || item.company || "Details") : "Details"}
          onClose={hide}
        >
          {renderModalBody()}
        </Modal>
      </div>

      <Footer />
    </>
  );
}
