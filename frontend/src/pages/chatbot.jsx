import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/chatbot.css";

export default function ChatPage() {
  const [idea, setIdea] = useState("");
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const submitIdea = () => {
    const trimmed = idea.trim();
    if (!trimmed && files.length === 0) return;
    // Hook up to your API later if needed
    console.log("Idea:", trimmed, "Files:", files.map(f => f.name));
    alert(`Idea submitted: "${trimmed || "(no text)"}"`);
    setIdea("");
    setFiles([]);
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
    setFiles((prev) => [...prev, ...selected]);
  };
  const removeFile = (idx) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

  return (
    <div className="ibot-app">
      {/* Header */}
      <header className="ibot-header">
        <button
          className="ibot-logo"
          onClick={() => navigate("/userdashboard")}
          aria-label="Go to dashboard"
        >
          IdeaForge
        </button>

        <button type="button" className="ibot-icon-btn" aria-label="Profile">
          <svg viewBox="0 0 55 55" className="ibot-user-icon" aria-hidden="true">
            <path
              d="M45.833 48.125V43.542c0-2.431-.965-4.762-2.684-6.481-1.719-1.719-4.05-2.684-6.482-2.684H18.333c-2.431 0-4.763.965-6.482 2.684-1.719 1.719-2.684 4.05-2.684 6.481v4.583M36.667 16.042c0 5.063-4.104 9.167-9.167 9.167-5.063 0-9.167-4.104-9.167-9.167 0-5.063 4.104-9.167 9.167-9.167 5.063 0 9.167 4.104 9.167 9.167Z"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </button>
      </header>

      {/* Main */}
      <main className="ibot-main">
        <h2 className="ibot-title">
          Welcome to Idea-Forge <br /> Where Ideas Turn Into Reality
        </h2>

        <div className="ibot-input-wrap" role="group" aria-label="Submit your idea">
          <div className="ibot-input-inner">
            <button
              type="button"
              className="ibot-addfiles-btn"
              onClick={openFilePicker}
              aria-label="Add files"
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
              placeholder="Briefly describe your idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              onKeyDown={onEnter}
              aria-label="Enter your idea"
            />

            <button
              type="button"
              className="ibot-submit-btn"
              onClick={submitIdea}
              disabled={!idea.trim() && files.length === 0}
              aria-label="Submit idea"
            >
              <svg viewBox="0 0 65 60" className="ibot-upload">
                <rect width="65" height="60" rx="30" />
                <path
                  d="M43.33 30 32.5 20 21.67 30M32.5 20v20M59.58 30c0 13.81-12.12 25-27.08 25S5.42 43.81 5.42 30 17.54 5 32.5 5 59.58 16.19 59.58 30Z"
                  stroke="white"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </button>
          </div>

          {files.length > 0 && (
            <ul className="ibot-files-list">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`}>
                  {f.name}
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    aria-label={`Remove ${f.name}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="ibot-example">
          <span className="ibot-example-intro">Example prompt:</span>
          <br />
          <span className="ibot-example-quote">
            “I would like to start a clothing business in Colombo. Initially I want
            to start it as an online business and then expand to a physical store as we grow.”
          </span>
        </p>
      </main>

      {/* Proceed (bottom-right) */}
      <button
        type="button"
        className="ibot-to-dash"
        onClick={() => navigate("/userdashboard")}
      >
        Proceed to Dashboard →
      </button>
    </div>
  );
}
