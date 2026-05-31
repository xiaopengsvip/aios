'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ui/ThemeToggle';
import LanguageToggle from '@/components/ui/LanguageToggle';

export default function RegisterCompletePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [codeCountdown, setCodeCountdown] = useState(0);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => {
        if (res.ok) router.replace('/chat');
      })
      .catch(() => {});
  }, [router]);

  const sendCode = async () => {
    if (!email) return;
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'REGISTER' }),
      });
      if (res.ok) {
        setCodeSent(true);
        setCodeCountdown(60);
        const timer = setInterval(() => {
          setCodeCountdown((prev) => { if (prev <= 1) { clearInterval(timer); return 0; } return prev - 1; });
        }, 1000);
      } else {
        const data = await res.json();
        setError(data.error || '发送失败');
      }
    } catch (err: any) { setError(err.message); }
  };

  const handleNextStep = () => {
    setError('');
    if (!email || !password) {
      setError('请填写邮箱和密码');
      return;
    }
    if (password.length < 8) {
      setError('密码至少 8 位');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次密码不一致');
      return;
    }
    setStep(2);
    sendCode();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/oauth/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, code: verificationCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '注册失败');
      router.push('/chat?welcome=1');
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
        <div className="absolute inset-0 opacity-30 dark:opacity-100" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, rgba(128,128,128,0.1) 1px, transparent 0)`, backgroundSize: '32px 32px' }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-600/[0.06] rounded-full blur-[150px]" />

        <div className="relative text-center px-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-3xl mx-auto mb-8 text-white shadow-xl shadow-indigo-500/20">A</div>
            <h2 className="text-3xl font-bold mb-4">完善账号信息</h2>
            <p className="text-gray-500 dark:text-zinc-500 text-lg max-w-sm mx-auto leading-relaxed">第三方登录成功，请设置邮箱和密码以完成注册</p>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-[400px]">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-indigo-500/20">A</div>
            <span className="text-xl font-semibold">AI 工作台</span>
          </div>

          <h1 className="text-2xl font-bold mb-2">完善账号信息</h1>
          <p className="text-gray-500 dark:text-zinc-500 mb-8">设置邮箱和密码，保护你的账号安全</p>

          {/* Steps */}
          <div className="flex items-center gap-3 mb-8">
            <div className={`flex items-center gap-2 text-sm ${step >= 1 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-zinc-800 text-gray-500'}`}>1</div>
              邮箱密码
            </div>
            <div className="flex-1 h-px bg-gray-200 dark:bg-white/[0.06]" />
            <div className={`flex items-center gap-2 text-sm ${step >= 2 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-zinc-800 text-gray-500'}`}>2</div>
              验证邮箱
            </div>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </motion.div>
          )}

          <div className="mb-6 p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm">
            第三方账号注册成功，请补充邮箱和密码以便后续使用邮箱登录。
          </div>

          {step === 1 ? (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">邮箱</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="请输入邮箱" required
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-foreground placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">密码</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="至少 8 位" required
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-foreground placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all text-sm pr-12" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors p-1">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
                {password && (
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div key={level} className={`h-1 flex-1 rounded-full transition-all ${password.length >= level * 3 ? (level <= 1 ? 'bg-red-500' : level <= 2 ? 'bg-orange-500' : level <= 3 ? 'bg-yellow-500' : 'bg-emerald-500') : 'bg-gray-200 dark:bg-zinc-800'}`} />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">确认密码</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="再次输入密码" required
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-foreground placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all text-sm" />
              </div>
              <button onClick={handleNextStep} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all text-sm hover:shadow-lg hover:shadow-indigo-500/20">
                下一步
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">验证码</label>
                <p className="text-xs text-gray-500 dark:text-zinc-500 mb-3">验证码已发送至 {email}</p>
                <div className="flex gap-3">
                  <input type="text" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="请输入 6 位验证码" required maxLength={6}
                    className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-foreground placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all text-sm tracking-widest text-center" />
                  <button type="button" onClick={sendCode} disabled={codeCountdown > 0}
                    className="px-4 py-3 rounded-xl border border-gray-200 dark:border-white/[0.08] hover:bg-gray-50 dark:hover:bg-white/[0.04] disabled:opacity-50 disabled:cursor-not-allowed text-sm text-gray-600 dark:text-zinc-300 transition-all whitespace-nowrap">
                    {codeCountdown > 0 ? `${codeCountdown}s 后重发` : '发送验证码'}
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-white/[0.08] hover:bg-gray-50 dark:hover:bg-white/[0.04] font-medium transition-all text-sm text-gray-600 dark:text-zinc-300">
                  返回
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-all text-sm hover:shadow-lg hover:shadow-indigo-500/20">
                  {loading ? '注册中...' : '完成注册'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
