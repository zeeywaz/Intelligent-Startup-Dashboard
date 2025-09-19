// src/pages/chatbot.jsx
import React, { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/chatbot.css";

const API_BASE =
  import.meta?.env?.VITE_API_BASE ||
  process.env.REACT_APP_API_BASE ||
  "http://127.0.0.1:8000";

/* typing indicator */
function Typing() {
  return (
    <div className="ibot-dots" aria-label="Thinking">
      <span>.</span><span>.</span><span>.</span>
    </div>
  );
}

/* chat bubble */
function Bubble({ role = "assistant", children }) {
  const isUser = role === "user";
  return (
    <div className={`ibot-bubble-row ${isUser ? "user" : "assistant"}`}>
      {!isUser && (
        <img
          src="/logo-white.png"
          alt="IdeaForge"
          className="ibot-avatar"
          width={28}
          height={28}
        />
      )}
      <div className="ibot-bubble" dangerouslySetInnerHTML={{ __html: children }} />
    </div>
  );
}

export default function ChatPage() {
  const [idea, setIdea] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Tell me your startup idea (e.g., “I want to start a clothing store in Colombo”). I’ll infer a category and suggest concrete next steps.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const submitIdea = async () => {
    const trimmed = idea.trim();
    if (!trimmed) return;

    // push user message
    setMessages((m) => [...m, { role: "user", content: trimmed }]);
    setIdea("");
    setErrorText("");
    setLoading(true);

    try {
      const r = await fetch(`${API_BASE}/api/ml/classify/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, top_k: 3 }),
        credentials: "include",
      });
      const data = await r.json().catch(() => ({}));

      if (!r.ok) {
        const msg = data?.error || `HTTP ${r.status}`;
        setErrorText(msg);
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content:
              "Hmm, I couldn’t process that just now. Please try again in a moment.",
          },
        ]);
      } else {
        const cat = data?.predictions?.[0]?.category || "—";
        const loc = data?.predicted_location;
        const suggs = (data?.suggestions || []).slice(0, 6);

        // render a single assistant card (no sub-categories/scores)
        const html = `
          <div class="ibot-card">
            <div class="ibot-kv"><b>Category</b><span>${cat}</span></div>
            ${loc ? `<div class="ibot-kv"><b>Likely location</b><span>${loc}</span></div>` : ""}
            <div class="ibot-suggs">
              <div class="ibot-suggs-title">Suggested next moves</div>
              <ul>${suggs.map((s) => `<li>${s}</li>`).join("")}</ul>
            </div>
          </div>
        `;
        setMessages((m) => [...m, { role: "assistant", content: html }]);
      }
    } catch (e) {
      console.error(e);
      setErrorText("Network error");
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Network error. Please try again." },
      ]);
    } finally {
      setLoading(false);
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
    // (files not used for now; kept for future)
    console.log("selected files:", selected.map((f) => f.name).join(", "));
  };

  return (
    <div className="ibot-app">

      {/* Left logo → dashboard */}
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
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role}>
              {m.content
                .replaceAll("&", "&amp;")
                .replaceAll("<br>", "\n")}
            </Bubble>
          ))}

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

      <button type="button" className="ibot-to-dash" onClick={() => navigate("/userdashboard")}>
        Proceed to Dashboard →
      </button>
    </div>
  );
}
