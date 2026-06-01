import { useState, useEffect } from "react";
import { Layout } from "./components/Layout";
import { Login } from "./features/Login";
import { Chat } from "./features/Chat";
import { Agent } from "./features/Agent";
import { Image } from "./features/Image";
import { Video } from "./features/Video";
import { Audio } from "./features/Audio";
import { Files } from "./features/Files";
import { Knowledge } from "./features/Knowledge";
import { Workflow } from "./features/Workflow";
import { Search } from "./features/Search";
import { Marketplace } from "./features/Marketplace";
import { Prompts } from "./features/Prompts";
import { Usage } from "./features/Usage";
import { Credits } from "./features/Credits";
import { Code } from "./features/Code";
import { ApiPlatform } from "./features/ApiPlatform";
import { Settings } from "./features/Settings";
import { UpdateDialog } from "./components/UpdateDialog";
import { AuthService } from "./services/auth";
import { api, UpdateInfo, APP_VERSION } from "./services/api";
import { I18nProvider, useI18n } from "./i18n";

export default function App() {
  return (
    <I18nProvider>
      <AppInner />
    </I18nProvider>
  );
}

type Page = "login" | "chat" | "agent" | "image" | "video" | "audio" | "code" | "files" | "knowledge" | "workflow" | "search" | "marketplace" | "prompts" | "api-platform" | "usage" | "credits" | "settings";

function AppInner() {
  const { t } = useI18n();
  const [page, setPage] = useState<Page>("chat");
  const [isAuthed, setIsAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("aios_token");
    if (token) {
      api.setToken(token);
      api.getMe().then((data: any) => {
        if (data?.user || data?.id) {
          setIsAuthed(true);
        } else {
          api.setToken(null);
        }
      }).catch(() => {
        api.setToken(null);
      }).finally(() => setReady(true));
    } else {
      setReady(true);
    }

    // Update check (startup + every 6h)
    api.checkUpdate(APP_VERSION).then(info => { if (info) setUpdateInfo(info); });
    const interval = setInterval(() => {
      api.checkUpdate(APP_VERSION).then(info => { if (info) setUpdateInfo(info); });
    }, 6 * 60 * 60 * 1000);

    api.reportInstall();
    return () => clearInterval(interval);
  }, []);

  const handleLogin = () => {
    setIsAuthed(true);
    setShowLogin(false);
    setPage("chat");
  };

  const handleLogout = () => {
    AuthService.clear();
    api.setToken(null);
    setIsAuthed(false);
    setPage("chat");
  };

  // Require auth for protected actions
  const requireAuth = (callback?: () => void) => {
    if (!isAuthed) {
      setShowLogin(true);
      return false;
    }
    callback?.();
    return true;
  };

  // Splash screen
  if (!ready) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        height: "100vh", background: "#0a0a0f", gap: 24,
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
        <div style={{ fontSize: 13, color: "#64748b" }}>{t("app.starting")}</div>
        <style>{`@keyframes pulse { 0%,100%{opacity:.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }`}</style>
      </div>
    );
  }

  // Login modal overlay (not full page replacement)
  const LoginOverlay = () => {
    if (!showLogin) return null;
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
      }}>
        <div style={{
          position: "relative", width: 420, maxWidth: "90vw",
          background: "#0f0f1a", borderRadius: 16, padding: "8px 0",
          border: "1px solid #2a2a4a", boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}>
          <button
            onClick={() => setShowLogin(false)}
            style={{
              position: "absolute", top: 12, right: 16, background: "none",
              border: "none", color: "#64748b", fontSize: 20, cursor: "pointer",
            }}
          >✕</button>
          <Login onLogin={handleLogin} />
        </div>
      </div>
    );
  };

  const renderPage = () => {
    const props = { requireAuth, isAuthed };
    switch (page) {
      case "chat": return <Chat {...props} />;
      case "agent": return <Agent />;
      case "image": return <Image {...props} />;
      case "video": return <Video {...props} />;
      case "audio": return <Audio {...props} />;
      case "code": return <Code {...props} />;
      case "files": return <Files {...props} />;
      case "knowledge": return <Knowledge {...props} />;
      case "workflow": return <Workflow {...props} />;
      case "search": return <Search {...props} />;
      case "marketplace": return <Marketplace {...props} />;
      case "prompts": return <Prompts {...props} />;
      case "api-platform": return <ApiPlatform {...props} />;
      case "usage": return <Usage {...props} />;
      case "credits": return <Credits {...props} />;
      case "settings": return isAuthed
        ? <Settings onLogout={handleLogout} />
        : <GuestSettings onLogin={() => setShowLogin(true)} />;
      default: return <Chat {...props} />;
    }
  };

  return (
    <>
      <Layout
        currentPage={page}
        onNavigate={(p) => { setPage(p); }}
        isAuthed={isAuthed}
        onLoginClick={() => setShowLogin(true)}
        onLogout={handleLogout}
      >
        {renderPage()}
      </Layout>
      <LoginOverlay />
      {updateInfo && <UpdateDialog info={updateInfo} onClose={() => setUpdateInfo(null)} />}
    </>
  );
}

// Guest settings page (no auth required)
function GuestSettings({ onLogin }: { onLogin: () => void }) {
  const { t } = useI18n();
  return (
    <div className="page-container settings-page">
      <h2>{t("settings.title")}</h2>
      <div className="settings-group">
        <div className="settings-item"><span>🎨 {t("settings.theme")}</span><span className="settings-value">{t("settings.dark")}</span></div>
        <div className="settings-item"><span>🌐 {t("settings.language")}</span><span className="settings-value">简体中文</span></div>
        <div className="settings-item"><span>🤖 {t("settings.defaultModel")}</span><span className="settings-value">mimo-v2.5-pro</span></div>
        <div className="settings-item"><span>ℹ️ {t("settings.about")}</span><span className="settings-value">v{APP_VERSION}</span></div>
      </div>
      <button className="btn-primary" onClick={onLogin} style={{ marginTop: 16 }}>
        {t("settings.loginRegister")}
      </button>
    </div>
  );
}
