
import React, { useRef, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/chatbot.css";
import api, { apiFetch } from "../lib/api";

/* ---------------- UX/Perf toggles ---------------- */
const SHOW_SAVED_CHIPS = false;
const IDLE_LOAD = true;
const INSTANT_CACHE = true;
const PREWARM_ML = true;
const SKIP_REFRESH_IF_CACHED = true;

/* ---------------- Simple classify cache---------------- */
const CLASSIFY_CACHE_VERSION = "v1";
const mkClassifyKey = (text, opts = {}) =>
  `ml:${CLASSIFY_CACHE_VERSION}:${(text || "").trim().toLowerCase()}|k=${opts.top_k ?? 5}|advice=${!!opts.with_advice}|nbr=${!!opts.include_neighbors}`;

function getCachedClassify(text, opts) {
  try {
    const raw = sessionStorage.getItem(mkClassifyKey(text, opts));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function setCachedClassify(text, opts, value) {
  try {
    sessionStorage.setItem(mkClassifyKey(text, opts), JSON.stringify(value));
  } catch {}
}

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

// Allowed enum labels in DB
const ALLOWED_LOCATIONS = [
  "Online","Colombo","Gampaha","Kalutara","Kandy","Matale","Nuwara Eliya",
  "Galle","Matara","Hambantota","Jaffna","Kilinochchi","Mannar","Vavuniya",
  "Mullaitivu","Batticaloa","Ampara","Trincomalee","Kurunegala","Puttalam",
  "Anuradhapura","Polonnaruwa","Badulla","Monaragala","Ratnapura","Kegalle",
];
const LCASE_TO_CANON = Object.fromEntries(ALLOWED_LOCATIONS.map((s) => [s.toLowerCase(), s]));
function toEnumLocation(v) {
  if (!v) return null;
  const key = String(v).trim().toLowerCase().replace(/\bdistrict\b/g, "").trim();
  return LCASE_TO_CANON[key] ?? null;
}
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
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
    } else keep.push(p);
  }
  out.body = keep.join("\n\n").trim();
  return out;
}
function normalizeRoadmapStep(step, index) {
  if (step == null) return null;
  if (typeof step === "string") {
    const str = step.trim();
    let phase = "", body = str;
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
    bullets = bullets.map((x) => sentenceCase(String(x).replace(/\.*\s*$/, "")) + ".").filter(Boolean);
    return { title, bullets, phase };
  }
  return null;
}
function buildResultHTML({ category, location, narrative, suggestions, roadmap, kpis, risks }) {
  const cat = esc(category || "—");
  const loc = esc(location || "—");
  const { body: narr, ops } = extractOps(narrative || "");
  const li = (xs) => (xs || []).map((x) => `<li>${esc(typeof x === "string" ? x : JSON.stringify(x))}</li>`).join("");
  const kpiGrid = (kpis || []).map((k) => {
    if (!k) return "";
    if (typeof k === "string") {
      return `<div class="kpi"><span class="kpi-name">${esc(k)}</span><span class="kpi-value">—</span></div>`;
    }
    const name = esc(k.name ?? "");
    const target = esc(k.target ?? k.goal ?? "");
    const timeframe = esc(k.timeframe ?? k.period ?? "");
    const right = [target, timeframe].filter(Boolean).join(" · ") || "—";
    return `<div class="kpi"><span class="kpi-name">${name}</span><span class="kpi-value">${right}</span></div>`;
  }).join("");
  const steps = (roadmap || [])
    .map((raw, i) => normalizeRoadmapStep(raw, i))
    .filter(Boolean)
    .map((norm) => {
      const title = esc(norm.title || "");
      const phaseChip = norm.phase ? ` <span class="chip" style="margin-left:8px">${esc(norm.phase)}</span>` : "";
      const bullets = (norm.bullets && norm.bullets.length) ? `<ul class="list small">${li(norm.bullets)}</ul>` : "";
      return `<div class="step"><div class="step-title">${title}${phaseChip}</div>${bullets}</div>`;
    }).join("");
  const suggestionsList = (suggestions && suggestions.length) ? `<ul class="list list--bullets">${li(suggestions)}</ul>` : "";
  const risksList = (risks && risks.length) ? `<ul class="list small">${li(risks)}</ul>` : "";
  const opsBlock = ops.length ? `<div class="block"><h3>Operations</h3><ul class="list small">${li(ops)}</ul></div>` : "";
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
    ${suggestionsList ? `<div class="block"><h3>Actions to Start</h3>${suggestionsList}</div>` : ""}
    ${steps ? `<div class="block"><h3>Next 90 Days</h3><div class="steps">${steps}</div></div>` : ""}
    ${kpiGrid ? `<div class="block"><h3>KPIs</h3><div class="kpi-grid">${kpiGrid}</div></div>` : ""}
    ${risksList ? `<div class="block"><h3>Risks</h3>${risksList}</div>` : ""}
  </article>`;
}

/* ----------- Persist/restore lastResult per idea ----------- */
const resultKey = (ideaId) => `idea_result_${ideaId}`;
function saveResultForIdea(ideaId, resultObj) {
  try { localStorage.setItem(resultKey(ideaId), JSON.stringify(resultObj)); } catch {}
}
function loadResultForIdea(ideaId) {
  try {
    const raw = localStorage.getItem(resultKey(ideaId));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/* Derive base text to classify from a saved idea row */
function deriveBaseText(ideaRow) {
  const fields = [ideaRow?.description, ideaRow?.title, ideaRow?.text];
  for (const f of fields) {
    if (f && String(f).trim()) return String(f).trim();
  }
  const cat = ideaRow?.category || ideaRow?.category_name || "";
  const loc = ideaRow?.location || ideaRow?.district || "";
  if (cat && loc) return `${cat} in ${loc}`;
  if (cat) return `${cat}`;
  return "";
}

/* ================= Page ================= */
export default function ChatPage() {
  const [idea, setIdea] = useState("");
  const [messages, setMessages] = useState([
    {
      key: "intro",
      role: "assistant",
      kind: "text",
      content:
        "Tell me your startup idea (e.g., “I want to start a clothing store in Colombo”). I’ll infer a category and suggest concrete next steps.",
    },
  ]);
  const [errorText, setErrorText] = useState("");
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [lastResult, setLastResult] = useState(null);

  // saved ideas
  const [savedIdeas, setSavedIdeas] = useState([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState(null);

  // multi-request support
  const loadingCountRef = useRef(0);
  const [loadingTick, setLoadingTick] = useState(0); // forces re-render for spinner
  const isLoading = loadingCountRef.current > 0;

  // abort controllers for all in-flight requests
  const controllersRef = useRef(new Set());

  // scheduled boot handles
  const idleIdRef = useRef(null);
  const timeoutIdRef = useRef(null);

  const navigate = useNavigate();

  /** Add or replace a single HTML card, keyed (prevents duplicate saved card). */
  const addOrReplaceCard = (msgKey, html, role = "assistant") => {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m?.key === msgKey && m?.kind === "html");
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { key: msgKey, role, kind: "html", content: html };
        return copy;
      }
      return [...prev, { key: msgKey, role, kind: "html", content: html }];
    });
  };

  /** Always append a new HTML card (for each new user prompt). */
  const appendNewCard = (msgKey, html, role = "assistant") => {
    setMessages((prev) => [...prev, { key: msgKey, role, kind: "html", content: html }]);
  };

  /** Increment/decrement global loading counter safely */
  const withLoading = async (fn) => {
    loadingCountRef.current += 1;
    setLoadingTick((x) => x + 1);
    try { return await fn(); }
    finally {
      loadingCountRef.current = Math.max(0, loadingCountRef.current - 1);
      setLoadingTick((x) => x + 1);
    }
  };

  // Prewarm ML runtime
  useEffect(() => {
    if (!PREWARM_ML) return;
    let cancelled = false;
    (async () => { try { await apiFetch("/api/ml/info/"); } catch {} })();
    if ("requestIdleCallback" in window) {
      idleIdRef.current = window.requestIdleCallback(async () => {
        if (cancelled) return;
        try { await apiFetch("/api/ml/info/"); } catch {}
      }, { timeout: 2000 });
    }
    return () => {
      cancelled = true;
      if (idleIdRef.current && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleIdRef.current);
        idleIdRef.current = null;
      }
    };
  }, []);

  // Boot: show cached saved idea card (single), else compute once.
  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      try { await apiFetch("/api/csrf/"); } catch {}
      if (cancelled) return;

      try {
        const me = await api.me();
        if (cancelled || !me?.authenticated) return;

        const ideas = await api.myIdeas();
        if (cancelled || !Array.isArray(ideas) || !ideas.length) return;

        setSavedIdeas(ideas);
        const storedId = Number(localStorage.getItem("last_idea_id") || 0);
        const chosen = ideas.find((i) => i.idea_id === storedId) || ideas[0];
        if (cancelled || !chosen) return;

        setSelectedIdeaId(chosen.idea_id);

        const cacheKey = `idea_card_${chosen.idea_id}`;
        const cachedHtml = INSTANT_CACHE ? localStorage.getItem(cacheKey) : null;

        if (cachedHtml && cachedHtml !== "undefined" && cachedHtml !== "null") {
          addOrReplaceCard(`saved:${chosen.idea_id}`, cachedHtml);
          const cachedResult = loadResultForIdea(chosen.idea_id);
          if (cachedResult) setLastResult(cachedResult);
          if (SKIP_REFRESH_IF_CACHED) return; // show only saved card on return
        }

        // No cache yet: render now so user sees output
        await renderIdea(chosen, { msgKey: `saved:${chosen.idea_id}`, isSaved: true, silentIntro: true });
      } catch {
        /* ignore */
      }
    };

    if (IDLE_LOAD && "requestIdleCallback" in window) {
      timeoutIdRef.current = null;
      idleIdRef.current = window.requestIdleCallback(boot, { timeout: 1200 });
    } else {
      idleIdRef.current = null;
      timeoutIdRef.current = setTimeout(boot, 0);
    }

    return () => {
      cancelled = true;
      if (idleIdRef.current != null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleIdRef.current);
        idleIdRef.current = null;
      }
      if (timeoutIdRef.current != null) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      // abort all in-flight
      for (const c of controllersRef.current) { try { c.abort(); } catch {} }
      controllersRef.current.clear();
    };
  }, []);

  async function classifyWithCache(text, options, signal) {
    const cached = getCachedClassify(text, options);
    if (cached) return cached;
    const data = await api.classify({ ...options, text, signal });
    setCachedClassify(text, options, data);
    return data;
  }

  async function renderIdea(ideaRow, { msgKey, isSaved = false, silentIntro = false } = {}) {
    const baseText = deriveBaseText(ideaRow);
    if (!baseText) return;

    await withLoading(async () => {
      const controller = new AbortController();
      controllersRef.current.add(controller);
      try {
        const options = { top_k: 5, with_advice: true, include_neighbors: false };
        const data = await classifyWithCache(baseText, options, controller.signal);

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

        // persist cache for saved ideas
        if (isSaved) {
          try {
            localStorage.setItem(`idea_card_${ideaRow.idea_id}`, html);
            saveResultForIdea(ideaRow.idea_id, result);
          } catch {}
        }

        if (!silentIntro && isSaved) {
          setMessages((prev) => [
            ...prev,
            { key: `note:${ideaRow.idea_id}`, role: "assistant", kind: "text", content: `Loaded your saved idea: ${ideaRow.title || ideaRow.category || "Idea"}.` },
          ]);
        }

        if (msgKey) {
          // Saved idea path: replace-or-insert a single saved card
          addOrReplaceCard(msgKey, html);
        } else {
          //append a new card so multiple prompts show multiple suggestions
          const newKey = `ask:${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
          appendNewCard(newKey, html);
        }
      } catch (e) {
        if (e?.name === "AbortError") return;
        console.error(e);
        setErrorText("Network error");
        setMessages((m) => [
          ...m,
          { key: `err:${Date.now()}`, role: "assistant", kind: "text", content: "Network error. Please try again." },
        ]);
      } finally {
        controllersRef.current.delete(controller);
      }
    });
  }

  const submitIdea = async () => {
    const trimmed = idea.trim();
    if (!trimmed) return;

    // allow multiple parallel prompts
    setMessages((m) => [...m, { key: `user:${Date.now()}`, role: "user", kind: "text", content: trimmed }]);
    setIdea("");
    setErrorText("");

    await withLoading(async () => {
      const controller = new AbortController();
      controllersRef.current.add(controller);
      try {
        const options = { top_k: 5, with_advice: true, include_neighbors: false };
        const data = await classifyWithCache(trimmed, options, controller.signal);

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
        appendNewCard(`ask:${Date.now()}-${Math.random().toString(36).slice(2,7)}`, html);
      } catch (e) {
        if (e?.name === "AbortError") return;
        console.error(e);
        setErrorText("Network error");
        setMessages((m) => [
          ...m,
          { key: `err:${Date.now()}`, role: "assistant", kind: "text", content: "Network error. Please try again." },
        ]);
      } finally {
        controllersRef.current.delete(controller);
      }
    });
  };

  const saveIdea = async () => {
    if (!lastResult || saveBusy) return;
    setSaveBusy(true);
    setSaveMsg("");

    const payload = {
      text: lastResult.text,
      category: lastResult.category,
      title: lastResult.text.slice(0, 255),
      description: lastResult.narrative || lastResult.text,
      target_audience: "",
      location: toEnumLocation(lastResult.location),
      business_type: null,
    };

    try {
      const created = await api.saveIdea(payload);
      setSaveMsg("Saved! You can find it in your dashboard.");
      setSavedIdeas((s) => [created, ...s]);
      setSelectedIdeaId(created.idea_id);
      localStorage.setItem("last_idea_id", String(created.idea_id));
      try {
        const html = buildResultHTML(lastResult);
        localStorage.setItem(`idea_card_${created.idea_id}`, html);
        saveResultForIdea(created.idea_id, lastResult);
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

        {/* Saved ideas chips  */}
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
                    // Replace-or-insert only one saved card (no duplicates)
                    renderIdea(it, { msgKey: `saved:${it.idea_id}`, isSaved: true, silentIntro: false });
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
          <div className={`ibot-input-inner ${isLoading ? "busy" : ""}`}>
            {/* Idea input */}
            <input
              type="text"
              className="ibot-input"
              placeholder="Briefly describe your idea…"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              onKeyDown={onEnter}
              aria-label="Enter your idea"
              // not disabled → allows multiple prompts while others run
            />

            {/* Submit button */}
            <button
              type="button"
              className="ibot-submit-btn"
              onClick={submitIdea}
              disabled={!idea.trim()} // only disabled when empty
              aria-label="Submit idea"
              title="Submit"
            >
              {isLoading ? (
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
          {messages.map((m) =>
            m.kind === "html" ? (
              <Bubble key={m.key} role={m.role} kind="html">
                {m.content}
              </Bubble>
            ) : (
              <Bubble key={m.key} role={m.role} kind="text">
                {m.content}
              </Bubble>
            )
          )}

          {/* Loading/Thinking indicator */}
          {isLoading && (
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
