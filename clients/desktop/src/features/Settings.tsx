import { useState, useEffect } from "react";
import { api } from "../services/api";

interface SettingsProps { onLogout: () => void; }

export function Settings({ onLogout }: SettingsProps) {
  const [user, setUser] = useState<any>(null);
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => { api.getMe().then(setUser).catch(() => {}); }, []);

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
        <div className="settings-item"><span>🌙 深色模式</span><span className="settings-value">跟随系统</span></div>
        <div className="settings-item"><span>🌐 语言</span><span className="settings-value">简体中文</span></div>
        <div className="settings-item"><span>🤖 默认模型</span><span className="settings-value">mimo-v2.5-pro</span></div>
        <div className="settings-item"><span>ℹ️ 关于</span><span className="settings-value">v1.0.0</span></div>
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
