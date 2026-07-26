import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const sendMessageApi = async (message, sessionId = null, modelName = null, attachments = [], temperature = 0.7, maxTokens = 2048) => {
  const response = await API.post("/chat", {
    message,
    session_id: sessionId,
    model_name: modelName,
    attachments,
    temperature,
    max_tokens: maxTokens
  });
  return response.data;
};

export const fetchHistoryApi = async (userId = "guest") => {
  const response = await API.get(`/api/history?user_id=${userId}`);
  return response.data;
};

export const createSessionApi = async (title = "New Conversation") => {
  const response = await API.post("/api/history", { title });
  return response.data;
};

export const fetchSessionDetailApi = async (sessionId) => {
  const response = await API.get(`/api/history/${sessionId}`);
  return response.data;
};

export const renameSessionApi = async (sessionId, title) => {
  const response = await API.patch(`/api/history/${sessionId}`, { title });
  return response.data;
};

export const togglePinSessionApi = async (sessionId, isPinned) => {
  const response = await API.patch(`/api/history/${sessionId}`, { is_pinned: isPinned });
  return response.data;
};

export const toggleFavoriteSessionApi = async (sessionId, isFavorite) => {
  const response = await API.patch(`/api/history/${sessionId}`, { is_favorite: isFavorite });
  return response.data;
};

export const deleteSessionApi = async (sessionId) => {
  const response = await API.delete(`/api/history/${sessionId}`);
  return response.data;
};

export const loginApi = async (usernameOrEmail, password) => {
  const response = await API.post("/api/auth/login", {
    username_or_email: usernameOrEmail,
    password,
  });
  return response.data;
};

export const registerApi = async (username, email, password) => {
  const response = await API.post("/api/auth/register", {
    username,
    email,
    password,
  });
  return response.data;
};

export const API_STREAM_URL = `${API_BASE_URL}/api/chat/stream`;

export default API;