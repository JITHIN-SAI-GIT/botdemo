import React, { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import SettingsModal from "./SettingsModal";
import { useChat } from "../context/ChatContext";
import { exportChatAsMarkdown, exportChatAsTxt, exportChatAsJson } from "../utils/formatters";

const Header = () => {
  const {
    isSidebarOpen,
    setIsSidebarOpen,
    messages,
    sessions,
    activeSessionId,
    selectedModel,
    changeModel,
  } = useChat();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const currentSession = sessions.find((s) => s.id === activeSessionId);
  const sessionTitle = currentSession?.title || "Gemini Chat";

  const handleExport = (format) => {
    if (!messages || messages.length === 0) {
      alert("No messages to export in current conversation.");
      return;
    }
    if (format === "md") exportChatAsMarkdown(sessionTitle, messages);
    else if (format === "txt") exportChatAsTxt(sessionTitle, messages);
    else if (format === "json") exportChatAsJson(sessionTitle, messages);
    setShowExportMenu(false);
  };

  return (
    <>
      <header className="app-header">
        <div className="header-left">
          <button
            className="btn-icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title="Toggle Sidebar"
          >
            ☰
          </button>
          <span className="brand-title">🤖 Gemini AI</span>

          <select
            value={selectedModel}
            onChange={(e) => changeModel(e.target.value)}
            style={{
              padding: "4px 8px",
              borderRadius: "16px",
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              color: "var(--text-secondary)",
              fontSize: "0.8rem",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="gemini-3.6-flash">Gemini 3.6 Flash</option>
            <option value="gemini-flash-latest">Gemini Flash Latest</option>
          </select>
        </div>

        <div className="header-right">
          {messages.length > 0 && (
            <div style={{ position: "relative" }}>
              <button
                className="btn-action-sm"
                onClick={() => setShowExportMenu(!showExportMenu)}
                title="Export Transcript"
              >
                📥 Export ▾
              </button>
              {showExportMenu && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: "4px",
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    boxShadow: "var(--shadow-md)",
                    display: "flex",
                    flexDirection: "column",
                    zIndex: 100,
                  }}
                >
                  <button
                    onClick={() => handleExport("md")}
                    style={{ padding: "8px 14px", border: "none", background: "none", color: "var(--text-primary)", cursor: "pointer", textAlign: "left", fontSize: "0.85rem" }}
                  >
                    📝 Markdown (.md)
                  </button>
                  <button
                    onClick={() => handleExport("txt")}
                    style={{ padding: "8px 14px", border: "none", background: "none", color: "var(--text-primary)", cursor: "pointer", textAlign: "left", fontSize: "0.85rem" }}
                  >
                    📄 Text (.txt)
                  </button>
                  <button
                    onClick={() => handleExport("json")}
                    style={{ padding: "8px 14px", border: "none", background: "none", color: "var(--text-primary)", cursor: "pointer", textAlign: "left", fontSize: "0.85rem" }}
                  >
                    📊 JSON (.json)
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            className="btn-icon"
            onClick={() => setIsSettingsOpen(true)}
            title="Settings"
          >
            ⚙️
          </button>

          <ThemeToggle />
        </div>
      </header>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
};

export default Header;
