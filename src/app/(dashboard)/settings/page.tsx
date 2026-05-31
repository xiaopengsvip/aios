'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';


interface UserProfile {
  avatar: string;
  displayName: string;
  username: string;
  email: string;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  provider: string;
  createdAt: Date;
  lastUsed?: Date;
}

interface UsageRecord {
  id: string;
  date: Date;
  model: string;
  tokens: number;
  cost: number;
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const [activeTab, setActiveTab] = useState('profile');
  const [oauthAccounts, setOauthAccounts] = useState<any[]>([]);
  const [oauthLoading, setOauthLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/oauth/accounts')
      .then((r) => r.json())
      .then((d) => setOauthAccounts(d.accounts || []))
      .catch(() => {});
  }, []);

  const handleUnbind = async (provider: string) => {
    if (!confirm(`确定解绑 ${provider}？`)) return;
    setOauthLoading(true);
    try {
      const res = await fetch('/api/auth/oauth/accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOauthAccounts((prev) => prev.filter((a) => a.provider !== provider.toUpperCase()));
    } catch (e: any) {
      alert(e.message || '解绑失败');
    } finally {
      setOauthLoading(false);
    }
  };

  const isBound = (provider: string) =>
    oauthAccounts.some((a) => a.provider === provider.toUpperCase());
  const [profile, setProfile] = useState<UserProfile>({
    avatar: '',
    displayName: '',
    username: '',
    email: '',
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // 获取真实用户数据
  useEffect(() => {
    fetch('/api/auth/profile')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          const u = data.user;
          setProfile({
            avatar: u.avatar || '',
            displayName: u.displayName || '',
            username: u.username || '',
            email: u.email || '',
          });
        }
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, []);

  // 保存资料
  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileMsg('');
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: profile.displayName,
          username: profile.username,
          email: profile.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfileMsg('✓ 保存成功');
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (e: any) {
      setProfileMsg(e.message || '保存失败');
    } finally {
      setProfileSaving(false);
    }
  };

  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('zh-CN');
  const [defaultModel, setDefaultModel] = useState('gpt-4o');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: 'OpenAI Key',
      key: 'sk-...abc123',
      provider: 'OpenAI',
      createdAt: new Date(Date.now() - 30 * 86400000),
      lastUsed: new Date(Date.now() - 86400000),
    },
    {
      id: '2',
      name: 'Anthropic Key',
      key: 'sk-ant-...xyz789',
      provider: 'Anthropic',
      createdAt: new Date(Date.now() - 15 * 86400000),
      lastUsed: new Date(Date.now() - 2 * 86400000),
    },
  ]);

  const [showAddKey, setShowAddKey] = useState(false);
  const [newKey, setNewKey] = useState({ name: '', key: '', provider: 'OpenAI' });

  const [balance] = useState(128.50);
  const [usageHistory] = useState<UsageRecord[]>([
    { id: '1', date: new Date(), model: 'GPT-4o', tokens: 15000, cost: 0.45 },
    { id: '2', date: new Date(Date.now() - 86400000), model: 'Claude 4 Sonnet', tokens: 8000, cost: 0.24 },
    { id: '3', date: new Date(Date.now() - 172800000), model: 'GPT-4o', tokens: 22000, cost: 0.66 },
    { id: '4', date: new Date(Date.now() - 259200000), model: 'Gemini 2.5 Pro', tokens: 12000, cost: 0.18 },
    { id: '5', date: new Date(Date.now() - 345600000), model: 'DeepSeek V3', tokens: 30000, cost: 0.15 },
  ]);

  const tabs = [
    { id: 'profile', label: t('tabs.profile'), icon: '👤' },
    { id: 'security', label: t('tabs.security'), icon: '🔒' },
    { id: 'linked', label: t('tabs.linked'), icon: '🔗' },
    { id: 'preferences', label: t('tabs.preferences'), icon: '⚙️' },
    { id: 'apikeys', label: t('tabs.apikeys'), icon: '🔑' },
    { id: 'billing', label: t('tabs.billing'), icon: '💰' },
    { id: 'danger', label: t('tabs.danger'), icon: '⚠️' },
  ];

  const models = [
    'gpt-4o',
    'gpt-4o-mini',
    'claude-sonnet-4-20250514',
    'claude-opus-4-20250514',
    'gemini-2.5-pro',
    'deepseek-chat',
    'qwen-max',
    'grok-3',
  ];

  const providers = ['OpenAI', 'Anthropic', 'Google', 'DeepSeek', 'Alibaba', 'xAI'];

  const addApiKey = () => {
    if (!newKey.name.trim() || !newKey.key.trim()) return;

    const apiKey: ApiKey = {
      id: `key-${Date.now()}`,
      name: newKey.name,
      key: newKey.key,
      provider: newKey.provider,
      createdAt: new Date(),
    };

    setApiKeys((prev) => [...prev, apiKey]);
    setNewKey({ name: '', key: '', provider: 'OpenAI' });
    setShowAddKey(false);
  };

  const deleteApiKey = (keyId: string) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
  };

  const maskKey = (key: string) => {
    if (key.length <= 10) return key;
    return key.substring(0, 7) + '...' + key.substring(key.length - 6);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Top bar */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border bg-card">
        <h1 className="text-sm font-semibold">⚙️ {t('title')}</h1>
        <div className="flex items-center gap-1">

        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar — mobile: horizontal scroll tabs, desktop: vertical sidebar */}
        <div className="md:w-56 border-b md:border-b-0 md:border-r border-border bg-card p-2 md:p-3 shrink-0 overflow-x-auto md:overflow-x-visible">
          <nav className="flex md:flex-col gap-1 md:space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-xl text-sm whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <div className="max-w-2xl">
            {/* Profile */}
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h2 className="text-lg font-semibold mb-4">{t('profile.title')}</h2>

                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold">
                    {profile.displayName.charAt(0)}
                  </div>
                  <div>
                    <button className="px-4 py-2 rounded-lg bg-muted text-sm hover:bg-muted transition-all">
                      {t('profile.changeAvatar')}
                    </button>
                    <p className="text-xs text-muted-foreground mt-1">{t('profile.avatarHint')}</p>
                  </div>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('profile.displayName')}</label>
                    <input
                      value={profile.displayName}
                      onChange={(e) => setProfile((prev) => ({ ...prev, displayName: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('profile.username')}</label>
                    <input
                      value={profile.username}
                      onChange={(e) => setProfile((prev) => ({ ...prev, username: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('profile.email')}</label>
                    <input
                      value={profile.email}
                      onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {profileMsg && (
                  <span className={`text-sm ml-3 ${profileMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
                    {profileMsg}
                  </span>
                )}
                <button
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 text-sm font-medium hover:bg-indigo-500 transition-all disabled:opacity-50"
                >
                  {profileSaving ? '保存中...' : t('profile.save')}
                </button>
              </motion.div>
            )}

            {/* Security */}
            {activeTab === 'security' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h2 className="text-lg font-semibold mb-4">{t('security.title')}</h2>

                {/* Change password */}
                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="text-sm font-semibold mb-4">{t('security.changePassword')}</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('security.currentPassword')}</label>
                      <input
                        type="password"
                        value={passwords.current}
                        onChange={(e) => setPasswords((prev) => ({ ...prev, current: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('security.newPassword')}</label>
                      <input
                        type="password"
                        value={passwords.new}
                        onChange={(e) => setPasswords((prev) => ({ ...prev, new: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('security.confirmNewPassword')}</label>
                      <input
                        type="password"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords((prev) => ({ ...prev, confirm: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <button className="px-4 py-2.5 rounded-xl bg-indigo-600 text-sm font-medium hover:bg-indigo-500 transition-all">
                      {t('security.updatePassword')}
                    </button>
                  </div>
                </div>

                {/* 2FA */}
                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">{t('security.twoFactor')}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('security.twoFactorDesc')}
                      </p>
                    </div>
                    <button
                      onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                      className={`relative w-12 h-6 rounded-full transition-all ${
                        twoFactorEnabled ? 'bg-indigo-600' : 'bg-muted'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                          twoFactorEnabled ? 'left-6' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Linked Accounts */}
            {activeTab === 'linked' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h2 className="text-lg font-semibold mb-4">关联账号</h2>
                <p className="text-sm text-muted-foreground mb-6">绑定第三方账号后可快速登录</p>

                {[
                  { id: 'github', name: 'GitHub', color: 'bg-gray-800', icon: (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  )},
                  { id: 'google', name: 'Google', color: 'bg-white', icon: (
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  )},
                  { id: 'twitter', name: 'X (Twitter)', color: 'bg-black', icon: (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  )},
                ].map((p) => {
                  const bound = isBound(p.id);
                  const account = oauthAccounts.find((a) => a.provider === p.id.toUpperCase());
                  return (
                    <div key={p.id} className="rounded-xl border border-border bg-card/50 p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl ${p.color} flex items-center justify-center`}>
                          {p.icon}
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">{p.name}</h3>
                          {bound && account ? (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              已绑定 · {account.providerUsername || account.providerEmail || account.providerAccountId}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-0.5">未绑定</p>
                          )}
                        </div>
                      </div>
                      {bound ? (
                        <button
                          onClick={() => handleUnbind(p.id)}
                          disabled={oauthLoading}
                          className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/10 transition-all disabled:opacity-50"
                        >
                          解绑
                        </button>
                      ) : (
                        <a
                          href={`/api/auth/oauth/${p.id}?action=bind`}
                          className="px-4 py-2 rounded-lg bg-indigo-600 text-foreground text-xs font-medium hover:bg-indigo-500 transition-all"
                        >
                          绑定
                        </a>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* Preferences */}
            {activeTab === 'preferences' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h2 className="text-lg font-semibold mb-4">{t('preferences.title')}</h2>

                <div className="space-y-4">
                  {/* Theme */}
                  <div className="rounded-xl border border-border bg-card/50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold">{t('preferences.theme')}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{t('preferences.themeDesc')}</p>
                      </div>
                      <div className="flex gap-2">
                        {['dark', 'light'].map((th) => (
                          <button
                            key={th}
                            onClick={() => setTheme(th)}
                            className={`px-4 py-2 rounded-lg text-sm transition-all ${
                              theme === th
                                ? 'bg-indigo-600 text-foreground'
                                : 'bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {th === 'dark' ? `🌙 ${t('preferences.dark')}` : `☀️ ${t('preferences.light')}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Language */}
                  <div className="rounded-xl border border-border bg-card/50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold">{t('preferences.language')}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{t('preferences.languageDesc')}</p>
                      </div>
                      <div className="flex gap-2">
                        {[
                          { id: 'zh-CN', label: '中文' },
                          { id: 'en-US', label: 'English' },
                        ].map((l) => (
                          <button
                            key={l.id}
                            onClick={() => setLanguage(l.id)}
                            className={`px-4 py-2 rounded-lg text-sm transition-all ${
                              language === l.id
                                ? 'bg-indigo-600 text-foreground'
                                : 'bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {l.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Default model */}
                  <div className="rounded-xl border border-border bg-card/50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold">{t('preferences.defaultModel')}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{t('preferences.defaultModelDesc')}</p>
                      </div>
                      <select
                        value={defaultModel}
                        onChange={(e) => setDefaultModel(e.target.value)}
                        className="px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-indigo-500"
                      >
                        {models.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <button className="px-4 py-2.5 rounded-xl bg-indigo-600 text-sm font-medium hover:bg-indigo-500 transition-all">
                  {t('preferences.savePreferences')}
                </button>
              </motion.div>
            )}

            {/* API Keys */}
            {activeTab === 'apikeys' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">{t('apikeys.title')}</h2>
                  <button
                    onClick={() => setShowAddKey(true)}
                    className="px-3 py-2 rounded-lg bg-indigo-600 text-sm hover:bg-indigo-500 transition-all"
                  >
                    {t('apikeys.addKey')}
                  </button>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {t('apikeys.description')}
                </p>

                {/* Add key form */}
                {showAddKey && (
                  <div className="rounded-xl border border-indigo-500/30 bg-indigo-600/10 p-4 mb-4">
                    <div className="space-y-3">
                      <input
                        value={newKey.name}
                        onChange={(e) => setNewKey((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder={t('apikeys.keyName')}
                        className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-indigo-500"
                      />
                      <input
                        value={newKey.key}
                        onChange={(e) => setNewKey((prev) => ({ ...prev, key: e.target.value }))}
                        placeholder="API Key"
                        type="password"
                        className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-indigo-500"
                      />
                      <select
                        value={newKey.provider}
                        onChange={(e) => setNewKey((prev) => ({ ...prev, provider: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-indigo-500"
                      >
                        {providers.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowAddKey(false)}
                          className="flex-1 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-all"
                        >
                          {t('cancel', { default: '取消' })}
                        </button>
                        <button
                          onClick={addApiKey}
                          className="flex-1 py-2 rounded-lg bg-indigo-600 text-sm hover:bg-indigo-500 transition-all"
                        >
                          {t('apikeys.addButton')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Key list */}
                <div className="space-y-3">
                  {apiKeys.map((apiKey) => (
                    <div
                      key={apiKey.id}
                      className="rounded-xl border border-border bg-card/50 p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="text-sm font-semibold">{apiKey.name}</h3>
                          <span className="text-xs text-muted-foreground">{apiKey.provider}</span>
                        </div>
                        <button
                          onClick={() => deleteApiKey(apiKey.id)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-muted transition-all"
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="font-mono text-xs text-muted-foreground bg-muted rounded px-3 py-2">
                        {maskKey(apiKey.key)}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{t('apikeys.createdAt', { date: apiKey.createdAt.toLocaleDateString() })}</span>
                        {apiKey.lastUsed && <span>{t('apikeys.lastUsed', { date: apiKey.lastUsed.toLocaleDateString() })}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Billing */}
            {activeTab === 'billing' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h2 className="text-lg font-semibold mb-4">{t('billing.title')}</h2>

                {/* Balance */}
                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{t('billing.balance')}</p>
                      <p className="text-3xl font-bold">${balance.toFixed(2)}</p>
                    </div>
                    <button className="px-4 py-2.5 rounded-xl bg-indigo-600 text-sm font-medium hover:bg-indigo-500 transition-all">
                      💳 {t('billing.topup')}
                    </button>
                  </div>
                </div>

                {/* Usage history */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">{t('billing.usageHistory')}</h3>
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{t('billing.date')}</th>
                          <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{t('billing.model')}</th>
                          <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">{t('billing.tokens')}</th>
                          <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">{t('billing.cost')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usageHistory.map((record) => (
                          <tr key={record.id} className="border-b border-border hover:bg-muted/30">
                            <td className="px-4 py-3 text-sm">{record.date.toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-sm">{record.model}</td>
                            <td className="px-4 py-3 text-sm text-right">{record.tokens.toLocaleString()}</td>
                            <td className="px-4 py-3 text-sm text-right">${record.cost.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Danger zone */}
            {activeTab === 'danger' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h2 className="text-lg font-semibold mb-4">{t('danger.title')}</h2>

                <div className="rounded-xl border border-red-500/30 bg-red-600/10 p-6">
                  <h3 className="text-sm font-semibold text-red-400 mb-2">{t('danger.deleteAccount')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('danger.deleteAccountDesc')}
                  </p>
                  <button className="px-4 py-2.5 rounded-xl bg-red-600 text-sm font-medium hover:bg-red-500 transition-all">
                    {t('danger.deleteAccountButton')}
                  </button>
                </div>

                <div className="rounded-xl border border-yellow-500/30 bg-yellow-600/10 p-6">
                  <h3 className="text-sm font-semibold text-yellow-400 mb-2">{t('danger.clearData')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('danger.clearDataDesc')}
                  </p>
                  <button className="px-4 py-2.5 rounded-xl border border-yellow-500/30 text-yellow-400 text-sm hover:bg-yellow-600/20 transition-all">
                    {t('danger.clearDataButton')}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
