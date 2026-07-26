import React from "react";

const TypingIndicator = () => {
  return (
    <div className="chat-message bot">
      <div className="msg-avatar bot">🤖</div>
      <div className="msg-body">
        <div className="typing-indicator">
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
