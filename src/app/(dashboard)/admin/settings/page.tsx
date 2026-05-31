'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { LoadingSpinner } from '@/components/ui/Loading';

interface ConfigItem {
  key: string;
  value: any;
  description: string | null;
}

const defaultConfigs: Record<string, any> = {
  siteName: 'AI Workspace OS',
  siteDescription: '企业级 AI 超级工作台',
  registrationEnabled: true,
  defaultModel: 'gpt-4o',
  maintenanceMode: false,
  maintenanceMessage: '系统维护中，请稍后再试',
  smtpHost: '',
  smtpPort: '587',
  smtpUser: '',
  smtpPass: '',
  smtpFrom: '',
  smtpSecure: true,
  maxFileSize: 10,
  allowedFileTypes: 'jpg,jpeg,png,gif,pdf,doc,docx,txt,md',
  defaultCreditLimit: 0,
  defaultDailyLimit: 100,
  defaultMonthlyLimit: 3000,
};

export default function AdminSettingsPage() {
  const t = useTranslations('admin');
  const [configs, setConfigs] = useState<Record<string, any>>(defaultConfigs);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const fetchConfigs = async () => {
    try {
      const res = await fetch('/api/admin/config');
      const data = await res.json();
      if (data.configs) {
        const merged = { ...defaultConfigs };
        for (const item of data.configs) {
          merged[item.key] = item.value;
        }
        setConfigs(merged);
      }
    } catch (err) {
      console.error('Failed to fetch configs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save configs:', err);
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (key: string, value: any) => {
    setConfigs((prev) => ({ ...prev, [key]: value }));
  };

  const tabs = [
    { id: 'general', label: t('adminSettings.tabs.general'), icon: '⚙️' },
    { id: 'smtp', label: t('adminSettings.tabs.smtp'), icon: '📧' },
    { id: 'limits', label: t('adminSettings.tabs.limits'), icon: '💰' },
    { id: 'files', label: t('adminSettings.tabs.files'), icon: '📁' },
  ];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background text-muted-foreground">
        <div className="flex items-center gap-2">
          <LoadingSpinner size="sm" />
          {t('common.loading')}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">{t('adminSettings.title')}</h1>
            <p className="text-muted-foreground text-sm mt-1">{t('adminSettings.subtitle')}</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm transition-all disabled:opacity-50"
          >
            {saving ? t('common.saving') : saved ? t('adminSettings.saved') : t('adminSettings.saveSettings')}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-muted-foreground hover:text-foreground/80'
              }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card/50 p-6">
              <h2 className="text-sm font-semibold mb-4">{t('adminSettings.general.siteInfo')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">{t('adminSettings.general.siteName')}</label>
                  <input
                    value={configs.siteName || ''}
                    onChange={(e) => updateConfig('siteName', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">{t('adminSettings.general.siteDescription')}</label>
                  <input
                    value={configs.siteDescription || ''}
                    onChange={(e) => updateConfig('siteDescription', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">{t('adminSettings.general.defaultModel')}</label>
                  <input
                    value={configs.defaultModel || ''}
                    onChange={(e) => updateConfig('defaultModel', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card/50 p-6">
              <h2 className="text-sm font-semibold mb-4">{t('adminSettings.general.featureToggles')}</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm">{t('adminSettings.general.registrationEnabled')}</div>
                    <div className="text-xs text-muted-foreground">{t('adminSettings.general.registrationDesc')}</div>
                  </div>
                  <button
                    onClick={() => updateConfig('registrationEnabled', !configs.registrationEnabled)}
                    className={`w-10 h-5 rounded-full transition-all relative ${
                      configs.registrationEnabled ? 'bg-indigo-600' : 'bg-muted'
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all"
                      style={{ left: configs.registrationEnabled ? '22px' : '2px' }}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm">{t('adminSettings.general.maintenanceMode')}</div>
                    <div className="text-xs text-muted-foreground">{t('adminSettings.general.maintenanceDesc')}</div>
                  </div>
                  <button
                    onClick={() => updateConfig('maintenanceMode', !configs.maintenanceMode)}
                    className={`w-10 h-5 rounded-full transition-all relative ${
                      configs.maintenanceMode ? 'bg-red-600' : 'bg-muted'
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all"
                      style={{ left: configs.maintenanceMode ? '22px' : '2px' }}
                    />
                  </button>
                </div>
                {configs.maintenanceMode && (
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">{t('adminSettings.general.maintenanceMessage')}</label>
                    <input
                      value={configs.maintenanceMessage || ''}
                      onChange={(e) => updateConfig('maintenanceMessage', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SMTP Settings */}
        {activeTab === 'smtp' && (
          <div className="rounded-xl border border-border bg-card/50 p-6">
            <h2 className="text-sm font-semibold mb-4">{t('adminSettings.smtp.title')}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">{t('adminSettings.smtp.host')}</label>
                  <input
                    value={configs.smtpHost || ''}
                    onChange={(e) => updateConfig('smtpHost', e.target.value)}
                    placeholder="smtp.example.com"
                    className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">{t('adminSettings.smtp.port')}</label>
                  <input
                    value={configs.smtpPort || ''}
                    onChange={(e) => updateConfig('smtpPort', e.target.value)}
                    placeholder="587"
                    className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">{t('adminSettings.smtp.username')}</label>
                  <input
                    value={configs.smtpUser || ''}
                    onChange={(e) => updateConfig('smtpUser', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">{t('adminSettings.smtp.password')}</label>
                  <input
                    value={configs.smtpPass || ''}
                    onChange={(e) => updateConfig('smtpPass', e.target.value)}
                    type="password"
                    className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">{t('adminSettings.smtp.fromAddress')}</label>
                <input
                  value={configs.smtpFrom || ''}
                  onChange={(e) => updateConfig('smtpFrom', e.target.value)}
                  placeholder="noreply@example.com"
                  className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-muted-foreground">{t('adminSettings.smtp.useSsl')}</label>
                <button
                  onClick={() => updateConfig('smtpSecure', !configs.smtpSecure)}
                  className={`w-10 h-5 rounded-full transition-all relative ${
                    configs.smtpSecure ? 'bg-indigo-600' : 'bg-muted'
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all"
                    style={{ left: configs.smtpSecure ? '22px' : '2px' }}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Default Limits */}
        {activeTab === 'limits' && (
          <div className="rounded-xl border border-border bg-card/50 p-6">
            <h2 className="text-sm font-semibold mb-4">{t('adminSettings.limits.title')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">{t('adminSettings.limits.initialBalance')}</label>
                <input
                  value={configs.defaultCreditLimit || ''}
                  onChange={(e) => updateConfig('defaultCreditLimit', parseFloat(e.target.value) || 0)}
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-white text-sm focus:outline-none focus:border-indigo-500"
                />
                <p className="text-xs text-muted-foreground/70 mt-1">{t('adminSettings.limits.initialBalanceHint')}</p>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">{t('adminSettings.limits.dailyLimit')}</label>
                <input
                  value={configs.defaultDailyLimit || ''}
                  onChange={(e) => updateConfig('defaultDailyLimit', parseFloat(e.target.value) || 0)}
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">{t('adminSettings.limits.monthlyLimit')}</label>
                <input
                  value={configs.defaultMonthlyLimit || ''}
                  onChange={(e) => updateConfig('defaultMonthlyLimit', parseFloat(e.target.value) || 0)}
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* File Settings */}
        {activeTab === 'files' && (
          <div className="rounded-xl border border-border bg-card/50 p-6">
            <h2 className="text-sm font-semibold mb-4">{t('adminSettings.fileSettings.title')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">{t('adminSettings.fileSettings.maxFileSize')}</label>
                <input
                  value={configs.maxFileSize || ''}
                  onChange={(e) => updateConfig('maxFileSize', parseInt(e.target.value) || 10)}
                  type="number"
                  className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">{t('adminSettings.fileSettings.allowedTypes')}</label>
                <input
                  value={configs.allowedFileTypes || ''}
                  onChange={(e) => updateConfig('allowedFileTypes', e.target.value)}
                  placeholder="jpg,jpeg,png,gif,pdf,doc,docx"
                  className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-white text-sm focus:outline-none focus:border-indigo-500"
                />
                <p className="text-xs text-muted-foreground/70 mt-1">{t('adminSettings.fileSettings.allowedTypesHint')}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
