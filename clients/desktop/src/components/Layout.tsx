import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useI18n } from "../i18n";

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: any) => void;
  isAuthed?: boolean;
  onLoginClick?: () => void;
  onLogout?: () => void;
}

export function Layout({ children, currentPage, onNavigate, isAuthed, onLoginClick, onLogout: _onLogout }: LayoutProps) {
  const { t } = useI18n();
  const [user, setUser] = useState<any>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const navItems = [
    { id: "chat", label: t("nav.chat"), icon: "💬" },
    { id: "agent", label: t("nav.agent"), icon: "🤖" },
    { id: "image", label: "绘图", icon: "🎨" },
    { id: "video", label: "视频", icon: "🎬" },
    { id: "audio", label: "音频", icon: "🎵" },
    { id: "files", label: "文件", icon: "📁" },
    { id: "knowledge", label: "知识库", icon: "📚" },
    { id: "workflow", label: t("nav.workflow"), icon: "⚡" },
    { id: "search", label: "搜索", icon: "🔍" },
    { id: "marketplace", label: "市场", icon: "🏪" },
    { id: "prompts", label: "提示词", icon: "💡" },
    { id: "usage", label: "统计", icon: "📊" },
    { id: "credits", label: "积分", icon: "💰" },
    { id: "settings", label: t("nav.settings"), icon: "⚙️" },
  ];

  useEffect(() => {
    if (isAuthed) {
      api.getMe().then(setUser).catch(() => {});
    } else {
      setUser(null);
    }
    const saved = localStorage.getItem("aios_theme") as "dark" | "light" || "dark";
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, [isAuthed]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("aios_theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="logo">A</span>
          <span className="logo-text">AIOS</span>
          <button className="theme-toggle" onClick={toggleTheme} style={{ marginLeft: "auto" }}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${currentPage === item.id ? "active" : ""}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          {user ? (
            <div className="user-info">
              <div className="user-avatar">{(user.displayName || user.username || "?")[0]}</div>
              <div className="user-details">
                <div className="user-name">{user.displayName || user.username}</div>
                <div className="user-id">AI: {user.numericAccount || "-"}</div>
              </div>
            </div>
          ) : (
            <button
              className="login-btn"
              onClick={onLoginClick}
              style={{
                width: "100%", padding: "8px 16px", borderRadius: 10,
                background: "linear-gradient(135deg, #6366f1, #7c3aed)",
                border: "none", color: "#fff", fontSize: 13, fontWeight: 600,
                cursor: "pointer", marginTop: 8,
              }}
            >
              登录 / 注册
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
