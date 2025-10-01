// src/pages/chatbot.jsx
import React, { useRef, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/chatbot.css";
import api, { apiFetch } from "../lib/api";

/* ---------------- UX/Perf toggles ---------------- */
const SHOW_SAVED_CHIPS = false; // hide the idea chips under the heading
const IDLE_LOAD = true;         // load saved ideas after first paint
const INSTANT_CACHE = true;     // render cached HTML immediately if available

/* ---------------- Typing indicator ---------------- */
function Typing() {
  return (
    <div className="ibot-dots" aria-label="Thinking">
      <span></span><span></span><span></span>
    </div>
  );
}

/* ---------------- Chat bubble ---------------- */
function Bubble({ role = "assistant", kind = "text", children }) {
  const isUser = role === "user";
  return (
    <div className={`ibot-bubble-row ${isUser ? "user" : "assistant"}`}>
      {!isUser && (
        <img
          src="/logo-black.png"
          alt="IdeaForge"
          className="ibot-avatar"
          width={28}
          height={28}
        />
      )}
      {kind === "html" ? (
        <div
          className="ibot-bubble ibot-bubble--html"
          dangerouslySetInnerHTML={{ __html: children }}
        />
      ) : (
        <div className="ibot-bubble">{children}</div>
      )}
    </div>
  );
}

/* ================= Helpers ================= */

/** Sentence case and tidy spacing */
const sentenceCase = (s) =>
  !s
    ? ""
    : String(s).trim().replace(/\s+/g, " ").replace(/^([a-z])/, (m) => m.toUpperCase());

/** De-dup + cap + end with period */
const tidySuggestions = (arr, max = 5) => {
  const seen = new Set();
  const out = [];
  for (const raw of arr || []) {
    const s = sentenceCase(String(raw).replace(/\.*\s*$/, "")) + ".";
    const key = s.toLowerCase();
    if (!seen.has(key) && s.length > 2) {
      out.push(s);
      seen.add(key);
    }
    if (out.length >= max) break;
  }
  return out;
};

// Allowed enum labels in DB (after removing local/regional/national)
const ALLOWED_LOCATIONS = [
  "Online",
  "Colombo","Gampaha","Kalutara","Kandy","Matale","Nuwara Eliya",
  "Galle","Matara","Hambantota","Jaffna","Kilinochchi","Mannar",
  "Vavuniya","Mullaitivu","Batticaloa","Ampara","Trincomalee",
  "Kurunegala","Puttalam","Anuradhapura","Polonnaruwa",
  "Badulla","Monaragala","Ratnapura","Kegalle",
];
const LCASE_TO_CANON = Object.fromEntries(ALLOWED_LOCATIONS.map((s) => [s.toLowerCase(), s]));

/** Case-insensitive, suffix-tolerant canonicalizer for enum-backed location */
function toEnumLocation(v) {
  if (!v) return null;
  const key = String(v).trim().toLowerCase().replace(/\bdistrict\b/g, "").trim();
  return LCASE_TO_CANON[key] ?? null;
}

/** Very small HTML escaper for any free text we render in HTML card */
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Pull out "On operations: ..." and convert to bullets; return { body, ops } */
function extractOps(narr) {
  const out = { body: narr || "", ops: [] };
  if (!narr) return out;

  const paras = String(narr).split(/\n{2,}/);
  const keep = [];
  for (const p of paras) {
    const m = p.match(/^\s*On operations:\s*(.+)$/i);
    if (m) {
      const opsRaw = m[1];
      const ops = opsRaw
        .split(/(?:;|•|·|\.)\s+/g)
        .map((s) => s.trim().replace(/\.*$/, ""))
        .filter(Boolean)
        .map((s) => sentenceCase(s) + ".");
      out.ops = ops;
    } else {
      keep.push(p);
    }
  }
  out.body = keep.join("\n\n").trim();
  return out;
}

/** Normalize a roadmap item into a uniform { title, bullets, phase } shape */
function normalizeRoadmapStep(step, index) {
  if (step == null) return null;

  if (typeof step === "string") {
    const str = step.trim();
    let phase = "";
    let body = str;
    const m = str.match(/^(Weeks?\s*[^:]+):\s*(.+)$/i);
    if (m) { phase = m[1]; body = m[2]; }

    const bullets = body
      .split(/(?:\.\s+|;|\n|,)(?![^()]*\))/g)
      .map((s) => s.trim())
      .filter(Boolean);
    return { title: `Step ${index + 1}`, bullets, phase };
  }

  if (Array.isArray(step)) {
    const bullets = step.map((x) => sentenceCase(String(x).replace(/\.*\s*$/, "")) + ".");
    return { title: `Step ${index + 1}`, bullets, phase: "" };
  }

  if (typeof step === "object") {
    const title = step.title || step.name || step.heading || `Step ${index + 1}`;
    const phase = step.phase || step.when || step.timeframe || step.window || "";

    let bullets = [];
    if (Array.isArray(step.goals)) bullets = step.goals.map(String);
    else if (Array.isArray(step.tasks)) bullets = step.tasks.map(String);
    else if (Array.isArray(step.items)) bullets = step.items.map(String);
    else if (step.description) bullets = [String(step.description)];
    else {
      bullets = Object.values(step)
        .filter((v) => typeof v === "string")
        .map(String);
    }

    bullets = bullets
      .map((x) => sentenceCase(String(x).replace(/\.*\s*$/, "")) + ".")
      .filter(Boolean);

    return { title, bullets, phase };
  }

  return null;
}

