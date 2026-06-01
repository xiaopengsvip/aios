import { useState, useEffect, useRef } from "react";
import { api } from "../services/api";
import { AuthService } from "../services/auth";
import { useI18n } from "../i18n";

type View = "login" | "register" | "forgot" | "reset";

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const { locale, t, setLocale } = useI18n();
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("aios_theme") as "dark" | "light") || "dark";
  });
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("aios_theme", next);
    document.documentElement.classList.toggle("light", next === "light");
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [countdown]);

  const clearMessages = () => { setError(""); setSuccess(""); };
  const switchView = (v: View) => { clearMessages(); setView(v); };

  // ── Login ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); clearMessages();
    try {
      const resp: any = await api.login(email, password);
      if (resp.success && resp.user) {
        AuthService.saveUser(resp.user);
        onLogin();
      } else { setError(resp.message || t("login.loginFailed")); }
    } catch (err: any) { setError(err.message || t("login.networkError")); }
    finally { setLoading(false); }
  };

  // ── Register ──
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError(t("login.passwordMismatch")); return; }
    if (password.length < 6) { setError(t("login.passwordTooShort")); return; }
    setLoading(true); clearMessages();
    try {
      const resp: any = await api.register(username, email, password);
      if (resp.success && resp.user) { AuthService.saveUser(resp.user); onLogin(); }
      else { setError(resp.message || t("login.registerFailed")); }
    } catch (err: any) { setError(err.message || t("login.networkError")); }
    finally { setLoading(false); }
  };

  // ── Request Reset Code ──
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true); clearMessages();
    try {
      const resp: any = await api.requestResetCode(email);
      setSuccess(resp.message || "OK");
      setCountdown(60);
      setView("reset");
    } catch (err: any) { setError(err.message || "Failed"); }
    finally { setLoading(false); }
  };

  // ── Confirm Reset ──
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError(t("login.passwordMismatch")); return; }
    if (newPassword.length < 6) { setError(t("login.passwordTooShort")); return; }
    setLoading(true); clearMessages();
    try {
      const resp: any = await api.resetPassword(email, resetCode, newPassword);
      setSuccess(resp.message || "OK");
      setTimeout(() => { switchView("login"); setPassword(""); setConfirmPassword(""); setResetCode(""); }, 1500);
    } catch (err: any) { setError(err.message || "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* ── Top bar: theme + language ── */}
        <div className="login-toolbar">
          <button className="toolbar-btn" onClick={toggleTheme} title={theme === "dark" ? t("settings.light") : t("settings.dark")}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <button
            className="toolbar-btn"
            onClick={() => setLocale(locale === "zh-CN" ? "en-US" : "zh-CN")}
            title={t("settings.language")}
          >
            {locale === "zh-CN" ? "中" : "EN"}
          </button>
        </div>

        {/* ── Header ── */}
        <div className="login-header">
          <div className="login-logo">
            <img src="/icons/icon-128.png" alt="AIOS" style={{ width: 40, height: 40, borderRadius: 10 }} />
          </div>
          <h1>{t("app.name")}</h1>
          <p>{t("app.slogan")}</p>
        </div>

        {/* ── Messages ── */}
        {error && <div className="msg-error">{error}</div>}
        {success && <div className="msg-success">{success}</div>}

        {/* ─── Login ─── */}
        {view === "login" && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>{t("login.email")}</label>
              <div className="input-wrapper">
                <span className="input-icon">📧</span>
                <input type="text" value={email} onChange={e => setEmail(e.target.value)} placeholder={t("login.emailPlaceholder")} required />
              </div>
            </div>
            <div className="form-group">
              <label>{t("login.password")}</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder={t("login.passwordPlaceholder")} required />
                <button type="button" className="input-action" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            <div className="form-row">
              <label className="checkbox-label">
                <input type="checkbox" checked={showPassword} onChange={e => setShowPassword(e.target.checked)} />
                <span>{t("login.showPassword")}</span>
              </label>
              <button type="button" className="link-btn" onClick={() => switchView("forgot")}>{t("login.forgot")}</button>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? t("login.loggingIn") : t("login.loginBtn")}
            </button>
          </form>
        )}

        {/* ─── Register ─── */}
        {view === "register" && (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>{t("login.username")}</label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder={t("login.usernamePlaceholder")} required minLength={3} maxLength={20} pattern="[a-zA-Z0-9_]+" />
              </div>
            </div>
            <div className="form-group">
              <label>{t("login.email")}</label>
              <div className="input-wrapper">
                <span className="input-icon">📧</span>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
              </div>
            </div>
            <div className="form-group">
              <label>{t("login.password")}</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" required minLength={6} />
              </div>
            </div>
            <div className="form-group">
              <label>{t("login.confirmPassword")}</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder={t("login.confirmPasswordPlaceholder")} required minLength={6} />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? t("login.registering") : t("login.registerBtn")}
            </button>
          </form>
        )}

        {/* ─── Forgot Password ─── */}
        {view === "forgot" && (
          <form onSubmit={handleRequestCode}>
            <div className="form-hint">{t("forgot.hint")}</div>
            <div className="form-group">
              <label>{t("login.email")}</label>
              <div className="input-wrapper">
                <span className="input-icon">📧</span>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? t("forgot.sending") : t("forgot.sendCode")}
            </button>
          </form>
        )}

        {/* ─── Reset Password ─── */}
        {view === "reset" && (
          <form onSubmit={handleResetPassword}>
            <div className="form-hint">
              {t("forgot.codeHint")} <strong>{email}</strong>{t("forgot.codeHintSuffix")}
            </div>
            <div className="form-group">
              <label>{t("forgot.code")}</label>
              <div className="input-wrapper">
                <span className="input-icon">🔢</span>
                <input type="text" value={resetCode} onChange={e => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder={t("forgot.codePlaceholder")} required maxLength={6} style={{ letterSpacing: 4, textAlign: "center", fontSize: 18 }} />
              </div>
            </div>
            <div className="form-group">
              <label>{t("forgot.newPassword")}</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input type={showPassword ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder={t("forgot.newPasswordPlaceholder")} required minLength={6} />
              </div>
            </div>
            <div className="form-group">
              <label>{t("forgot.confirmNewPassword")}</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder={t("login.confirmPasswordPlaceholder")} required minLength={6} />
              </div>
            </div>
            <div className="form-row">
              <label className="checkbox-label">
                <input type="checkbox" checked={showPassword} onChange={e => setShowPassword(e.target.checked)} />
                <span>{t("login.showPassword")}</span>
              </label>
              <button type="button" className="link-btn" disabled={countdown > 0}
                onClick={() => { if (countdown === 0) handleRequestCode(new Event("submit") as any); }}>
                {countdown > 0 ? t("forgot.resendCountdown").replace("{s}", String(countdown)) : t("forgot.resend")}
              </button>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? t("forgot.resetting") : t("forgot.resetBtn")}
            </button>
          </form>
        )}

        {/* ── Footer ── */}
        <div className="login-footer">
          {view === "login" && (
            <button className="link-btn" onClick={() => switchView("register")}>{t("login.noAccount")}</button>
          )}
          {view === "register" && (
            <button className="link-btn" onClick={() => switchView("login")}>{t("login.hasAccount")}</button>
          )}
          {(view === "forgot" || view === "reset") && (
            <button className="link-btn" onClick={() => switchView("login")}>{t("login.backToLogin")}</button>
          )}
        </div>
      </div>
    </div>
  );
}
