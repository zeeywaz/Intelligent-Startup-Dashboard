// src/pages/chatbot.jsx
import React, { useRef, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/chatbot.css";
import api, { API_BASE, apiFetch } from "../lib/api";

/* typing indicator */
function Typing() {
  return (
    <div className="ibot-dots" aria-label="Thinking">
      <span></span><span></span><span></span>
    </div>
  );
}

/* chat bubble */
function Bubble({ role = "assistant", kind = "text", children }) {
  const isUser = role === "user";
  return (
    <div className={`ibot-bubble-row ${isUser ? "user" : "assistant"}`}>
      {!isUser && (
        <img src="/logo-white.png" alt="IdeaForge" className="ibot-avatar" width={28} height={28} />
      )}
      {kind === "html" ? (
        <div className="ibot-bubble ibot-bubble--html" dangerouslySetInnerHTML={{ __html: children }} />
      ) : (
        <div className="ibot-bubble">{children}</div>
      )}
    </div>
  );
}

/* helpers */
const sentenceCase = (s) =>
  !s ? "" : s.trim().replace(/\s+/g, " ").replace(/^([a-z])/, (m) => m.toUpperCase());

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

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Make sure the CSRF cookie exists early (once per tab)
  useEffect(() => {
    apiFetch("/api/csrf/").catch(() => {});
  }, []);

  const submitIdea = async () => {
    const trimmed = idea.trim();
    if (!trimmed || loading) return;

    // echo user message
    setMessages((m) => [...m, { role: "user", kind: "text", content: trimmed }]);
    setIdea("");
    setErrorText("");
    setLoading(true);
    setSaveMsg("");

    try {
      const data = await api.classify({
        text: trimmed,
        top_k: 5,
        with_advice: true,
        include_neighbors: false,
      });

      // normalize backend
      const pred0 = Array.isArray(data?.predictions) ? data.predictions[0] : {};
      const cat = pred0?.Category || pred0?.category || "";
      const loc = pred0?.Location || pred0?.location || null;

      const advice = data?.advice || {};
      const suggestions = tidySuggestions(advice?.suggestions, 4);
      const narrative = advice?.narrative || "";
      const roadmap = Array.isArray(advice?.next_90_days) ? advice.next_90_days : [];
      const kpis = Array.isArray(advice?.kpis) ? advice.kpis : [];
      const risks = tidySuggestions(advice?.risks, 3);

      setLastResult({
        text: trimmed,
        category: cat,
        location: loc,
        narrative,
        suggestions,
        roadmap,
        kpis,
        risks,
      });

      // build compact HTML card
      const html = `
        <article class="card">
          <header class="card-head">
            <span class="chip chip--cat">${String(cat || "—")}</span>
            ${loc ? `<span class="chip chip--loc">${String(loc)}</span>` : ""}
          </header>
          ${
            suggestions.length
              ? `<section class="block">
                   <h3>Suggested next moves</h3>
                   <ul class="list list--bullets">
                     ${suggestions.map((s) => `<li>${s}</li>`).join("")}
                   </ul>
                 </section>`
              : ""
          }
          ${
            narrative
              ? `<section class="block">
                   <h3>Narrative</h3>
                   <p class="para">${String(narrative)
                     .replace(/&/g, "&amp;")
                     .replace(/</g, "&lt;")
                     .replace(/>/g, "&gt;")
                     .replace(/\n{2,}/g, "</p><p class='para'>")
                     .replace(/\n/g, "<br/>")}</p>
                 </section>`
              : ""
          }
          ${
            roadmap.length
              ? `<section class="block">
                   <h3>Next 90 Days</h3>
                   <div class="steps">
                     ${roadmap
                       .map(
                         (ph) => `
                         <div class="step">
                           <div class="step-title">${String(ph.phase || "")}</div>
                           <ul class="list list--bullets small">
                             ${(ph.goals || []).map((g) => `<li>${String(g)}</li>`).join("")}
                           </ul>
                         </div>`
                       )
                       .join("")}
                   </div>
                 </section>`
              : ""
          }
          ${
            kpis.length
              ? `<section class="block">
                   <h3>KPIs</h3>
                   <div class="kpi-grid">
                     ${kpis
                       .map(
                         (k) => `
                         <div class="kpi">
                           <div class="kpi-name">${String(k.name || "")}</div>
                           <div class="kpi-value">${String(k.target ?? "")}</div>
                         </div>`
                       )
                       .join("")}
                   </div>
                 </section>`
              : ""
          }
          ${
            risks.length
              ? `<section class="block">
                   <h3>Risks</h3>
                   <ul class="list list--bullets small">
                     ${risks.map((r) => `<li>${r}</li>`).join("")}
                   </ul>
                 </section>`
              : ""
          }
        </article>
      `;
      setMessages((m) => [...m, { role: "assistant", kind: "html", content: html }]);
    } catch (e) {
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
      location: lastResult.location === "Online" ? "online" : null,
      business_type: null,
    };

    try {
      await api.saveIdea(payload);                // <— CSRF header auto-added
      setSaveMsg("Saved! You can find it in your dashboard.");
    } catch (e) {
      console.error(e);
      setSaveMsg(`Couldn’t save the idea. ${e.message}`);
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
      <div className="ibot-logo-left">
        <Link to="/userdashboard" className="auth-brand" aria-label="IdeaForge User Dashboard">
          <img src="/logo-white.png" alt="IdeaForge" className="auth-logo" height={40} />
        </Link>
      </div>

      <main className="ibot-main">
        <h1 className="ibot-title">
          Welcome to Idea-Forge
          <span>Where Ideas Turn Into Reality</span>
        </h1>

        {/* input bar */}
        <div className="ibot-input-wrap" role="group" aria-label="Submit your idea">
          <div className={`ibot-input-inner ${loading ? "busy" : ""}`}>
            <button
              type="button"
              className="ibot-addfiles-btn"
              onClick={openFilePicker}
              aria-label="Add files"
              title="Attach files"
            >
              <svg viewBox="0 0 43 44" className="ibot-plus">
                <path d="M19.7 23.83H8.96V20.17h10.74V9.17h3.58v11h10.75v3.67H22.54v11h-3.58v-11Z" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={onFilesSelected}
              className="ibot-hidden-file"
            />

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
                <svg viewBox="0 0 24 24" className="ibot-send">
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

          {loading && (
            <div className="ibot-thinking">
              <div className="ibot-skel" />
              <div className="ibot-skel short" />
              <Typing />
            </div>
          )}

          {errorText && <div className="ibot-error">{errorText}</div>}
        </section>

        <p className="ibot-example">
          <span className="ibot-example-intro">Example:</span>{" "}
          “I want to start a clothing business in Colombo. I’ll begin online and expand to a physical store.”
        </p>
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
