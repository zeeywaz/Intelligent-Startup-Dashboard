// src/pages/admindashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/footer";
import "../styles/admin_dashboard.css";
import {
  Boxes,
  Store,
  BrainCircuit,
  Wallet,
  FileText,
  Download,
  Clock,
  Activity,
  X,
  Search,
  WrapText,
  Clipboard,
  Check,
} from "lucide-react";
import { API_BASE } from "../lib/api";

export default function AdminDashboard() {
  const [name, setName] = useState("");

  // users & picker
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState(null);

  // sessions
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);

  // modal state
  const [open, setOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [downHref, setDownHref] = useState("");

  // parsed events of opened session
  const [events, setEvents] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [filter, setFilter] = useState("");

  // JSON viewer settings
  const [wrapJSON, setWrapJSON] = useState(false);
  const [copied, setCopied] = useState(false);

  // greet
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/me/`, { credentials: "include" });
        const j = await r.json().catch(() => ({}));
        const uname = (j?.user?.username || j?.user?.firstName || "").trim();
        if (uname) localStorage.setItem("if_name", uname);
        setName(uname || localStorage.getItem("if_name") || "");
      } catch {
        setName(localStorage.getItem("if_name") || "");
      }
    })();
  }, []);

  // load users so admin can select whose sessions to view
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/admin/users/`, { credentials: "include" });
        if (!r.ok) throw new Error(await r.text());
        const data = await r.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("users load failed", e);
        setUsers([]);
      }
    })();
  }, []);

  const filteredUsers = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users.slice(0, 30);
    return users
      .filter((u) =>
        (u.email || "").toLowerCase().includes(s) ||
        (`${u.first_name || ""} ${u.last_name || ""}`.trim().toLowerCase().includes(s)) ||
        (u.username || "").toLowerCase().includes(s) ||
        String(u.id || "").includes(s)
      )
      .slice(0, 30);
  }, [users, q]);

  const chooseUser = (u) => {
    setPicked(u);
    setSessions([]);
  };

  const loadSessions = async () => {
    if (!picked?.id) return;
    setLoading(true);
    try {
      const r = await fetch(
        `${API_BASE}/api/admin/audit/sessions/?user_id=${picked.id}`,
        { credentials: "include" }
      );
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      setSessions(j?.sessions || []);
    } catch (e) {
      console.error(e);
      setSessions([]);
      alert("Could not load audit sessions. Check server logs.");
    } finally {
      setLoading(false);
    }
  };

  // ---- normalizer to support both flat and nested (event/actor) payloads
  const normalizeEvent = (raw) => {
    if (!raw || typeof raw !== "object") return null;

    const ev = raw.event || {};
    const ac = raw.actor || {};

    const action = raw.action ?? ev.action ?? "event";
    const model = raw.model ?? raw.entity ?? ev.model ?? "";
    const entity = raw.entity ?? model;
    const object_id = raw.object_id ?? ev.pk ?? raw.pk ?? null;

    const ip = raw.ip ?? ev.remote_addr ?? raw.remote_addr ?? null;
    const path = raw.path ?? ev.path ?? null;
    const method = raw.method ?? ev.method ?? null;

    const actor_id = raw.actor_id ?? ac.auth_user_id ?? raw.admin_id ?? null;
    const actor_username = raw.actor_username ?? ac.username ?? raw.username ?? null;

    const ts = raw.ts || raw.timestamp || raw.time || null;

    return {
      ts,
      action,
      model,
      entity,
      object_id,
      ip,
      path,
      method,
      actor_id,
      actor_username,
      __raw: raw, // keep original for right-pane JSON
    };
  };

  const openSession = async (sessionKey) => {
    if (!picked?.id || !sessionKey) return;
    setModalTitle(
      `Audit — ${picked.email || picked.username || picked.first_name || "User"} — ${sessionKey}`
    );
    setDownHref(`${API_BASE}/api/admin/audit/sessions/${picked.id}/${sessionKey}/`);
    setEvents([]);
    setActiveIdx(0);
    setFilter("");
    setOpen(true);
    setWrapJSON(false);
    setCopied(false);

    try {
      const r = await fetch(
        `${API_BASE}/api/admin/audit/sessions/${picked.id}/${sessionKey}/`,
        { credentials: "include" }
      );
      if (!r.ok) throw new Error(await r.text());
      const txt = await r.text();
      const lines = txt.split(/\r?\n/).filter(Boolean);

      const parsed = [];
      for (const ln of lines) {
        try {
          const raw = JSON.parse(ln);
          const norm = normalizeEvent(raw);
          if (norm) parsed.push(norm);
        } catch {
          // ignore malformed lines
        }
      }
      parsed.sort((a, b) => (b.ts || "").localeCompare(a.ts || ""));
      setEvents(parsed);
    } catch (e) {
      console.error(e);
      alert("Could not open session log.");
    }
  };

  const summary = useMemo(() => {
    const map = {};
    for (const e of events) map[e.action || "event"] = (map[e.action || "event"] || 0) + 1;
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [events]);

  const shown = useMemo(() => {
    const s = filter.trim().toLowerCase();
    if (!s) return events;
    return events.filter((e) =>
      (e.action || "").toLowerCase().includes(s) ||
      (e.entity || e.model || "").toLowerCase().includes(s) ||
      (e.path || "").toLowerCase().includes(s) ||
      (e.actor_username || "").toLowerCase().includes(s) ||
      String(e.actor_id || "").includes(s)
    );
  }, [events, filter]);

  const active = shown[activeIdx] || null;

  const copyJSON = async () => {
    try {
      const json = JSON.stringify((active?.__raw || active) ?? {}, null, 2);
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <Header />
      <div className="ad-app">
        <div className="container">
          {/* Welcome */}
          <div className="ad-welcome">
            <h2>Welcome, {name || "there"} <span aria-hidden>👋</span></h2>
            <p>Admin Dashboard — Manage resources, competitors, users, and audits.</p>
          </div>

          {/* Cards row */}
          <div className="ad-cards">
            <div className="ad-card" onClick={() => (window.location.href = "/resources")}>
              <Boxes className="ad-card__icon" />
              <div className="ad-card__label">Edit Resource &amp; Services</div>
            </div>
            <div className="ad-card" onClick={() => (window.location.href = "/competitors")}>
              <Store className="ad-card__icon" />
              <div className="ad-card__label">Edit Other Business &amp; Competitors</div>
            </div>
            <div className="ad-card" onClick={() => (window.location.href = "/investors")}>
              <Wallet className="ad-card__icon" />
              <div className="ad-card__label">Edit Sponsors and Investors</div>
            </div>
            <div className="ad-card" onClick={() => (window.location.href = "/admin_user")}>
              <BrainCircuit className="ad-card__icon" />
              <div className="ad-card__label">User Management</div>
            </div>
          </div>

          {/* Audit Sessions Panel */}
          <section className="ad-panel">
            <div className="ad-panel__bar">
              <h3 className="ad-panel__title">Audit Sessions</h3>
              <div className="aud-picker">
                <div className="aud-searchwrap">
                  <Search size={16} aria-hidden />
                  <input
                    className="aud-search"
                    placeholder="Search user by email, name, username, or ID"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
                <div className="aud-results">
                  {filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      className={`aud-result ${picked?.id === u.id ? "is-active" : ""}`}
                      onClick={() => chooseUser(u)}
                      title={u.email}
                    >
                      <span className="aud-result__name">
                        {(u.first_name || u.last_name)
                          ? `${u.first_name || ""} ${u.last_name || ""}`.trim()
                          : (u.username || u.email)}
                      </span>
                      <span className="aud-result__sub">#{u.id} • {u.email || u.username}</span>
                    </button>
                  ))}
                </div>
                <button className="ad-btn ad-btn--primary" onClick={loadSessions} disabled={!picked || loading}>
                  {loading ? "Loading…" : "Load Sessions"}
                </button>
              </div>
            </div>

            <div className="aud-grid">
              {!picked && <div className="aud-empty">Pick a user to see session files.</div>}

              {picked && !loading && sessions.length === 0 && (
                <div className="aud-empty">No sessions found for this user.</div>
              )}

              {sessions.map((s) => (
                <div key={s.session_key} className="aud-card aud-card--center" onClick={() => openSession(s.session_key)}>
                  <div className="aud-card__icon"><FileText size={22} /></div>
                  <div className="aud-card__title">{s.session_key}</div>
                  <div className="aud-card__meta">
                    <span><Clock size={14} /> {new Date(s.modified).toLocaleString()}</span>
                    <span><Activity size={14} /> {Math.max(1, Math.round((s.bytes || 0) / 1024))} KB</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Session Viewer Modal */}
      {open && (
        <div className="aud-modal" role="dialog" aria-modal="true" aria-label="Audit session">
          <div className="aud-modal__panel">
            <div className="aud-modal__head">
              <h4 className="aud-modal__title">{modalTitle}</h4>
              <div className="aud-modal__tools">
                <a className="ad-btn ad-btn--ghost" href={downHref} target="_blank" rel="noopener noreferrer">
                  <Download size={16} /> Download JSONL
                </a>
                <button className="ad-btn" onClick={() => setOpen(false)} aria-label="Close modal">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="aud-modal__body">
              {/* Left: filters + list (independent vertical scroll) */}
              <div className="aud-left">
                <div className="aud-filters aud-filters--sticky">
                  <div className="aud-chips">
                    {summary.map(([k, v]) => (
                      <button
                        key={k}
                        className={`aud-chip ${filter === k ? "is-active" : ""}`}
                        onClick={() => { setFilter(filter === k ? "" : k); setActiveIdx(0); }}
                      >
                        {k} <b>{v}</b>
                      </button>
                    ))}
                  </div>
                  <div className="aud-searchwrap small">
                    <Search size={14} aria-hidden />
                    <input
                      className="aud-search"
                      placeholder="Filter events by action, entity, path, actor…"
                      value={filter}
                      onChange={(e) => { setFilter(e.target.value); setActiveIdx(0); }}
                    />
                  </div>
                </div>

                <div className="aud-list">
                  {shown.length === 0 ? (
                    <div className="aud-empty small">No events match your filter.</div>
                  ) : (
                    shown.map((e, i) => {
                      const isActive = i === activeIdx;
                      return (
                        <button
                          key={`${e.ts || "t"}-${i}`}
                          className={`aud-item ${isActive ? "is-active" : ""}`}
                          onClick={() => setActiveIdx(i)}
                          title={e.path || ""}
                        >
                          <div className="aud-item__top">
                            <span className="aud-item__time">
                              {e.ts ? new Date(e.ts).toLocaleString() : "-"}
                            </span>
                            <span className="aud-item__action">{e.action || "event"}</span>
                          </div>
                          <div className="aud-item__sub">
                            {(e.entity || e.model || "—")} #{e.object_id ?? e.object_pk ?? "—"}
                          </div>
                          <div className="aud-item__meta">
                            {(e.actor_username || e.actor_id) ? `by ${e.actor_username || `#${e.actor_id}`}` : ""}
                            {e.ip ? ` • ${e.ip}` : ""}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right: JSON viewer (independent scroll + horizontal scroll) */}
              <div className="aud-right">
                {!active ? (
                  <div className="aud-empty small">Pick an event to view details.</div>
                ) : (
                  <>
                    <div className="aud-detail-head">
                      <div className="aud-detail-title">
                        <span className="aud-badge">{active.action || "event"}</span>
                        <strong>
                          {(active.entity || active.model || "—")} #
                          {active.object_id ?? active.object_pk ?? "—"}
                        </strong>
                      </div>
                      <div className="aud-detail-sub">
                        {active.method || ""} {active.path || ""} {active.ip ? `• ${active.ip}` : ""}
                      </div>
                    </div>

                    <div className="aud-json">
                      <div className="aud-json-toolbar">
                        <button
                          className={`ad-btn ${wrapJSON ? "ad-btn--primary" : ""}`}
                          onClick={() => setWrapJSON((w) => !w)}
                          title="Toggle line wrap"
                        >
                          <WrapText size={16} /> {wrapJSON ? "Wrap On" : "Wrap Off"}
                        </button>
                        <button className="ad-btn" onClick={copyJSON} title="Copy JSON to clipboard">
                          {copied ? <Check size={16} /> : <Clipboard size={16} />} {copied ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <div className="aud-json-scroll">
                        <pre className={`aud-pre ${wrapJSON ? "is-wrap" : ""}`}>
{JSON.stringify(active.__raw || active, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
