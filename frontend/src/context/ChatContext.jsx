import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import {
  sendMessageApi,
  fetchHistoryApi,
  createSessionApi,
  fetchSessionDetailApi,
  renameSessionApi,
  togglePinSessionApi,
  toggleFavoriteSessionApi,
  deleteSessionApi,
  API_STREAM_URL,
} from "../services/api";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [useStreaming, setUseStreaming] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem("chat_model") || "gemini-2.0-flash");

  const abortControllerRef = useRef(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await fetchHistoryApi();
      setSessions(data);
    } catch (err) {
      console.error("Failed to load chat history sessions:", err);
    }
  };

  const selectSession = async (sessionId) => {
    setActiveSessionId(sessionId);
    try {
      setIsLoading(true);
      const detail = await fetchSessionDetailApi(sessionId);
      setMessages(detail.messages || []);
    } catch (err) {
      console.error("Failed to fetch session detail:", err);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = async () => {
    try {
      const newSession = await createSessionApi("New Conversation");
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setMessages([]);
    } catch (err) {
      console.error("Failed to create new chat session:", err);
      setActiveSessionId(null);
      setMessages([]);
    }
  };

  const handleRenameSession = async (sessionId, newTitle) => {
    try {
      const updated = await renameSessionApi(sessionId, newTitle);
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title: updated.title } : s))
      );
    } catch (err) {
      console.error("Failed to rename session:", err);
    }
  };

  const handleTogglePin = async (sessionId, currentPinned) => {
    try {
      const updated = await togglePinSessionApi(sessionId, !currentPinned);
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, is_pinned: updated.is_pinned } : s))
      );
    } catch (err) {
      console.error("Failed to toggle pin session:", err);
    }
  };

  const handleToggleFavorite = async (sessionId, currentFavorite) => {
    try {
      const updated = await toggleFavoriteSessionApi(sessionId, !currentFavorite);
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, is_favorite: updated.is_favorite } : s))
      );
    } catch (err) {
      console.error("Failed to toggle favorite session:", err);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      await deleteSessionApi(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const handleDeleteMessage = (messageId) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  const handleRegenerate = (messageIndex) => {
    // Find preceding user message
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].sender === "user") {
        sendMessage(messages[i].text);
        break;
      }
    }
  };

  const stopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setIsLoading(false);
  };

  const sendMessage = async (text, attachments = []) => {
    if (!text.trim() && attachments.length === 0) return;

    const userMsgId = Date.now().toString();
    const userMessageObj = {
      id: userMsgId,
      sender: "user",
      text,
      timestamp: new Date().toISOString(),
      attachments,
    };

    const botMsgId = (Date.now() + 1).toString();
    const botPlaceholderObj = {
      id: botMsgId,
      sender: "bot",
      text: "",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessageObj, botPlaceholderObj]);
    setIsLoading(true);

    const temperature = parseFloat(localStorage.getItem("chat_temp") || "0.7");
    const maxTokens = parseInt(localStorage.getItem("chat_max_tokens") || "2048", 10);

    if (useStreaming) {
      setIsStreaming(true);
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch(API_STREAM_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            session_id: activeSessionId,
            model_name: selectedModel,
            attachments,
            temperature,
            max_tokens: maxTokens,
          }),
          signal: controller.signal,
        });

        if (!response.ok) throw new Error("Stream request failed");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let currentBotText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunkText = decoder.decode(value, { stream: true });
          const lines = chunkText.split("\n\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === "start" && data.session_id) {
                  if (!activeSessionId) setActiveSessionId(data.session_id);
                } else if (data.type === "chunk" && data.content) {
                  currentBotText += data.content;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === botMsgId ? { ...msg, text: currentBotText } : msg
                    )
                  );
                } else if (data.type === "end") {
                  if (data.full_text) {
                    currentBotText = data.full_text;
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === botMsgId ? { ...msg, text: currentBotText } : msg
                      )
                    );
                  }
                }
              } catch (e) {
                // Ignore parse errors on partial chunks
              }
            }
          }
        }
        await loadSessions();
      } catch (err) {
        if (err.name === "AbortError") {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMsgId ? { ...msg, text: msg.text + " [Generation Stopped]" } : msg
            )
          );
        } else {
          console.error("Streaming error:", err);
          try {
            const syncData = await sendMessageApi(text, activeSessionId, selectedModel, attachments, temperature, maxTokens);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === botMsgId ? { ...msg, text: syncData.response } : msg
              )
            );
            if (!activeSessionId) setActiveSessionId(syncData.session_id);
          } catch (syncErr) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === botMsgId
                  ? { ...msg, text: "⚠️ Error generating response from Gemini API." }
                  : msg
              )
            );
          }
        }
      } finally {
        setIsStreaming(false);
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    } else {
      try {
        const data = await sendMessageApi(text, activeSessionId, selectedModel, attachments, temperature, maxTokens);
        if (!activeSessionId) setActiveSessionId(data.session_id);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsgId ? { ...msg, text: data.response } : msg
          )
        );
        await loadSessions();
      } catch (err) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsgId
              ? { ...msg, text: "⚠️ Error generating response." }
              : msg
          )
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  const changeModel = (modelName) => {
    setSelectedModel(modelName);
    localStorage.setItem("chat_model", modelName);
  };

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ChatContext.Provider
      value={{
        sessions: filteredSessions,
        rawSessions: sessions,
        activeSessionId,
        messages,
        setMessages,
        isLoading,
        isStreaming,
        useStreaming,
        setUseStreaming,
        selectedModel,
        changeModel,
        searchQuery,
        setSearchQuery,
        isSidebarOpen,
        setIsSidebarOpen,
        selectSession,
        startNewChat,
        sendMessage,
        stopGenerating,
        handleRenameSession,
        handleTogglePin,
        handleToggleFavorite,
        handleDeleteSession,
        handleDeleteMessage,
        handleRegenerate,
        loadSessions,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
