import React, { createContext, useContext, useState, useEffect } from "react";
import { loginApi, registerApi } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("chat_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem("chat_token") || null);

  const login = async (usernameOrEmail, password) => {
    const data = await loginApi(usernameOrEmail, password);
    setToken(data.access_token);
    const userData = { id: data.user_id, username: data.username, email: data.email };
    setUser(userData);
    localStorage.setItem("chat_token", data.access_token);
    localStorage.setItem("chat_user", JSON.stringify(userData));
    return data;
  };

  const register = async (username, email, password) => {
    const data = await registerApi(username, email, password);
    setToken(data.access_token);
    const userData = { id: data.user_id, username: data.username, email: data.email };
    setUser(userData);
    localStorage.setItem("chat_token", data.access_token);
    localStorage.setItem("chat_user", JSON.stringify(userData));
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("chat_token");
    localStorage.removeItem("chat_user");
  };

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isAuthenticated: !!user, isAuthModalOpen, openAuthModal, closeAuthModal }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
