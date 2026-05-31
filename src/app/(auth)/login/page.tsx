'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import ThemeToggle from '@/components/ui/ThemeToggle';
import LanguageToggle from '@/components/ui/LanguageToggle';
import { useTranslations } from 'next-intl';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userNotFound, setUserNotFound] = useState(false);

  // 处理 OAuth 错误
  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError) {
      const errorMessages: Record<string, string> = {
        oauth_denied: '授权被拒绝',
        oauth_invalid: '无效的授权请求',
        oauth_state_mismatch: '授权状态不匹配，请重试',
        oauth_invalid_state: '无效的授权状态',
        oauth_failed: 'OAuth 登录失败',
        oauth_init_failed: 'OAuth 初始化失败',
        not_logged_in: '请先登录后再绑定账号',
      };
      setError(errorMessages[oauthError] || `OAuth 错误: ${oauthError}`);
    }
    
    const oauthBind = searchParams.get('oauth_bind');
    if (oauthBind === 'success') {
      // 绑定成功，显示成功消息（可以用 toast 等）
      console.log('OAuth 绑定成功');
    }
  }, [searchParams]);

  // 已登录用户自动跳转到 /chat
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => { if (res.ok) router.replace('/chat'); })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setUserNotFound(false);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.userNotFound) {
          setUserNotFound(true);
        }
        throw new Error(data.error || t('loginFailed'));
      }
      router.push('/chat');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background relative">
      <div className="fixed top-4 right-4 z-50 flex items-center gap-1">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-gray-50 dark:bg-background">
        <div className="absolute inset-0 opacity-30 dark:opacity-100" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(128,128,128,0.1) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }} />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-600/[0.06] rounded-full blur-[150px]" />
        <div className="relative text-center px-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-3xl mx-auto mb-8 text-white shadow-xl shadow-indigo-500/20">A</div>
            <h2 className="text-3xl font-bold mb-4">{tCommon('appName')}</h2>
            <p className="text-gray-500 dark:text-zinc-500 text-lg max-w-sm mx-auto leading-relaxed">
              {tCommon('appDescription')}
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-12 flex flex-wrap justify-center gap-2">
            {['MiMo V2.5', 'Doubao Seed', 'DeepSeek V4', 'GLM-4.7', 'Nous'].map((m, i) => (
              <motion.span key={m} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}
                className="px-3 py-1 rounded-full border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] text-xs text-gray-500 dark:text-zinc-400 shadow-sm dark:shadow-none">
                {m}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-[400px]">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-indigo-500/20">A</div>
            <span className="text-xl font-semibold">{tCommon('appName')}</span>
          </div>

          <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
          <p className="text-gray-500 dark:text-zinc-500 mb-8">{t('subtitle')}</p>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
              {userNotFound && (
                <div className="mt-2 pl-6">
                  <Link href="/register" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                    {t('noAccount')} {t('createAccount')} →
                  </Link>
                </div>
              )}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">账号</label>
              <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="邮箱 / AI 账号" required
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-foreground placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all text-sm" />
              <p className="mt-1.5 text-xs text-gray-400 dark:text-zinc-600">支持邮箱或 AI 账号（如 10000、10001）登录</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">{t('password')}</label>
                <Link href="/forgot-password" className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors">{t('forgotPassword')}</Link>
              </div>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('passwordPlaceholder')} required
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-foreground placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all text-sm pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors p-1">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878l4.242 4.242M21 21l-3.122-3.122" />
                    ) : (
                      <>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0" />
              {t('rememberMe')}
            </label>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-all text-sm hover:shadow-lg hover:shadow-indigo-500/20">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  {t('loggingIn')}
                </span>
              ) : t('loginButton')}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200 dark:bg-white/[0.06]" />
            <span className="text-xs text-gray-400">{t('orContinueWith')}</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-white/[0.06]" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'github', name: 'GitHub', icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              )},
              { id: 'google', name: 'Google', icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              )},
              { id: 'twitter', name: 'X', icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              )},
            ].map((p) => (
              <a key={p.id} href={`/api/auth/oauth/${p.id}?action=login`}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] hover:bg-gray-50 dark:hover:bg-white/[0.05] text-sm text-gray-700 dark:text-zinc-300 transition-all hover:border-gray-300 dark:hover:border-white/[0.15]">
                {p.icon}
                <span>{p.name}</span>
              </a>
            ))}
          </div>

          <div className="text-center text-sm text-gray-500 mt-6">
            {t('noAccount')}{' '}
            <Link href="/register" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-medium transition-colors">{t('createAccount')}</Link>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-zinc-400 transition-colors inline-flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              {tCommon('back')}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
