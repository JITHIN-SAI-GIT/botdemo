import React, { useState, useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import AuthModal from "./components/AuthModal";
import { Toaster, toast } from "react-hot-toast";
import "./styles/theme.css";

const AppContent = () => {
  const { isAuthModalOpen, closeAuthModal } = useAuth();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      toast.success("Back online! Connection restored.");
    };
    const handleOffline = () => {
      setIsOffline(true);
      toast.error("You are offline. Please check your internet connection.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="app-container">
      <Toaster position="top-center" toastOptions={{ style: { background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' } }} />
      <Sidebar />
      <div className="main-content">
        <Header />
        <ChatWindow />
      </div>
      {isOffline && (
        <div style={{ position: "fixed", bottom: 0, width: "100%", backgroundColor: "var(--accent, #aa3bff)", color: "#fff", textAlign: "center", padding: "8px", zIndex: 9999 }}>
          ⚠️ You are currently offline. Changes may not be saved.
        </div>
      )}
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChatProvider>
          <AppContent />
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;