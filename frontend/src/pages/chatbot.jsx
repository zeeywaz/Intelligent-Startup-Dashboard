import React, { useState, useRef } from "react";

const ChatPage = () => {
  const [idea, setIdea] = useState("");
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleSubmit = () => {
    const trimmed = idea.trim();
    if (trimmed || files.length > 0) {
      alert(
        `Idea submitted: "${trimmed}"\nFiles: ${files.map((f) => f.name).join(", ")}`
      );
      console.log("Idea submitted:", trimmed, "Files:", files);
      setIdea("");
      setFiles([]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleAddFilesClick = () => {
    fileInputRef.current.click();
  };

  const handleFilesSelected = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onProfileClick = () => {
    alert("Profile button clicked");
  };

  return (
    <div className="if-container">
      {/* Header */}
      <header className="if-header">
        <h1 className="if-logo" aria-label="IdeaForge">
          IdeaForge
        </h1>

        {/* profile icon button */}
        <button
          type="button"
          className="if-icon-btn"
          aria-label="Open profile"
          onClick={onProfileClick}
        >
          <svg
            className="if-user-icon"
            viewBox="0 0 55 55"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-hidden="true"
          >
            <path
              d="M45.8332 48.125V43.5417C45.8332 41.1105 44.8674 38.7789 43.1483 37.0599C41.4292 35.3408 39.0977 34.375 36.6665 34.375H18.3332C15.902 34.375 13.5704 35.3408 11.8514 37.0599C10.1323 38.7789 9.1665 41.1105 9.1665 43.5417V48.125M36.6665 16.0417C36.6665 21.1043 32.5624 25.2083 27.4998 25.2083C22.4372 25.2083 18.3332 21.1043 18.3332 16.0417C18.3332 10.9791 22.4372 6.875 27.4998 6.875C32.5624 6.875 36.6665 10.9791 36.6665 16.0417Z"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </header>

      {/* Main */}
      <main className="if-main">
        <h2 className="if-title">
          Welcome to Idea-Forge <br />
          Where Ideas Turn Into Reality
        </h2>

        {/* Input */}
        <div className="if-input-wrap" role="group" aria-label="Submit your idea">
          <div className="if-input-inner">
            {/* ADD FILES BUTTON */}
            <button
              type="button"
              className="if-addfiles-btn"
              aria-label="Add files"
              onClick={handleAddFilesClick}
            >
              <svg viewBox="0 0 43 44" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.7085 23.8334H8.9585V20.1667H19.7085V9.16675H23.2918V20.1667H34.0418V23.8334H23.2918V34.8334H19.7085V23.8334Z" />
              </svg>
            
            </button>

            {/* hidden input */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              multiple
              onChange={handleFilesSelected}
            />

            <input
              type="text"
              placeholder="Briefly Describe Your Idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              onKeyDown={handleKeyPress}
              className="if-input"
              aria-label="Enter your idea"
            />

            <button
              type="button"
              className="if-upload-btn"
              onClick={handleSubmit}
              disabled={!idea.trim() && files.length === 0}
              aria-label="Submit idea"
            >
              <svg
                className="if-upload-icon"
                viewBox="0 0 65 60"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <rect width="65" height="60" rx="30" />
                <path
                  d="M43.3332 30L32.4998 20M32.4998 20L21.6665 30M32.4998 20V40M59.5832 30C59.5832 43.8071 47.4575 55 32.4998 55C17.5421 55 5.4165 43.8071 5.4165 30C5.4165 16.1929 17.5421 5 32.4998 5C47.4575 5 59.5832 16.1929 59.5832 30Z"
                  stroke="white"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Selected files list */}
          {files.length > 0 && (
            <ul className="if-files-list">
              {files.map((file, idx) => (
                <li key={idx}>
                  {file.name}
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    aria-label={`Remove ${file.name}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Example */}
        <p className="if-example">
          <span className="if-example-intro">
            You can use the following prompt for your reference:
          </span>
          <br />
          <br />
          <span className="if-example-quote">
            “I would like to start a clothing business in Colombo. Initially I want to
            start it as an online business and then expand it to physical as we grow”
          </span>
        </p>
      </main>

      {/* Styles */}
      <style>{`
        :root {
          --if-bg-1: #417A99;
          --if-bg-2: #2E3444;
          --if-white: #FEFEFE;
          --if-text-dim: #D1D5DB;
        }

        html, body, #root { height: 100%; margin: 0; }
        body {
          background: radial-gradient(1200px 800px at 50% 20%, var(--if-bg-1) 0%, var(--if-bg-2) 70%);
          background-attachment: fixed;
          font-family: 'Roboto', sans-serif;
        }

        .if-container { min-height: 100vh; display: flex; flex-direction: column; }

        .if-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 32px;
        }

        .if-logo {
          margin: 0;
          color: black; /* black text */
          font-family: 'Outfit', sans-serif;
          font-weight: 800; /* bold */
          letter-spacing: .04em;
          font-size: clamp(24px, 2.6vw, 40px);
        }

        .if-icon-btn {
          background: transparent;
          border: none;
          cursor: pointer;
        }
        .if-user-icon { width: 44px; height: 44px; }

        .if-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 24px 16px 56px;
          gap: 28px;
        }

        .if-title {
          margin: 0;
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          letter-spacing: .08em;
          line-height: 1.25;
          font-size: clamp(26px, 4.2vw, 44px);
        }

        .if-input-wrap { width: min(100%, 1024px); }
        .if-input-inner {
          display: flex;
          align-items: center;
          gap: 14px;
          background: #fff;
          border-radius: 999px;
          padding: 14px 18px;
          box-shadow: 9px 11px 8.1px rgba(0,0,0,.25);
        }

        .if-addfiles-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          border: none;
          background: transparent;
          cursor: pointer;
        }
        .if-addfiles-btn svg { width: 24px; height: 24px; fill: black; }
        .if-addfiles-text {
          font-size: 0.95rem;
          font-weight: 600;
          font-family: 'Roboto', sans-serif;
          color: black;
        }

        .if-input {
          flex: 1;
          font: 700 18px/1.2 'Roboto', sans-serif;
          border: none;
          outline: none;
          background: transparent;
          color: #111;
        }

        .if-upload-btn { background: none; border: none; cursor: pointer; }
        .if-upload-icon { width: 64px; height: 58px; }
        .if-upload-icon rect { fill: #000; }
        .if-upload-icon path { stroke: #fff; }

        .if-files-list {
          list-style: none;
          margin: 12px 0 0;
          padding: 0;
          text-align: left;
          font-size: 0.9rem;
          color: white;
        }
        .if-files-list li {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 6px;
        }
        .if-files-list button {
          background: none;
          border: none;
          color: red;
          cursor: pointer;
          font-size: 1rem;
        }

        .if-example {
          color: var(--if-text-dim);
          font-family: 'Roboto', sans-serif;
          font-size: clamp(16px, 2.2vw, 22px);
          line-height: 1.55;
          max-width: 960px;
        }
        .if-example-intro { font-style: italic; font-weight: 400; }
        .if-example-quote { display: block; font-style: italic; font-weight: 700; }
      `}</style>
    </div>
  );
};

export default ChatPage;
