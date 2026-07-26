import React, { useRef, useEffect } from "react";
import { useChat } from "../context/ChatContext";
import ChatBubble from "./ChatBubble";
import TypingIndicator from "./TypingIndicator";
import MessageInput from "./MessageInput";

const ChatWindow = () => {
  const { messages, isLoading, isStreaming, sendMessage } = useChat();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isStreaming]);

  const samplePrompts = [
    { title: "🚀 Explain Quantum Computing", desc: "Break down complex concepts simply" },
    { title: "💻 Write a Python Script", desc: "For web scraping or data processing" },
    { title: "🎨 Design a Database Schema", desc: "For an e-commerce platform" },
    { title: "📝 Draft an Email", desc: "Professional project update message" },
  ];

  return (
    <div className="chat-window">
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="welcome-screen">
            <h1 className="welcome-title">What can I help with today?</h1>
            <p className="welcome-subtitle">
              Powered by Google Gemini AI. Ask questions, generate code, analyze text, or brainstorm ideas.
            </p>

            <div className="prompt-suggestions">
              {samplePrompts.map((p, idx) => (
                <div
                  key={idx}
                  className="prompt-card"
                  onClick={() => sendMessage(p.title)}
                >
                  <div className="prompt-card-title">{p.title}</div>
                  <div className="prompt-card-desc">{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="messages-wrapper">
            {messages.map((msg, idx) => (
              <ChatBubble key={msg.id || idx} message={msg} index={idx} />
            ))}
            {isLoading && !isStreaming && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatWindow;
