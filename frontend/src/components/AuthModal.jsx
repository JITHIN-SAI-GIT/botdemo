import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const AuthModal = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        toast.success("Successfully logged in!");
      } else {
        await register(username, email, password);
        toast.success("Account created successfully!");
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
      }}
    >
      <div
        style={{
          width: "90%",
          maxWidth: "400px",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "var(--shadow-lg)",
          color: "var(--text-primary)",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem" }}
        >
          ✕
        </button>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "8px", textAlign: "center" }}>
          {isLogin ? "Welcome Back" : "Create Account"}
        </h2>
        <p style={{ textAlign: "center", color: "var(--text-secondary)", marginBottom: "24px", fontSize: "0.9rem" }}>
          {isLogin ? "Sign in to sync your chat history." : "Sign up to save your conversations."}
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {!isLogin && (
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "6px", color: "var(--text-secondary)" }}>Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                placeholder="chat_master_99"
              />
            </div>
          )}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "6px", color: "var(--text-secondary)" }}>Email or Username</label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "6px", color: "var(--text-secondary)" }}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "var(--accent-color, #aa3bff)",
              color: "white",
              fontWeight: "600",
              cursor: isLoading ? "not-allowed" : "pointer",
              marginTop: "8px",
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{ background: "none", border: "none", color: "var(--accent-color, #aa3bff)", cursor: "pointer", fontWeight: "500", textDecoration: "underline" }}
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
