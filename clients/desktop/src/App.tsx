import { useState, useEffect } from "react";
import { Layout } from "./components/Layout";
import { Login } from "./features/Login";
import { Chat } from "./features/Chat";
import { Agent } from "./features/Agent";
import { Settings } from "./features/Settings";
import { UpdateDialog } from "./components/UpdateDialog";
import { AuthService } from "./services/auth";
import { api, UpdateInfo, APP_VERSION } from "./services/api";

type Page = "login" | "chat" | "agent" | "workflow" | "settings";

export default function App() {
  const [page, setPage] = useState<Page>("login");
  const [isAuthed, setIsAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

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

    // Check for updates on startup (learned from hermes-web-ui)
    api.checkUpdate(APP_VERSION).then((info) => {
      if (info) setUpdateInfo(info);
    });

    // Re-check every 6 hours (learned from hermes-web-ui updater pattern)
    const updateInterval = setInterval(() => {
      api.checkUpdate(APP_VERSION).then((info) => {
        if (info) setUpdateInfo(info);
      });
    }, 6 * 60 * 60 * 1000);

    // Report device install
    api.reportInstall();

    return () => clearInterval(updateInterval);
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

  // Splash screen (learned from hermes-web-ui)
  if (!ready) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        height: "100vh", background: "#0a0a0f", color: "#888", fontFamily: "system-ui",
        gap: 24,
      }}>
        <div style={{
          fontSize: 48, fontWeight: 700,
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>A</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#e2e8f0" }}>AIOS</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 10, height: 10, borderRadius: "50%", background: "#6366f1",
              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
        <div style={{ fontSize: 13, color: "#64748b" }}>启动中...</div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.3; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <>
        <Login onLogin={handleLogin} />
        {updateInfo && <UpdateDialog info={updateInfo} onClose={() => setUpdateInfo(null)} />}
      </>
    );
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
    <>
      <Layout currentPage={page} onNavigate={setPage}>
        {renderPage()}
      </Layout>
      {updateInfo && <UpdateDialog info={updateInfo} onClose={() => setUpdateInfo(null)} />}
    </>
  );
}
