import { useState } from "react";
import { api } from "../services/api";
import { AuthService } from "../services/auth";

interface LoginProps { onLogin: () => void; }

export function Login({ onLogin }: LoginProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const resp: any = isRegister
        ? await api.register(username, email, password)
        : await api.login(email, password);
      if (resp.success && resp.user) {
        AuthService.saveUser(resp.user);
        onLogin();
      } else {
        setError(resp.message || (isRegister ? "注册失败" : "登录失败"));
      }
    } catch (err: any) {
      setError(err.message || "网络错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">A</div>
          <h1>AIOS</h1>
          <p>AI Workspace OS</p>
        </div>
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label>用户名</label>
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="3-20位字母数字下划线" required />
            </div>
          )}
          <div className="form-group">
            <label>邮箱 / AI 账号</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com 或 10000" required />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="输入密码" required />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "处理中..." : isRegister ? "注册" : "登录"}
          </button>
        </form>
        <div className="login-footer">
          <button className="link-btn" onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? "已有账号？去登录" : "没有账号？去注册"}
          </button>
        </div>
      </div>
    </div>
  );
}
