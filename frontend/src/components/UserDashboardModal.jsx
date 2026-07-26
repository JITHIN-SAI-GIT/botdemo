import React from "react";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";

const UserDashboardModal = ({ isOpen, onClose }) => {
  const { rawSessions, messages } = useChat();
  const { user } = useAuth();

  if (!isOpen) return null;

  const totalSessions = rawSessions.length;
  const pinnedCount = rawSessions.filter((s) => s.is_pinned).length;
  const favoriteCount = rawSessions.filter((s) => s.is_favorite).length;

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
          maxWidth: "460px",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "var(--shadow-lg)",
          color: "var(--text-primary)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: "600" }}>👤 User Profile Dashboard</h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem" }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "var(--accent-gradient)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              fontWeight: "600",
            }}
          >
            {user?.username ? user.username[0].toUpperCase() : "G"}
          </div>
          <div>
            <div style={{ fontSize: "1.1rem", fontWeight: "600" }}>
              {user?.username || "Guest User"}
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {user?.email || "guest@demo.local"}
            </div>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "2px 8px",
                borderRadius: "12px",
                backgroundColor: "var(--bg-tertiary)",
                color: "var(--accent-color)",
                marginTop: "4px",
                display: "inline-block",
              }}
            >
              {user ? "Pro Account" : "Free Account"}
            </span>
          </div>
        </div>

        {!user ? (
          <div style={{ marginBottom: "24px", textAlign: "center" }}>
            <button
              onClick={() => { onClose(); openAuthModal(); }}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "var(--accent-color, #aa3bff)",
                color: "white",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Sign In or Register
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: "24px", textAlign: "center" }}>
            <button
              onClick={() => { logout(); onClose(); }}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                backgroundColor: "transparent",
                color: "var(--text-primary)",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Sign Out
            </button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
          <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "var(--bg-tertiary)", textAlign: "center" }}>
            <div style={{ fontSize: "1.4rem", fontWeight: "600", color: "var(--accent-color)" }}>{totalSessions}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Conversations</div>
          </div>

          <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "var(--bg-tertiary)", textAlign: "center" }}>
            <div style={{ fontSize: "1.4rem", fontWeight: "600", color: "var(--accent-color)" }}>{messages.length}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Messages in Active Chat</div>
          </div>

          <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "var(--bg-tertiary)", textAlign: "center" }}>
            <div style={{ fontSize: "1.4rem", fontWeight: "600", color: "var(--accent-color)" }}>{pinnedCount}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Pinned Chats</div>
          </div>

          <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "var(--bg-tertiary)", textAlign: "center" }}>
            <div style={{ fontSize: "1.4rem", fontWeight: "600", color: "var(--accent-color)" }}>{favoriteCount}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Favorite Chats</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
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
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDashboardModal;
