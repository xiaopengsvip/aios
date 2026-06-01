import { useState, useEffect, useRef } from "react";
import { api } from "../services/api";


interface SettingsProps {
  onLogout: () => void;
}

export function Settings({ onLogout }: SettingsProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'profile' | 'security' | 'preferences' | 'about'>('profile');

  // Profile editing
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Password change
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  // Preferences
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [language, setLanguage] = useState('zh-CN');
  const [defaultModel, setDefaultModel] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getMe().then((data: any) => {
      const u = data.user || data;
      setUser(u);
      setDisplayName(u.displayName || u.username || '');
      setBio(u.bio || '');
    }).catch(() => {}).finally(() => setLoading(false));
    const saved = localStorage.getItem('aios_theme') as 'dark' | 'light' || 'dark';
    setTheme(saved);
    setLanguage(localStorage.getItem('aios_lang') || 'zh-CN');
    setDefaultModel(localStorage.getItem('aios_default_model') || '');
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true); setSaveMsg('');
    try {
      await api.patch('/api/auth/profile', { displayName, bio });
      setSaveMsg('✅ 保存成功');
      setTimeout(() => setSaveMsg(''), 2000);
    } catch (e: any) { setSaveMsg('❌ ' + e.message); }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const formData = new FormData(); formData.append('avatar', file);
    try {
      const resp = await fetch(`${api.getPublicBaseUrl()}/api/auth/avatar`, { method: 'POST', body: formData, credentials: 'include' });
      if (resp.ok) {
        const data = await resp.json();
        setUser((u: any) => ({ ...u, avatar: data.avatar }));
      }
    } catch {}
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw) return;
    if (newPw !== confirmPw) { setPwMsg('❌ 两次密码不一致'); return; }
    if (newPw.length < 6) { setPwMsg('❌ 密码至少6位'); return; }
    setPwMsg('');
    try {
      await api.post('/api/auth/change-password', { currentPassword: currentPw, newPassword: newPw });
      setPwMsg('✅ 密码已修改');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (e: any) { setPwMsg('❌ ' + e.message); }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('确定要删除账号？此操作不可撤销！')) return;
    if (!confirm('再次确认：删除后所有数据将被清除。')) return;
    try {
      await api.delete('/api/auth/delete-account');
      onLogout();
    } catch {}
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('aios_theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  const changeLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('aios_lang', lang);
  };

  if (loading) return <div className="loading" style={{ padding: 40 }}>加载中...</div>;

  const sections = [
    { key: 'profile', label: '个人资料', icon: '👤' },
    { key: 'security', label: '安全设置', icon: '🔒' },
    { key: 'preferences', label: '偏好设置', icon: '⚙️' },
    { key: 'about', label: '关于', icon: 'ℹ️' },
  ] as const;

  return (
    <div className="page-container settings-page" style={{ display: 'flex', gap: 0, height: '100%' }}>
      {/* Settings sidebar */}
      <div style={{ width: 200, borderRight: '1px solid var(--border)', padding: '16px 0', flexShrink: 0 }}>
        {sections.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '10px 16px', border: 'none', cursor: 'pointer',
              background: activeSection === s.key ? 'var(--bg)' : 'transparent',
              color: activeSection === s.key ? '#fff' : '#888',
              fontSize: 13, textAlign: 'left',
              borderLeft: activeSection === s.key ? '2px solid #6366f1' : '2px solid transparent',
            }}
          >
            <span>{s.icon}</span>{s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
        {activeSection === 'profile' && (
          <div style={{ maxWidth: 480 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>个人资料</h2>

            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', overflow: 'hidden',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 700, color: '#fff', cursor: 'pointer',
              }} onClick={() => fileInputRef.current?.click()}>
                {user?.avatar ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (user?.displayName || user?.username || '?')[0]}
              </div>
              <div>
                <button className="btn-small" onClick={() => fileInputRef.current?.click()}>更换头像</button>
                <p style={{ fontSize: 11, color: '#888', marginTop: 4 }}>支持 JPG/PNG, 最大 2MB</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
            </div>

            {/* Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: '#888', marginBottom: 4, display: 'block' }}>AI 编号</label>
                <input value={user?.numericAccount || '-'} disabled style={{ opacity: 0.5 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#888', marginBottom: 4, display: 'block' }}>用户名</label>
                <input value={user?.username || ''} disabled style={{ opacity: 0.5 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#888', marginBottom: 4, display: 'block' }}>显示名称</label>
                <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="设置显示名称" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#888', marginBottom: 4, display: 'block' }}>个人简介</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="介绍一下自己..." rows={3} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="btn-send" onClick={handleSaveProfile} disabled={saving}>{saving ? '保存中...' : '保存修改'}</button>
                {saveMsg && <span style={{ fontSize: 12 }}>{saveMsg}</span>}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'security' && (
          <div style={{ maxWidth: 480 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>安全设置</h2>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>修改密码</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input value={currentPw} onChange={e => setCurrentPw(e.target.value)} type="password" placeholder="当前密码" />
                <input value={newPw} onChange={e => setNewPw(e.target.value)} type="password" placeholder="新密码 (至少6位)" />
                <input value={confirmPw} onChange={e => setConfirmPw(e.target.value)} type="password" placeholder="确认新密码" />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button className="btn-send" onClick={handleChangePassword}>修改密码</button>
                  {pwMsg && <span style={{ fontSize: 12 }}>{pwMsg}</span>}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>账号信息</h3>
              <div style={{ fontSize: 13, color: '#888', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span>邮箱: {user?.email || '-'}</span>
                <span>角色: {user?.role || '-'}</span>
                <span>注册时间: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '-'}</span>
                <span>最后登录: {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('zh-CN') : '-'}</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#dc2626' }}>危险区域</h3>
              <button onClick={handleDeleteAccount} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #dc2626', background: 'rgba(220,38,38,0.1)', color: '#dc2626', cursor: 'pointer', fontSize: 13 }}>
                删除账号
              </button>
            </div>
          </div>
        )}

        {activeSection === 'preferences' && (
          <div style={{ maxWidth: 480 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>偏好设置</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="settings-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, border: '1px solid var(--border)', borderRadius: 10 }}>
                <span>🎨 主题</span>
                <button className="chip" onClick={toggleTheme}>{theme === 'dark' ? '🌙 深色' : '☀️ 浅色'}</button>
              </div>

              <div className="settings-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, border: '1px solid var(--border)', borderRadius: 10 }}>
                <span>🌐 语言</span>
                <select value={language} onChange={e => changeLanguage(e.target.value)} style={{ width: 120 }}>
                  <option value="zh-CN">简体中文</option>
                  <option value="en-US">English</option>
                </select>
              </div>

              <div className="settings-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, border: '1px solid var(--border)', borderRadius: 10 }}>
                <span>🤖 默认模型</span>
                <input value={defaultModel} onChange={e => { setDefaultModel(e.target.value); localStorage.setItem('aios_default_model', e.target.value); }} placeholder="mimo-v2.5-pro" style={{ width: 180 }} />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'about' && (
          <div style={{ maxWidth: 480 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>关于 AIOS</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 10 }}>
                <span style={{ color: '#888' }}>版本</span>
                <span style={{ float: 'right' }}>v0.0.8</span>
              </div>
              <div style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 10 }}>
                <span style={{ color: '#888' }}>平台</span>
                <span style={{ float: 'right' }}>Tauri 2 (Windows)</span>
              </div>
              <div style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 10 }}>
                <span style={{ color: '#888' }}>AI Workspace OS</span>
                <span style={{ float: 'right', fontSize: 12, color: '#888' }}>企业级 AI 超级工作台</span>
              </div>
            </div>
            <button onClick={onLogout} style={{ marginTop: 24, width: '100%', padding: 12, borderRadius: 10, border: '1px solid #dc2626', background: 'rgba(220,38,38,0.1)', color: '#dc2626', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
              退出登录
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
