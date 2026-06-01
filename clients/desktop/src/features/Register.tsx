import { useState } from 'react';
import { api } from '../services/api';

interface RegisterProps {
  onRegister: () => void;
  onSwitchToLogin: () => void;
}

export function Register({ onRegister, onSwitchToLogin }: RegisterProps) {
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const sendCode = async () => {
    if (!email) return;
    setLoading(true); setError('');
    try {
      await api.post('/api/auth/send-code', { email, type: 'register' });
      setCodeSent(true); setStep('verify');
      setCountdown(60);
      const timer = setInterval(() => { setCountdown(c => { if (c <= 1) { clearInterval(timer); return 0; } return c - 1; }); }, 1000);
    } catch (e: any) { setError(e.message || '发送失败'); }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!username || !email || !password) return;
    if (password !== confirmPassword) { setError('两次密码不一致'); return; }
    if (password.length < 6) { setError('密码至少6位'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/api/auth/register', { username, email, password, code });
      onRegister();
    } catch (e: any) { setError(e.message || '注册失败'); }
    setLoading(false);
  };

  return (
    <div style={{ padding: 32, maxWidth: 380, width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 36, fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>A</div>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 8 }}>创建账号</h2>
      </div>

      {step === 'form' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="用户名" />
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="邮箱" type="email" />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="密码 (至少6位)" type="password" />
          <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="确认密码" type="password" onKeyDown={e => e.key === 'Enter' && sendCode()} />
          {error && <div style={{ color: '#ef4444', fontSize: 12 }}>{error}</div>}
          <button className="btn-send" onClick={sendCode} disabled={loading || !username || !email || !password}>
            {loading ? '发送中...' : '发送验证码'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, color: '#888', textAlign: 'center' }}>验证码已发送至 {email}</p>
          <input value={code} onChange={e => setCode(e.target.value)} placeholder="输入6位验证码" maxLength={6} onKeyDown={e => e.key === 'Enter' && handleRegister()} style={{ textAlign: 'center', fontSize: 20, letterSpacing: 8 }} />
          {error && <div style={{ color: '#ef4444', fontSize: 12 }}>{error}</div>}
          <button className="btn-send" onClick={handleRegister} disabled={loading || code.length < 6}>
            {loading ? '注册中...' : '注册'}
          </button>
          <button style={{ fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center' }} onClick={sendCode} disabled={countdown > 0}>
            {countdown > 0 ? `重新发送 (${countdown}s)` : '重新发送验证码'}
          </button>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <span style={{ fontSize: 12, color: '#888' }}>已有账号？</span>
        <button onClick={onSwitchToLogin} style={{ fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 4 }}>去登录</button>
      </div>
    </div>
  );
}
