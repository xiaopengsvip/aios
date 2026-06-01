import { useEffect, useState } from "react";
import { api } from "../services/api";

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: any) => void;
  isAuthed?: boolean;
  onLoginClick?: () => void;
  onLogout?: () => void;
}

const navItems = [
  { id: "chat", label: "对话", icon: "💬" },
  { id: "agent", label: "Agent", icon: "🤖" },
  { id: "workflow", label: "工作流", icon: "⚡" },
  { id: "settings", label: "设置", icon: "⚙️" },
];

export function Layout({ children, currentPage, onNavigate, isAuthed, onLoginClick, onLogout }: LayoutProps) {
  const [user, setUser] = useState<any>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

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
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
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
