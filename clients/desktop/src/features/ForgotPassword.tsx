import { useState } from 'react';
import { api } from '../services/api';

interface ForgotPasswordProps {
  onReset: () => void;
  onBackToLogin: () => void;
}

export function ForgotPassword({ onReset, onBackToLogin }: ForgotPasswordProps) {
  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const sendCode = async () => {
    if (!email) return;
    setLoading(true); setError('');
    try {
      await api.post('/api/auth/send-code', { email, type: 'reset-password' });
      setStep('verify');
      setCountdown(60);
      const timer = setInterval(() => { setCountdown(c => { if (c <= 1) { clearInterval(timer); return 0; } return c - 1; }); }, 1000);
    } catch (e: any) { setError(e.message || '发送失败'); }
    setLoading(false);
  };

  const handleReset = async () => {
    if (!code || !newPassword) return;
    if (newPassword !== confirmPassword) { setError('两次密码不一致'); return; }
    if (newPassword.length < 6) { setError('密码至少6位'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/api/auth/reset-password', { email, code, newPassword });
      onReset();
    } catch (e: any) { setError(e.message || '重置失败'); }
    setLoading(false);
  };

  return (
    <div style={{ padding: 32, maxWidth: 380, width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>🔐 找回密码</h2>
        <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
          {step === 'email' ? '输入注册邮箱获取验证码' : '输入验证码并设置新密码'}
        </p>
      </div>

      {step === 'email' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="注册邮箱" type="email" onKeyDown={e => e.key === 'Enter' && sendCode()} />
          {error && <div style={{ color: '#ef4444', fontSize: 12 }}>{error}</div>}
          <button className="btn-send" onClick={sendCode} disabled={loading || !email}>{loading ? '发送中...' : '发送验证码'}</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input value={code} onChange={e => setCode(e.target.value)} placeholder="6位验证码" maxLength={6} style={{ textAlign: 'center', fontSize: 20, letterSpacing: 8 }} />
          <input value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="新密码 (至少6位)" type="password" />
          <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="确认新密码" type="password" onKeyDown={e => e.key === 'Enter' && handleReset()} />
          {error && <div style={{ color: '#ef4444', fontSize: 12 }}>{error}</div>}
          <button className="btn-send" onClick={handleReset} disabled={loading || code.length < 6 || !newPassword}>{loading ? '重置中...' : '重置密码'}</button>
          <button style={{ fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center' }} onClick={sendCode} disabled={countdown > 0}>
            {countdown > 0 ? `重新发送 (${countdown}s)` : '重新发送验证码'}
          </button>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button onClick={onBackToLogin} style={{ fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer' }}>← 返回登录</button>
      </div>
    </div>
  );
}
