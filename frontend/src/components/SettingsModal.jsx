import React, { useState } from "react";
import { useChat } from "../context/ChatContext";

const SettingsModal = ({ isOpen, onClose }) => {
  const { selectedModel, changeModel, useStreaming, setUseStreaming } = useChat();

  const [temperature, setTemperature] = useState(() => localStorage.getItem("chat_temp") || "0.7");
  const [maxTokens, setMaxTokens] = useState(() => localStorage.getItem("chat_max_tokens") || "2048");
  const [fontSize, setFontSize] = useState(() => localStorage.getItem("chat_font_size") || "medium");

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem("chat_temp", temperature);
    localStorage.setItem("chat_max_tokens", maxTokens);
    localStorage.setItem("chat_font_size", fontSize);
    document.documentElement.style.fontSize =
      fontSize === "small" ? "14px" : fontSize === "large" ? "18px" : "16px";
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: "90%",
          maxWidth: "480px",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "var(--shadow-lg)",
          color: "var(--text-primary)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: "600" }}>⚙️ AI Chatbot Settings</h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem" }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "6px", color: "var(--text-secondary)" }}>
              Active AI Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => changeModel(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                backgroundColor: "var(--bg-tertiary)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
              }}
            >
              <option value="gemini-2.0-flash">Gemini 2.0 Flash (Fast & Precise)</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gemini-3.6-flash">Gemini 3.6 Flash (High Performance)</option>
              <option value="gemini-flash-latest">Gemini Flash Latest</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "6px", color: "var(--text-secondary)" }}>
              Temperature ({temperature})
            </label>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "6px", color: "var(--text-secondary)" }}>
              Max Token Output
            </label>
            <select
              value={maxTokens}
              onChange={(e) => setMaxTokens(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                backgroundColor: "var(--bg-tertiary)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
              }}
            >
              <option value="1024">1024 Tokens</option>
              <option value="2048">2048 Tokens</option>
              <option value="4096">4096 Tokens</option>
              <option value="8192">8192 Tokens</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "6px", color: "var(--text-secondary)" }}>
              Font Size
            </label>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                backgroundColor: "var(--bg-tertiary)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
              }}
            >
              <option value="small">Small (14px)</option>
              <option value="medium">Medium (16px)</option>
              <option value="large">Large (18px)</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.9rem" }}>Real-time Streaming Response</span>
            <input
              type="checkbox"
              checked={useStreaming}
              onChange={(e) => setUseStreaming(e.target.checked)}
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
          </div>
        </div>

        <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              backgroundColor: "transparent",
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "var(--accent-color)",
              color: "white",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