/** Build the HTML card we drop into the assistant bubble */
function buildResultHTML({ category, location, narrative, suggestions, roadmap, kpis, risks }) {
  const cat = esc(category || "—");
  const loc = esc(location || "—");
  const { body: narr, ops } = extractOps(narrative || "");

  const li = (xs) =>
    (xs || [])
      .map((x) => `<li>${esc(typeof x === "string" ? x : JSON.stringify(x))}</li>`)
      .join("");

  const kpiGrid = (kpis || [])
    .map((k) => {
      if (!k) return "";
      if (typeof k === "string") {
        return `<div class="kpi"><span class="kpi-name">${esc(k)}</span><span class="kpi-value">—</span></div>`;
      }
      const name = esc(k.name ?? "");
      const target = esc(k.target ?? k.goal ?? "");
      const timeframe = esc(k.timeframe ?? k.period ?? "");
      const right = [target, timeframe].filter(Boolean).join(" · ") || "—";
      return `<div class="kpi"><span class="kpi-name">${name}</span><span class="kpi-value">${right}</span></div>`;
    })
    .join("");

  const steps = (roadmap || [])
    .map((raw, i) => normalizeRoadmapStep(raw, i))
    .filter(Boolean)
    .map((norm) => {
      const title = esc(norm.title || "");
      const phaseChip = norm.phase ? ` <span class="chip" style="margin-left:8px">${esc(norm.phase)}</span>` : "";
      const bullets = (norm.bullets && norm.bullets.length)
        ? `<ul class="list small">${li(norm.bullets)}</ul>`
        : "";
      return `<div class="step"><div class="step-title">${title}${phaseChip}</div>${bullets}</div>`;
    })
    .join("");

  const suggestionsList = (suggestions && suggestions.length)
    ? `<ul class="list list--bullets">${li(suggestions)}</ul>`
    : "";

  const risksList = (risks && risks.length)
    ? `<ul class="list small">${li(risks)}</ul>`
    : "";

  const opsBlock = ops.length
    ? `<div class="block">
         <h3>Operations</h3>
         <ul class="list small">${li(ops)}</ul>
       </div>`
    : "";

  return `
  <article class="card">
    <div class="card-head">
      <h3>Suggested Plan</h3>
      <div class="pillrow">
        <span class="chip chip--cat">${cat}</span>
        <span class="chip chip--loc">Location: ${loc}</span>
      </div>
    </div>

    ${narr ? `<div class="block"><p class="para">${esc(narr)}</p></div>` : ""}

    ${opsBlock}

    ${suggestionsList ? `
      <div class="block">
        <h3>Actions to Start</h3>
        ${suggestionsList}
      </div>` : ""}

    ${steps ? `
      <div class="block">
        <h3>Next 90 Days</h3>
        <div class="steps">${steps}</div>
      </div>` : ""}

    ${kpiGrid ? `
      <div class="block">
        <h3>KPIs</h3>
        <div class="kpi-grid">${kpiGrid}</div>
      </div>` : ""}

    ${risksList ? `
      <div class="block">
        <h3>Risks</h3>
        ${risksList}
      </div>` : ""}
  </article>
  `;
}

