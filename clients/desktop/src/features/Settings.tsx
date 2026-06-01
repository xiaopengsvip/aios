import { useState, useEffect } from "react";
import { api, APP_VERSION } from "../services/api";

interface SettingsProps { onLogout: () => void; }

export function Settings({ onLogout }: SettingsProps) {
  const [user, setUser] = useState<any>(null);
  const [showLogout, setShowLogout] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");

  useEffect(() => {
    api.getMe().then(setUser).catch(() => {});
    const saved = localStorage.getItem("aios_theme") || "dark";
    setTheme(saved as any);
  }, []);

  const handleThemeChange = (t: "dark" | "light" | "system") => {
    setTheme(t);
    localStorage.setItem("aios_theme", t);
    if (t === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", isDark);
    } else {
      document.documentElement.classList.toggle("dark", t === "dark");
    }
  };

  const handleCheckUpdate = async () => {
    const info = await api.checkUpdate(APP_VERSION);
    if (info) {
      window.open(info.downloadUrl, "_blank");
    } else {
      alert("当前已是最新版本 v" + APP_VERSION);
    }
  };

  const themeLabels: Record<string, string> = { dark: "深色", light: "浅色", system: "跟随系统" };

  return (
    <div className="page-container settings-page">
      <h2>设置</h2>

      {user && (
        <div className="profile-card">
          <div className="profile-avatar">{(user.displayName || user.username || "?")[0]}</div>
          <div className="profile-info">
            <div className="profile-name">{user.displayName || user.username}</div>
            <div className="profile-email">{user.email}</div>
            <div className="profile-id">AI: {user.numericAccount || "-"}</div>
          </div>
          <div className="profile-balance">余额: {user.balance} 积分</div>
        </div>
      )}

      <div className="settings-group">
        <div className="settings-item">
          <span>🎨 主题模式</span>
          <div className="settings-value" style={{ display: "flex", gap: 8 }}>
            {(["dark", "light", "system"] as const).map(t => (
              <button
                key={t}
                onClick={() => handleThemeChange(t)}
                style={{
                  padding: "4px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer",
                  background: theme === t ? "#6366f1" : "#252540",
                  color: theme === t ? "#fff" : "#94a3b8",
                  border: theme === t ? "1px solid #6366f1" : "1px solid #3a3a5a",
                }}
              >{themeLabels[t]}</button>
            ))}
          </div>
        </div>
        <div className="settings-item"><span>🌐 语言</span><span className="settings-value">简体中文</span></div>
        <div className="settings-item"><span>🤖 默认模型</span><span className="settings-value">mimo-v2.5-pro</span></div>
        <div className="settings-item"><span>ℹ️ 关于</span><span className="settings-value">v{APP_VERSION}</span></div>
        <div
          className="settings-item"
          onClick={handleCheckUpdate}
          style={{ cursor: "pointer" }}
        >
          <span>🔄 检查更新</span>
          <span className="settings-value">v{APP_VERSION}</span>
        </div>
      </div>

      <button className="btn-danger" onClick={() => setShowLogout(true)}>退出登录</button>

      {showLogout && (
        <div className="modal-overlay" onClick={() => setShowLogout(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>确认退出</h3>
            <p>确定要退出登录吗？</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowLogout(false)}>取消</button>
              <button className="btn-danger" onClick={onLogout}>确定退出</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
