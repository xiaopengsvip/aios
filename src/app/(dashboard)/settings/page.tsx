'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

interface UserProfile {
  id: string;
  numericAccount: string | null;
  avatar: string;
  displayName: string;
  username: string;
  email: string;
  bio: string;
  role: string;
  balance: number;
  createdAt: string;
  lastLoginAt: string | null;
  usernameChangedAt: string | null;
}

interface UsernameCooldown {
  until: string;
  remainingDays: number;
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [originalUsername, setOriginalUsername] = useState('');
  const [usernameCooldown, setUsernameCooldown] = useState<UsernameCooldown | null>(null);
  const [showUsernameConfirm, setShowUsernameConfirm] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // OAuth state
  const [oauthAccounts, setOauthAccounts] = useState<any[]>([]);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthMessage, setOauthMessage] = useState('');

  // Password state
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState('');

  // Preferences state
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('zh-CN');
  const [defaultModel, setDefaultModel] = useState('gpt-4o');
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [prefsMsg, setPrefsMsg] = useState('');

  // Billing state
  const [balance, setBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Danger zone
  const [dangerPassword, setDangerPassword] = useState('');
  const [dangerMsg, setDangerMsg] = useState('');

  const models = ['gpt-4o', 'gpt-4o-mini', 'claude-sonnet-4-20250514', 'claude-opus-4-20250514', 'gemini-2.5-pro', 'deepseek-chat', 'qwen-max', 'grok-3'];

  // ── Load profile ──
  useEffect(() => {
    fetch('/api/auth/profile').then(r => r.ok ? r.json() : null).then(data => {
      if (data?.user) {
        const u = data.user;
        setProfile({ ...u, balance: Number(u.balance || 0) });
        setOriginalUsername(u.username || '');
        setUsernameCooldown(data.usernameCooldown || null);
      }
    }).catch(() => {}).finally(() => setProfileLoading(false));

    fetch('/api/auth/oauth/accounts').then(r => r.json()).then(d => setOauthAccounts(d.accounts || [])).catch(() => {});

    fetch('/api/auth/preferences').then(r => r.ok ? r.json() : null).then(d => {
      if (d) { setTheme(d.theme || 'dark'); setLanguage(d.locale || 'zh-CN'); setDefaultModel(d.defaultModel || 'gpt-4o'); }
    }).catch(() => {});

    fetch('/api/credits/balance').then(r => r.ok ? r.json() : null).then(d => { if (d) setBalance(d); }).catch(() => {});
    fetch('/api/credits/transactions?limit=20').then(r => r.ok ? r.json() : null).then(d => { if (d?.transactions) setTransactions(d.transactions); }).catch(() => {});
  }, []);

  // OAuth bind result
  useEffect(() => {
    const oauthBind = searchParams.get('oauth_bind');
    if (oauthBind === 'success') { setOauthMessage('第三方账号绑定成功！'); setTimeout(() => setOauthMessage(''), 5000); }
  }, [searchParams]);

  // ── Handlers ──
  const handleSaveProfile = async () => {
    if (!profile) return;
    // 如果用户名改了，先弹确认
    if (profile.username !== originalUsername && !showUsernameConfirm) {
      setShowUsernameConfirm(true);
      return;
    }
    setShowUsernameConfirm(false);
    setProfileSaving(true); setProfileMsg('');
    try {
      const res = await fetch('/api/auth/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ displayName: profile.displayName, username: profile.username, email: profile.email, bio: profile.bio }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOriginalUsername(profile.username);
      setProfileMsg('✓ 保存成功'); setTimeout(() => setProfileMsg(''), 3000);
    } catch (e: any) { setProfileMsg(e.message || '保存失败'); } finally { setProfileSaving(false); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData(); fd.append('avatar', file);
    try {
      const res = await fetch('/api/auth/avatar', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfile(prev => prev ? { ...prev, avatar: data.avatar } : prev);
      setProfileMsg('✓ 头像已更新'); setTimeout(() => setProfileMsg(''), 3000);
    } catch (e: any) { setProfileMsg(e.message || '上传失败'); }
  };

  const handleChangePassword = async () => {
    setPwLoading(true); setPwMsg('');
    if (passwords.new !== passwords.confirm) { setPwMsg('两次密码不一致'); setPwLoading(false); return; }
    if (passwords.new.length < 8) { setPwMsg('新密码至少 8 位'); setPwLoading(false); return; }
    try {
      const res = await fetch('/api/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.new }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPwMsg('✓ 密码已更新'); setPasswords({ current: '', new: '', confirm: '' });
    } catch (e: any) { setPwMsg(e.message || '修改失败'); } finally { setPwLoading(false); }
  };

  const handleSavePreferences = async () => {
    setPrefsLoading(true); setPrefsMsg('');
    try {
      const res = await fetch('/api/auth/preferences', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ theme, locale: language, defaultModel }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setPrefsMsg('✓ 偏好已保存'); setTimeout(() => setPrefsMsg(''), 3000);
    } catch (e: any) { setPrefsMsg(e.message || '保存失败'); } finally { setPrefsLoading(false); }
  };

  const handleUnbind = async (provider: string) => {
    if (!confirm(`确定解绑 ${provider}？`)) return;
    setOauthLoading(true);
    try {
      const res = await fetch('/api/auth/oauth/accounts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOauthAccounts(prev => prev.filter(a => a.provider !== provider.toUpperCase()));
    } catch (e: any) { alert(e.message || '解绑失败'); } finally { setOauthLoading(false); }
  };

  const handleClearData = async () => {
    if (!confirm('确定清除所有数据？此操作不可恢复！')) return;
    try {
      const res = await fetch('/api/auth/delete-account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: dangerPassword || undefined }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDangerMsg('✓ 数据已清除');
    } catch (e: any) { setDangerMsg(e.message || '清除失败'); }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('⚠️ 确定删除账号？此操作不可恢复！')) return;
    try {
      const res = await fetch('/api/auth/delete-account', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: dangerPassword || undefined }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = '/';
    } catch (e: any) { setDangerMsg(e.message || '删除失败'); }
  };

  const isBound = (provider: string) => oauthAccounts.some(a => a.provider === provider.toUpperCase());

  const tabs = [
    { id: 'profile', label: t('tabs.profile'), icon: '👤' },
    { id: 'security', label: t('tabs.security'), icon: '🔒' },
    { id: 'linked', label: t('tabs.linked'), icon: '🔗' },
    { id: 'preferences', label: t('tabs.preferences'), icon: '⚙️' },
    { id: 'billing', label: t('tabs.billing'), icon: '💰' },
    { id: 'danger', label: t('tabs.danger'), icon: '⚠️' },
  ];

  if (profileLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="h-14 flex items-center justify-between px-4 border-b border-border bg-card">
        <h1 className="text-sm font-semibold">⚙️ {t('title')}</h1>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="md:w-56 border-b md:border-b-0 md:border-r border-border bg-card p-2 md:p-3 shrink-0 overflow-x-auto md:overflow-x-visible">
          <nav className="flex md:flex-col gap-1 md:space-y-1">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-xl text-sm whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <div className="max-w-2xl">

            {/* ── Profile ── */}
            {activeTab === 'profile' && profile && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <h2 className="text-lg font-semibold mb-4">{t('profile.title')}</h2>

                {/* ID display */}
                <div className="rounded-xl border border-border bg-card/50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">AI 账号</p>
                      <p className="text-lg font-mono font-semibold">{profile.numericAccount || '未分配'}</p>
                    </div>
                  </div>
                </div>

                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold overflow-hidden">
                    {profile.avatar ? <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" /> : (profile.displayName?.charAt(0) || profile.username?.charAt(0) || '?')}
                  </div>
                  <div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-lg bg-muted text-sm hover:bg-muted/80 transition-all">{t('profile.changeAvatar')}</button>
                    <p className="text-xs text-muted-foreground mt-1">JPG/PNG/GIF/WEBP，最大 5MB</p>
                  </div>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  {[
                    { key: 'displayName', label: t('profile.displayName'), value: profile.displayName },
                    { key: 'email', label: t('profile.email'), value: profile.email },
                    { key: 'bio', label: '简介', value: profile.bio || '' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">{field.label}</label>
                      <input value={field.value} onChange={e => setProfile(prev => prev ? { ...prev, [field.key]: e.target.value } : prev)}
                        className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-indigo-500" />
                    </div>
                  ))}
                  {/* Username field - with cooldown warning */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('profile.username')}</label>
                    <input value={profile.username} onChange={e => { setProfile(prev => prev ? { ...prev, username: e.target.value } : prev); setShowUsernameConfirm(false); }}
                      className={`w-full px-3 py-2 rounded-lg bg-muted border text-sm text-foreground focus:outline-none focus:border-indigo-500 ${
                        profile.username !== originalUsername ? 'border-amber-500' : 'border-border'
                      }`} />
                    {usernameCooldown && usernameCooldown.remainingDays > 0 ? (
                      <p className="mt-1.5 text-xs text-amber-500">⚠️ 用户名需 {usernameCooldown.remainingDays} 天后才能再次修改</p>
                    ) : profile.username !== originalUsername ? (
                      <p className="mt-1.5 text-xs text-amber-500">⚠️ 修改用户名后 30 天内不可再次修改，旧用户名将冻结 7 天</p>
                    ) : (
                      <p className="mt-1.5 text-xs text-muted-foreground">30 天内仅可修改一次，旧用户名冻结 7 天</p>
                    )}
                  </div>
                </div>

                {/* Username change confirmation */}
                {showUsernameConfirm && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
                    <p className="text-sm text-amber-400 font-medium">⚠️ 确认修改用户名？</p>
                    <p className="text-xs text-muted-foreground">
                      修改后 <b>30 天内不可再次修改</b>，旧用户名 <b>{originalUsername}</b> 将被冻结 7 天。
                    </p>
                    <div className="flex gap-2">
                      <button onClick={handleSaveProfile} className="px-4 py-1.5 rounded-lg bg-amber-600 text-sm text-white hover:bg-amber-500 transition-all">
                        确认修改
                      </button>
                      <button onClick={() => { setShowUsernameConfirm(false); setProfile(prev => prev ? { ...prev, username: originalUsername } : prev); }} className="px-4 py-1.5 rounded-lg bg-muted text-sm hover:bg-muted/80 transition-all">
                        取消
                      </button>
                    </div>
                  </div>
                )}

                {profileMsg && <span className={`text-sm ${profileMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{profileMsg}</span>}
                <button onClick={handleSaveProfile} disabled={profileSaving} className="px-4 py-2.5 rounded-xl bg-indigo-600 text-sm font-medium hover:bg-indigo-500 transition-all disabled:opacity-50">
                  {profileSaving ? '保存中...' : t('profile.save')}
                </button>
              </motion.div>
            )}

            {/* ── Security ── */}
            {activeTab === 'security' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <h2 className="text-lg font-semibold mb-4">{t('security.title')}</h2>

                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="text-sm font-semibold mb-4">{t('security.changePassword')}</h3>
                  <div className="space-y-4">
                    {[
                      { key: 'current', label: t('security.currentPassword'), type: 'password' },
                      { key: 'new', label: t('security.newPassword'), type: 'password' },
                      { key: 'confirm', label: t('security.confirmNewPassword'), type: 'password' },
                    ].map(field => (
                      <div key={field.key}>
                        <label className="text-xs font-medium text-muted-foreground mb-2 block">{field.label}</label>
                        <input type={field.type} value={passwords[field.key as keyof typeof passwords]}
                          onChange={e => setPasswords(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-indigo-500" />
                      </div>
                    ))}
                    <button onClick={handleChangePassword} disabled={pwLoading} className="px-4 py-2.5 rounded-xl bg-indigo-600 text-sm font-medium hover:bg-indigo-500 transition-all disabled:opacity-50">
                      {pwLoading ? '修改中...' : t('security.updatePassword')}
                    </button>
                    {pwMsg && <p className={`text-sm ${pwMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{pwMsg}</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Linked Accounts ── */}
            {activeTab === 'linked' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <h2 className="text-lg font-semibold mb-4">关联账号</h2>
                <p className="text-sm text-muted-foreground mb-6">绑定第三方账号后可快速登录</p>

                {oauthMessage && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm">{oauthMessage}</div>}

                {[
                  { id: 'github', name: 'GitHub', color: 'bg-gray-800', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg> },
                  { id: 'google', name: 'Google', color: 'bg-white', icon: <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> },
                  { id: 'twitter', name: 'X (Twitter)', color: 'bg-black', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
                ].map(p => {
                  const bound = isBound(p.id);
                  const account = oauthAccounts.find(a => a.provider === p.id.toUpperCase());
                  return (
                    <div key={p.id} className="rounded-xl border border-border bg-card/50 p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl ${p.color} flex items-center justify-center`}>{p.icon}</div>
                        <div>
                          <h3 className="text-sm font-medium">{p.name}</h3>
                          {bound && account ? <p className="text-xs text-muted-foreground mt-0.5">已绑定 · {account.providerUsername || account.providerEmail || account.providerAccountId}</p> : <p className="text-xs text-muted-foreground mt-0.5">未绑定</p>}
                        </div>
                      </div>
                      {bound ? (
                        <button onClick={() => handleUnbind(p.id)} disabled={oauthLoading} className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/10 transition-all disabled:opacity-50">解绑</button>
                      ) : (
                        <a href={`/api/auth/oauth/${p.id}?action=bind`} className="px-4 py-2 rounded-lg bg-indigo-600 text-foreground text-xs font-medium hover:bg-indigo-500 transition-all">绑定</a>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* ── Preferences ── */}
            {activeTab === 'preferences' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <h2 className="text-lg font-semibold mb-4">{t('preferences.title')}</h2>
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-card/50 p-4">
                    <div className="flex items-center justify-between">
                      <div><h3 className="text-sm font-semibold">{t('preferences.theme')}</h3><p className="text-xs text-muted-foreground mt-1">{t('preferences.themeDesc')}</p></div>
                      <div className="flex gap-2">
                        {['dark', 'light'].map(th => (
                          <button key={th} onClick={() => setTheme(th)} className={`px-4 py-2 rounded-lg text-sm transition-all ${theme === th ? 'bg-indigo-600 text-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                            {th === 'dark' ? `🌙 ${t('preferences.dark')}` : `☀️ ${t('preferences.light')}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card/50 p-4">
                    <div className="flex items-center justify-between">
                      <div><h3 className="text-sm font-semibold">{t('preferences.language')}</h3><p className="text-xs text-muted-foreground mt-1">{t('preferences.languageDesc')}</p></div>
                      <div className="flex gap-2">
                        {[{ id: 'zh-CN', label: '中文' }, { id: 'en-US', label: 'English' }].map(l => (
                          <button key={l.id} onClick={() => setLanguage(l.id)} className={`px-4 py-2 rounded-lg text-sm transition-all ${language === l.id ? 'bg-indigo-600 text-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                            {l.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card/50 p-4">
                    <div className="flex items-center justify-between">
                      <div><h3 className="text-sm font-semibold">{t('preferences.defaultModel')}</h3><p className="text-xs text-muted-foreground mt-1">{t('preferences.defaultModelDesc')}</p></div>
                      <select value={defaultModel} onChange={e => setDefaultModel(e.target.value)} className="px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-indigo-500">
                        {models.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <button onClick={handleSavePreferences} disabled={prefsLoading} className="px-4 py-2.5 rounded-xl bg-indigo-600 text-sm font-medium hover:bg-indigo-500 transition-all disabled:opacity-50">
                  {prefsLoading ? '保存中...' : t('preferences.savePreferences')}
                </button>
                {prefsMsg && <p className={`text-sm ${prefsMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{prefsMsg}</p>}
              </motion.div>
            )}

            {/* ── Billing ── */}
            {activeTab === 'billing' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <h2 className="text-lg font-semibold mb-4">{t('billing.title')}</h2>

                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{t('billing.balance')}</p>
                      <p className="text-3xl font-bold">${(balance?.balance ?? 0).toFixed(2)}</p>
                      {balance?.totalSpent > 0 && <p className="text-xs text-muted-foreground mt-1">累计消费: ${balance.totalSpent.toFixed(2)}</p>}
                    </div>
                    <button className="px-4 py-2.5 rounded-xl bg-indigo-600 text-sm font-medium hover:bg-indigo-500 transition-all">💳 {t('billing.topup')}</button>
                  </div>
                </div>

                {transactions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">{t('billing.usageHistory')}</h3>
                    <div className="rounded-xl border border-border overflow-hidden">
                      <table className="w-full">
                        <thead><tr className="border-b border-border">
                          <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{t('billing.date')}</th>
                          <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">类型</th>
                          <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">{t('billing.cost')}</th>
                        </tr></thead>
                        <tbody>
                          {transactions.map(tx => (
                            <tr key={tx.id} className="border-b border-border hover:bg-muted/30">
                              <td className="px-4 py-3 text-sm">{new Date(tx.createdAt).toLocaleDateString()}</td>
                              <td className="px-4 py-3 text-sm">{tx.type}</td>
                              <td className="px-4 py-3 text-sm text-right">${Math.abs(tx.amount).toFixed(4)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {transactions.length === 0 && <p className="text-sm text-muted-foreground">暂无交易记录</p>}
              </motion.div>
            )}

            {/* ── Danger Zone ── */}
            {activeTab === 'danger' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <h2 className="text-lg font-semibold mb-4">{t('danger.title')}</h2>

                {/* 内置账号保护提示 */}
                {profile?.numericAccount && ['000', '0'].includes(profile.numericAccount) && (
                  <div className="rounded-xl border border-yellow-500/30 bg-yellow-600/10 p-4 text-yellow-400 text-sm">
                    ⚠️ 内置系统账号，不允许删除。数据清除功能可用。
                  </div>
                )}

                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="text-sm font-semibold mb-2">密码确认</h3>
                  <p className="text-xs text-muted-foreground mb-3">执行危险操作前请输入密码（第三方登录用户可留空）</p>
                  <input type="password" value={dangerPassword} onChange={e => setDangerPassword(e.target.value)} placeholder="输入登录密码"
                    className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-indigo-500" />
                </div>

                <div className="rounded-xl border border-yellow-500/30 bg-yellow-600/10 p-6">
                  <h3 className="text-sm font-semibold text-yellow-400 mb-2">{t('danger.clearData')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{t('danger.clearDataDesc')}</p>
                  <button onClick={handleClearData} className="px-4 py-2.5 rounded-xl border border-yellow-500/30 text-yellow-400 text-sm hover:bg-yellow-600/20 transition-all">{t('danger.clearDataButton')}</button>
                </div>

                {!(profile?.numericAccount && ['000', '0'].includes(profile.numericAccount)) && (
                  <div className="rounded-xl border border-red-500/30 bg-red-600/10 p-6">
                    <h3 className="text-sm font-semibold text-red-400 mb-2">{t('danger.deleteAccount')}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{t('danger.deleteAccountDesc')}</p>
                    <button onClick={handleDeleteAccount} className="px-4 py-2.5 rounded-xl bg-red-600 text-sm font-medium hover:bg-red-500 transition-all">{t('danger.deleteAccountButton')}</button>
                  </div>
                )}

                {dangerMsg && <p className={`text-sm ${dangerMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{dangerMsg}</p>}
              </motion.div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