/* ================= Page ================= */
export default function ChatPage() {
  const [idea, setIdea] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      kind: "text",
      content:
        "Tell me your startup idea (e.g., “I want to start a clothing store in Colombo”). I’ll infer a category and suggest concrete next steps.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [lastResult, setLastResult] = useState(null); // { text, category, location, narrative, ... }

  // saved ideas
  const [savedIdeas, setSavedIdeas] = useState([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState(null);

  // fast replace & cancellation
  const lastHtmlIndexRef = useRef(-1);
  const classifyAbortRef = useRef(null);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Boot fast: show cached card (if any), then refresh in background
  useEffect(() => {
    const boot = async () => {
      try { await apiFetch("/api/csrf/"); } catch {}
      try {
        const me = await api.me();
        if (!me?.authenticated) return;
        const ideas = await api.myIdeas();
        if (!Array.isArray(ideas) || !ideas.length) return;

        setSavedIdeas(ideas);
        const storedId = Number(localStorage.getItem("last_idea_id") || 0);
        const chosen = ideas.find((i) => i.idea_id === storedId) || ideas[0];
        setSelectedIdeaId(chosen.idea_id);

        if (INSTANT_CACHE) {
          const cacheKey = `idea_card_${chosen.idea_id}`;
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            setMessages((prev) => {
              const idx = prev.length;
              lastHtmlIndexRef.current = idx;
              return [...prev, { role: "assistant", kind: "html", content: cached }];
            });
          }
        }

        await renderIdea(chosen, { silentIntro: true, replaceLastHtml: true });
      } catch {}
    };

    if (IDLE_LOAD && "requestIdleCallback" in window) {
      window.requestIdleCallback(boot, { timeout: 1200 });
    } else {
      setTimeout(boot, 0);
    }
  }, []);

  async function renderIdea(ideaRow, { silentIntro = false, replaceLastHtml = false } = {}) {
    const baseText = (ideaRow?.description || ideaRow?.title || "").trim();
    if (!baseText) return;
    setErrorText("");
    setLoading(true);
    try {
      // cancel previous classify
      try { classifyAbortRef.current?.abort(); } catch {}
      const controller = new AbortController();
      classifyAbortRef.current = controller;

      const data = await api.classify({
        text: baseText,
        top_k: 5, // keep full quality
        with_advice: true,
        include_neighbors: false,
        signal: controller.signal,
      });

      const pred0 = Array.isArray(data?.predictions) ? data.predictions[0] : {};
      const cat = pred0?.Category || pred0?.category || ideaRow?.category || "";
      const locRaw = ideaRow?.location || pred0?.Location || pred0?.location || null;

      const advice = data?.advice || {};
      const suggestions = tidySuggestions(advice?.suggestions, 6);
      const narrative = advice?.narrative || "";
      const roadmap = Array.isArray(advice?.next_90_days) ? advice.next_90_days : [];
      const kpis = Array.isArray(advice?.kpis) ? advice.kpis : [];
      const risks = tidySuggestions(advice?.risks, 5);
      const canonLoc = toEnumLocation(locRaw);

      const result = {
        text: baseText,
        category: String(cat || ""),
        location: canonLoc,
        narrative,
        suggestions,
        roadmap,
        kpis,
        risks,
      };
      setLastResult(result);

      const html = buildResultHTML(result);

      // cache for instant next load
      try { localStorage.setItem(`idea_card_${ideaRow.idea_id}`, html); } catch {}

      setMessages((prev) => {
        if (replaceLastHtml && lastHtmlIndexRef.current >= 0) {
          const copy = [...prev];
          copy[lastHtmlIndexRef.current] = { role: "assistant", kind: "html", content: html };
          return copy;
        }
        return [
          ...prev,
          ...(silentIntro ? [] : [{ role: "assistant", kind: "text", content: `Loaded your saved idea: ${ideaRow.title || ideaRow.category}.` }]),
          { role: "assistant", kind: "html", content: html },
        ];
      });
    } catch (e) {
      if (e?.name === "AbortError") return;
      console.error(e);
      setErrorText("Network error");
      setMessages((m) => [
        ...m,
        { role: "assistant", kind: "text", content: "Network error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const submitIdea = async () => {
    const trimmed = idea.trim();
    if (!trimmed || loading) return;

    setMessages((m) => [...m, { role: "user", kind: "text", content: trimmed }]);
    setIdea("");
    setErrorText("");
    setSaveMsg("");
    setLoading(true);

    try {
      try { classifyAbortRef.current?.abort(); } catch {}
      const controller = new AbortController();
      classifyAbortRef.current = controller;

      const data = await api.classify({
        text: trimmed,
        top_k: 5, // keep full quality
        with_advice: true,
        include_neighbors: false,
        signal: controller.signal,
      });

      const pred0 = Array.isArray(data?.predictions) ? data.predictions[0] : {};
      const cat = pred0?.Category || pred0?.category || "";
      const locRaw = pred0?.Location || pred0?.location || null;

      const advice = data?.advice || {};
      const suggestions = tidySuggestions(advice?.suggestions, 6);
      const narrative = advice?.narrative || "";
      const roadmap = Array.isArray(advice?.next_90_days) ? advice.next_90_days : [];
      const kpis = Array.isArray(advice?.kpis) ? advice.kpis : [];
      const risks = tidySuggestions(advice?.risks, 5);

      const canonLoc = toEnumLocation(locRaw);

      const result = {
        text: trimmed,
        category: String(cat || ""),
        location: canonLoc,
        narrative,
        suggestions,
        roadmap,
        kpis,
        risks,
      };
      setLastResult(result);

      const html = buildResultHTML(result);
      setMessages((m) => [...m, { role: "assistant", kind: "html", content: html }]);
    } catch (e) {
      if (e?.name === "AbortError") return;
      console.error(e);
      setErrorText("Network error");
      setMessages((m) => [
        ...m,
        { role: "assistant", kind: "text", content: "Network error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const saveIdea = async () => {
    if (!lastResult || saveBusy) return;
    setSaveBusy(true);
    setSaveMsg("");

    const payload = {
      text: lastResult.text,
      category: lastResult.category, // REQUIRED by backend
      title: lastResult.text.slice(0, 255),
      description: lastResult.narrative || lastResult.text,
      target_audience: "",
      location: toEnumLocation(lastResult.location), // canonical or null
      business_type: null,
    };

    try {
      const created = await api.saveIdea(payload);
      setSaveMsg("Saved! You can find it in your dashboard.");
      setSavedIdeas((s) => [created, ...s]);
      setSelectedIdeaId(created.idea_id);
      localStorage.setItem("last_idea_id", String(created.idea_id));
      // cache the rendered HTML so next visit is instant
      try {
        const html = buildResultHTML(lastResult);
        localStorage.setItem(`idea_card_${created.idea_id}`, html);
      } catch {}
    } catch (e) {
      console.error(e);
      setSaveMsg(`Couldn’t save the idea. ${e.message || "Unknown error"}`);
    } finally {
      setSaveBusy(false);
    }
  };

  const onEnter = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitIdea();
    }
  };

  const openFilePicker = () => fileInputRef.current?.click();
  const onFilesSelected = (e) => {
    const selected = Array.from(e.target.files || []);
    console.log("selected files:", selected.map((f) => f.name).join(", "));
  };

  return (
    <div className="ibot-app">
      {/* Header & Navigation */}
      <div className="ibot-logo-left">
        <Link to="/userdashboard" className="auth-brand" aria-label="IdeaForge User Dashboard">
          <img src="/logo-black.png" alt="IdeaForge" className="auth-logo" height={40} />
        </Link>
      </div>

      <main className="ibot-main">
        <h1 className="ibot-title">
          Welcome to Idea-Forge
          <span>Where Ideas Turn Into Reality</span>
        </h1>

        {/* Saved ideas chips (hidden) */}
        {SHOW_SAVED_CHIPS && savedIdeas.length > 0 && (
          <div className="ibot-saved" style={{ margin: "8px 0 16px" }}>
            <div className="pillrow" role="listbox" aria-label="Saved ideas">
              {savedIdeas.map((it) => (
                <button
                  key={it.idea_id}
                  type="button"
                  role="option"
                  aria-selected={selectedIdeaId === it.idea_id}
                  className={`chip ${selectedIdeaId === it.idea_id ? "chip--active" : ""}`}
                  title={it.title || it.category}
                  onClick={() => {
                    setSelectedIdeaId(it.idea_id);
                    localStorage.setItem("last_idea_id", String(it.idea_id));
                    renderIdea(it, { replaceLastHtml: true });
                  }}
                >
                  {it.title || it.category}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* input bar */}
        <div className="ibot-input-wrap" role="group" aria-label="Submit your idea">
          <div className={`ibot-input-inner ${loading ? "busy" : ""}`}>
            {/* File picker button */}
            <button
              type="button"
              className="ibot-addfiles-btn"
              onClick={openFilePicker}
              aria-label="Add files"
              title="Attach files"
            >
              <svg viewBox="0 0 43 44" className="ibot-plus" aria-hidden="true">
                <path d="M19.7 23.83H8.96V20.17h10.74V9.17h3.58v11h10.75v3.67H22.54v11h-3.58v-11Z" />
              </svg>
            </button>

            {/* File input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={onFilesSelected}
              className="ibot-hidden-file"
            />

            {/* Idea input */}
            <input
              type="text"
              className="ibot-input"
              placeholder="Briefly describe your idea…"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              onKeyDown={onEnter}
              aria-label="Enter your idea"
              disabled={loading}
            />

            {/* Submit button */}
            <button
              type="button"
              className="ibot-submit-btn"
              onClick={submitIdea}
              disabled={loading || !idea.trim()}
              aria-label="Submit idea"
              title="Submit"
            >
              {loading ? (
                <Typing />
              ) : (
                <svg viewBox="0 0 24 24" className="ibot-send" aria-hidden="true">
                  <path d="M3.4 20.6 22 12 3.4 3.4 3 10l12 2-12 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* chat thread */}
        <section className="ibot-chat" aria-live="polite">
          {messages.map((m, i) =>
            m.kind === "html" ? (
              <Bubble key={i} role={m.role} kind="html">
                {m.content}
              </Bubble>
            ) : (
              <Bubble key={i} role={m.role} kind="text">
                {m.content}
              </Bubble>
            )
          )}

          {/* Loading/Thinking indicator */}
          {loading && (
            <div className="ibot-thinking" aria-hidden="true">
              <div className="ibot-skel" />
              <div className="ibot-skel short" />
              <Typing />
            </div>
          )}

          {/* Error message */}
          {errorText && <div className="ibot-error">{errorText}</div>}
        </section>
      </main>

      {/* ACTION BUTTONS (fixed bottom-right) */}
      <button
        type="button"
        onClick={saveIdea}
        disabled={!lastResult || saveBusy}
        title={!lastResult ? "Submit an idea first" : "Save this idea"}
        className="ibot-to-dash"
        style={{ position: "fixed", right: 20, bottom: 88, zIndex: 50 }}
      >
        {saveBusy ? "Saving…" : "Proceed with Idea"}
      </button>

      {/* Proceed to Dashboard */}
      <button
        type="button"
        className="ibot-to-dash"
        onClick={() => navigate("/userdashboard")}
        style={{ position: "fixed", right: 20, bottom: 20, zIndex: 40 }}
      >
        Proceed to Dashboard →
      </button>

      {/* inline feedback for save */}
      {saveMsg ? (
        <div
          className="ibot-hint"
          style={{
            position: "fixed",
            right: 20,
            bottom: 140,
            maxWidth: 360,
            textAlign: "right",
            opacity: 0.95,
          }}
        >
          {saveMsg}
        </div>
      ) : null}
    </div>
  );
}
