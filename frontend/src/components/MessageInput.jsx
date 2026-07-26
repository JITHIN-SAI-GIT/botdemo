import React, { useState, useRef } from "react";
import { useChat } from "../context/ChatContext";
import { useSpeech } from "../hooks/useSpeech";

const MessageInput = () => {
  const { sendMessage, stopGenerating, isLoading, isStreaming } = useChat();
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleSpeechResult = (transcript) => {
    setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
  };

  const { isListening, toggleListening } = useSpeech(handleSpeechResult);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;
    sendMessage(text, attachments);
    setText("");
    // Clean up object URLs to avoid memory leaks
    attachments.forEach(att => {
      if (att.previewUrl) URL.revokeObjectURL(att.previewUrl);
    });
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const processFiles = (files) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result.split(',')[1];
        const newAttachment = {
          name: file.name,
          type: file.type, // e.g., 'image/png'
          content: base64Data,
          previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e) => {
    processFiles(e.target.files);
    // Reset input so the same file can be selected again
    e.target.value = null;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => {
      const newAttachments = [...prev];
      if (newAttachments[index].previewUrl) {
        URL.revokeObjectURL(newAttachments[index].previewUrl);
      }
      newAttachments.splice(index, 1);
      return newAttachments;
    });
  };

  return (
    <div 
      className={`input-container ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        border: isDragging ? "2px dashed var(--accent, #aa3bff)" : "none",
        backgroundColor: isDragging ? "var(--accent-bg, rgba(170, 59, 255, 0.1))" : "transparent",
        transition: "all 0.2s ease"
      }}
    >
      {isStreaming && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>
          <button
            onClick={stopGenerating}
            style={{
              padding: "6px 14px",
              borderRadius: "18px",
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-tertiary)",
              color: "var(--text-primary)",
              fontSize: "0.85rem",
              fontWeight: "500",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            ⏹ Stop Generating
          </button>
        </div>
      )}

      <div className="input-box" style={{ flexWrap: 'wrap' }}>
        {attachments.length > 0 && (
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", padding: "8px 12px", width: "100%", borderBottom: "1px solid var(--border, #e5e4e7)" }}>
            {attachments.map((att, idx) => (
              <div
                key={idx}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 8px",
                  borderRadius: "8px",
                  backgroundColor: "var(--code-bg, #f4f3ec)",
                  border: "1px solid var(--border, #e5e4e7)",
                  fontSize: "0.8rem",
                  color: "var(--text, #6b6375)",
                }}
              >
                {att.previewUrl ? (
                  <img src={att.previewUrl} alt="preview" style={{ width: "32px", height: "32px", objectFit: "cover", borderRadius: "4px" }} />
                ) : (
                  <span style={{ fontSize: "1.2rem" }}>📄</span>
                )}
                <span style={{ maxWidth: "120px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {att.name}
                </span>
                <button
                  onClick={() => removeAttachment(idx)}
                  style={{
                    background: "var(--bg, #fff)",
                    border: "1px solid var(--border, #e5e4e7)",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    position: "absolute",
                    top: "-8px",
                    right: "-8px",
                    color: "var(--text, #6b6375)"
                  }}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          className="input-textarea"
          placeholder="Ask Gemini anything... (Shift + Enter for new line, Drag and drop files)"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
          }}
          onKeyDown={handleKeyDown}
          rows={1}
          style={{ width: '100%' }}
        />

        <div className="input-controls" style={{ width: '100%' }}>
          <div className="input-actions-left">
            <button
              className="btn-icon"
              title="Attach File or Image"
              onClick={() => fileInputRef.current?.click()}
            >
              📎
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileChange}
              multiple
            />

            <button
              className={`btn-icon ${isListening ? "active" : ""}`}
              title={isListening ? "Listening... click to stop" : "Voice Input"}
              onClick={toggleListening}
            >
              🎤
            </button>
          </div>

          <button
            className="btn-send"
            onClick={handleSend}
            disabled={(!text.trim() && attachments.length === 0) || isLoading}
            title="Send Message"
          >
            ➔
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
