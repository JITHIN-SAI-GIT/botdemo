import React, { useState } from "react";
import { useChat } from "../context/ChatContext";
import UserDashboardModal from "./UserDashboardModal";
import Skeleton from "./Skeleton";

const Sidebar = () => {
  const {
    sessions,
    activeSessionId,
    selectSession,
    startNewChat,
    searchQuery,
    setSearchQuery,
    handleRenameSession,
    handleTogglePin,
    handleToggleFavorite,
    handleDeleteSession,
    isSidebarOpen,
    isLoading,
  } = useChat();

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  const startRename = (e, session) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const submitRename = (e, sessionId) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      handleRenameSession(sessionId, editTitle.trim());
    }
    setEditingId(null);
  };

  const confirmDelete = (e, sessionId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this chat session?")) {
      handleDeleteSession(sessionId);
    }
  };

  const togglePin = (e, session) => {
    e.stopPropagation();
    handleTogglePin(session.id, session.is_pinned);
  };

  const toggleFavorite = (e, session) => {
    e.stopPropagation();
    handleToggleFavorite(session.id, session.is_favorite);
  };

  const pinnedSessions = sessions.filter((s) => s.is_pinned);
  const favoriteSessions = sessions.filter((s) => s.is_favorite && !s.is_pinned);
  
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const todaySessions = [];
  const yesterdaySessions = [];
  const olderSessions = [];

  sessions.forEach((s) => {
    if (s.is_pinned || s.is_favorite) return;
    const created = new Date(s.updated_at || s.created_at);
    if (created >= todayStart) {
      todaySessions.push(s);
    } else if (created >= yesterdayStart) {
      yesterdaySessions.push(s);
    } else {
      olderSessions.push(s);
    }
  });

  const renderSessionItem = (s) => (
    <div
      key={s.id}
      className={`session-item ${s.id === activeSessionId ? "active" : ""}`}
      onClick={() => selectSession(s.id)}
    >
      {editingId === s.id ? (
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={(e) => submitRename(e, s.id)}
          onKeyDown={(e) => e.key === "Enter" && submitRename(e, s.id)}
          autoFocus
          style={{
            width: "100%",
            background: "var(--bg-primary)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-focus)",
            borderRadius: "4px",
            padding: "2px 6px",
            fontSize: "0.85rem",
          }}
        />
      ) : (
        <>
          <span className="session-title" title={s.title}>
            {s.is_pinned ? "📌 " : s.is_favorite ? "⭐ " : "💬 "}
            {s.title}
          </span>
          <div className="session-actions">
            <button
              className="btn-icon-xs"
              onClick={(e) => togglePin(e, s)}
              title={s.is_pinned ? "Unpin Chat" : "Pin Chat"}
            >
              📌
            </button>
            <button
              className="btn-icon-xs"
              onClick={(e) => toggleFavorite(e, s)}
              title={s.is_favorite ? "Remove Favorite" : "Favorite Chat"}
            >
              ⭐
            </button>
            <button
              className="btn-icon-xs"
              onClick={(e) => startRename(e, s)}
              title="Rename"
            >
              ✏️
            </button>
            <button
              className="btn-icon-xs"
              onClick={(e) => confirmDelete(e, s.id)}
              title="Delete"
            >
              🗑️
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      <aside className={`app-sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <button className="btn-new-chat" onClick={startNewChat}>
            <span>➕</span> New Chat
          </button>

          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="sidebar-history">
          {pinnedSessions.length > 0 && (
            <div>
              <div className="session-group-label">📌 Pinned Chats</div>
              {pinnedSessions.map(renderSessionItem)}
            </div>
          )}

          {favoriteSessions.length > 0 && (
            <div>
              <div className="session-group-label">⭐ Favorite Chats</div>
              {favoriteSessions.map(renderSessionItem)}
            </div>
          )}

          {todaySessions.length > 0 && (
            <div>
              <div className="session-group-label">Today</div>
              {todaySessions.map(renderSessionItem)}
            </div>
          )}

          {yesterdaySessions.length > 0 && (
            <div>
              <div className="session-group-label">Yesterday</div>
              {yesterdaySessions.map(renderSessionItem)}
            </div>
          )}

          {olderSessions.length > 0 && (
            <div>
              <div className="session-group-label">Previous 7 Days & Older</div>
              {olderSessions.map(renderSessionItem)}
            </div>
          )}

          {sessions.length === 0 && isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px 8px' }}>
              <Skeleton height="32px" borderRadius="8px" />
              <Skeleton height="32px" borderRadius="8px" />
              <Skeleton height="32px" borderRadius="8px" />
            </div>
          )}

          {sessions.length === 0 && !isLoading && (
            <div style={{ padding: "16px 8px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              No chat history found. Start a new conversation!
            </div>
          )}
        </div>

        <div
          className="sidebar-footer"
          onClick={() => setIsDashboardOpen(true)}
          style={{ cursor: "pointer" }}
        >
          <div className="user-profile">
            <div className="avatar-circle">U</div>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: "500" }}>Guest User</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Open Dashboard</div>
            </div>
          </div>
        </div>
      </aside>

      <UserDashboardModal isOpen={isDashboardOpen} onClose={() => setIsDashboardOpen(false)} />
    </>
  );
};

export default Sidebar;
