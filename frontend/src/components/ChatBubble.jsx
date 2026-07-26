import React, { useState } from "react";
import MarkdownRenderer from "./MarkdownRenderer";
import { formatTimestamp } from "../utils/formatters";
import { useChat } from "../context/ChatContext";

const ChatBubble = ({ message, index }) => {
  const isUser = message.sender === "user";
  const { handleDeleteMessage, handleRegenerate } = useChat();

  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(message.liked || null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const copyText = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSpeech = () => {
    if (!("speechSynthesis" in window)) {
      alert("Text to speech is not supported in your browser.");
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      window.speechSynthesis.cancel(); // cancel any active speech
      const utterance = new SpeechSynthesisUtterance(message.text);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      setIsPlayingAudio(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleLike = (val) => {
    setLiked((prev) => (prev === val ? null : val));
  };

  return (
    <div className={`chat-message ${isUser ? "user" : "bot"}`}>
      <div className={`msg-avatar ${isUser ? "user" : "bot"}`}>
        {isUser ? "👤" : "🤖"}
      </div>
      <div className="msg-body">
        <div className="msg-bubble">
          {isUser ? (
            <div>{message.text}</div>
          ) : (
            <MarkdownRenderer content={message.text} />
          )}

          {message.attachments && message.attachments.length > 0 && (
            <div style={{ marginTop: "8px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {message.attachments.map((att, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: "0.75rem",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    backgroundColor: "var(--bg-tertiary)",
                    color: "var(--text-secondary)",
                  }}
                >
                  📎 {att.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="msg-meta">
          <span>{formatTimestamp(message.timestamp)}</span>

          <div className="msg-actions">
            <button className="btn-action-sm" onClick={copyText} title="Copy Text">
              {copied ? "✓ Copied" : "📋 Copy"}
            </button>

            <button
              className={`btn-action-sm ${isPlayingAudio ? "active" : ""}`}
              onClick={toggleSpeech}
              title={isPlayingAudio ? "Stop Audio" : "Read Aloud"}
            >
              {isPlayingAudio ? "⏹ Stop" : "🔊 Listen"}
            </button>

            {!isUser && (
              <>
                <button
                  className={`btn-action-sm ${liked === true ? "active" : ""}`}
                  onClick={() => toggleLike(true)}
                  title="Like Response"
                >
                  👍
                </button>
                <button
                  className={`btn-action-sm ${liked === false ? "active" : ""}`}
                  onClick={() => toggleLike(false)}
                  title="Dislike Response"
                >
                  👎
                </button>
                <button
                  className="btn-action-sm"
                  onClick={() => handleRegenerate(index)}
                  title="Regenerate Response"
                >
                  🔄 Regenerate
                </button>
              </>
            )}

            <button
              className="btn-action-sm"
              onClick={() => handleDeleteMessage(message.id)}
              title="Delete Message"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
