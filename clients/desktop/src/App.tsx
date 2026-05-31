import { useState, useEffect } from "react";
import { Layout } from "./components/Layout";
import { Login } from "./features/Login";
import { Chat } from "./features/Chat";
import { Agent } from "./features/Agent";
import { Settings } from "./features/Settings";
import { AuthService } from "./services/auth";
import { api } from "./services/api";

type Page = "login" | "chat" | "agent" | "workflow" | "settings";

export default function App() {
  const [page, setPage] = useState<Page>("login");
  const [isAuthed, setIsAuthed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Restore token from localStorage, then verify with backend
    const token = localStorage.getItem("aios_token");
    if (token) {
      api.setToken(token);
      api.getMe().then((data: any) => {
        if (data?.user || data?.id) {
          setIsAuthed(true);
          setPage("chat");
        } else {
          api.setToken(null);
        }
      }).catch(() => {
        api.setToken(null);
      }).finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthed(true);
    setPage("chat");
  };

  const handleLogout = () => {
    AuthService.clear();
    api.setToken(null);
    setIsAuthed(false);
    setPage("login");
  };

  // Show loading while verifying token
  if (!ready) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", background: "#0a0a0f", color: "#888", fontFamily: "system-ui"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontSize: 48, fontWeight: 700, color: "#6366f1", marginBottom: 16
          }}>A</div>
          <div>加载中...</div>
        </div>
      </div>
    );
  }

  if (!isAuthed) {
    return <Login onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (page) {
      case "chat": return <Chat />;
      case "agent": return <Agent />;
      case "settings": return <Settings onLogout={handleLogout} />;
      default: return <Chat />;
    }
  };

  return (
    <Layout currentPage={page} onNavigate={setPage}>
      {renderPage()}
    </Layout>
  );
}
