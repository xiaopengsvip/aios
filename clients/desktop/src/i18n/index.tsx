import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

type Locale = "zh-CN" | "en-US";

interface I18nContextValue {
  locale: Locale;
  t: (key: string) => string;
  setLocale: (l: Locale) => void;
}

const translations: Record<Locale, Record<string, string>> = {
  "zh-CN": {
    // App
    "app.name": "AIOS",
    "app.slogan": "AI Workspace OS",
    "app.starting": "启动中...",

    // Nav
    "nav.chat": "对话",
    "nav.agent": "Agent",
    "nav.workflow": "工作流",
    "nav.settings": "设置",

    // Login
    "login.title": "登录",
    "login.register": "注册",
    "login.forgot": "忘记密码？",
    "login.noAccount": "没有账号？立即注册",
    "login.hasAccount": "已有账号？去登录",
    "login.backToLogin": "返回登录",
    "login.email": "邮箱 / AI 账号",
    "login.emailPlaceholder": "email@example.com 或 10000",
    "login.password": "密码",
    "login.passwordPlaceholder": "输入密码",
    "login.confirmPassword": "确认密码",
    "login.confirmPasswordPlaceholder": "再次输入密码",
    "login.username": "用户名",
    "login.usernamePlaceholder": "3-20位字母数字下划线",
    "login.showPassword": "显示密码",
    "login.loginBtn": "登录",
    "login.registerBtn": "注册",
    "login.loggingIn": "处理中...",
    "login.registering": "注册中...",
    "login.loginFailed": "登录失败",
    "login.registerFailed": "注册失败",
    "login.networkError": "网络错误",
    "login.passwordMismatch": "两次密码不一致",
    "login.passwordTooShort": "密码至少6位",

    // Forgot password
    "forgot.title": "找回密码",
    "forgot.hint": "输入注册邮箱，我们将发送 6 位验证码到您的邮箱",
    "forgot.sendCode": "发送验证码",
    "forgot.sending": "发送中...",
    "forgot.codeHint": "验证码已发送至",
    "forgot.codeHintSuffix": "，请在 10 分钟内输入",
    "forgot.code": "验证码",
    "forgot.codePlaceholder": "6位数字验证码",
    "forgot.newPassword": "新密码",
    "forgot.newPasswordPlaceholder": "至少6位",
    "forgot.confirmNewPassword": "确认新密码",
    "forgot.resetBtn": "重置密码",
    "forgot.resetting": "重置中...",
    "forgot.resend": "重新发送",
    "forgot.resendCountdown": "重新发送 ({s}s)",

    // Settings
    "settings.title": "设置",
    "settings.theme": "主题模式",
    "settings.dark": "深色",
    "settings.light": "浅色",
    "settings.system": "跟随系统",
    "settings.language": "语言",
    "settings.defaultModel": "默认模型",
    "settings.about": "关于",
    "settings.logout": "退出登录",
    "settings.loginRegister": "登录 / 注册",

    // Chat
    "chat.newChat": "新对话",
    "chat.emptyTitle": "开始新的对话",
    "chat.emptyHint": "选择一个模型，开始探索 AI 的世界",
    "chat.inputPlaceholder": "输入消息...",
    "chat.send": "发送",
    "chat.stop": "停止",
    "chat.thinking": "思考中...",

    // Common
    "common.loading": "加载中...",
    "common.error": "出错了",
    "common.retry": "重试",
    "common.cancel": "取消",
    "common.confirm": "确认",
    "common.save": "保存",
    "common.delete": "删除",
    "common.edit": "编辑",
    "common.search": "搜索",
    "common.noData": "暂无数据",
  },
  "en-US": {
    "app.name": "AIOS",
    "app.slogan": "AI Workspace OS",
    "app.starting": "Starting...",

    "nav.chat": "Chat",
    "nav.agent": "Agent",
    "nav.workflow": "Workflow",
    "nav.settings": "Settings",

    "login.title": "Login",
    "login.register": "Register",
    "login.forgot": "Forgot password?",
    "login.noAccount": "Don't have an account? Register",
    "login.hasAccount": "Already have an account? Login",
    "login.backToLogin": "Back to Login",
    "login.email": "Email / AI Account",
    "login.emailPlaceholder": "email@example.com or 10000",
    "login.password": "Password",
    "login.passwordPlaceholder": "Enter password",
    "login.confirmPassword": "Confirm Password",
    "login.confirmPasswordPlaceholder": "Re-enter password",
    "login.username": "Username",
    "login.usernamePlaceholder": "3-20 alphanumeric or underscore",
    "login.showPassword": "Show password",
    "login.loginBtn": "Login",
    "login.registerBtn": "Register",
    "login.loggingIn": "Processing...",
    "login.registering": "Registering...",
    "login.loginFailed": "Login failed",
    "login.registerFailed": "Registration failed",
    "login.networkError": "Network error",
    "login.passwordMismatch": "Passwords do not match",
    "login.passwordTooShort": "Password must be at least 6 characters",

    "forgot.title": "Reset Password",
    "forgot.hint": "Enter your registered email, we'll send a 6-digit verification code",
    "forgot.sendCode": "Send Code",
    "forgot.sending": "Sending...",
    "forgot.codeHint": "Code sent to",
    "forgot.codeHintSuffix": ", valid for 10 minutes",
    "forgot.code": "Verification Code",
    "forgot.codePlaceholder": "6-digit code",
    "forgot.newPassword": "New Password",
    "forgot.newPasswordPlaceholder": "At least 6 characters",
    "forgot.confirmNewPassword": "Confirm New Password",
    "forgot.resetBtn": "Reset Password",
    "forgot.resetting": "Resetting...",
    "forgot.resend": "Resend",
    "forgot.resendCountdown": "Resend ({s}s)",

    "settings.title": "Settings",
    "settings.theme": "Theme",
    "settings.dark": "Dark",
    "settings.light": "Light",
    "settings.system": "System",
    "settings.language": "Language",
    "settings.defaultModel": "Default Model",
    "settings.about": "About",
    "settings.logout": "Logout",
    "settings.loginRegister": "Login / Register",

    "chat.newChat": "New Chat",
    "chat.emptyTitle": "Start a new conversation",
    "chat.emptyHint": "Choose a model and explore the world of AI",
    "chat.inputPlaceholder": "Type a message...",
    "chat.send": "Send",
    "chat.stop": "Stop",
    "chat.thinking": "Thinking...",

    "common.loading": "Loading...",
    "common.error": "Something went wrong",
    "common.retry": "Retry",
    "common.cancel": "Cancel",
    "common.confirm": "Confirm",
    "common.save": "Save",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.search": "Search",
    "common.noData": "No data",
  },
};

const I18nContext = createContext<I18nContextValue>({
  locale: "zh-CN",
  t: (k) => k,
  setLocale: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem("aios_locale");
    if (saved === "zh-CN" || saved === "en-US") return saved;
    return navigator.language.startsWith("zh") ? "zh-CN" : "en-US";
  });

  useEffect(() => {
    localStorage.setItem("aios_locale", locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);

  const t = useCallback(
    (key: string): string => {
      const dict = translations[locale] || translations["zh-CN"];
      return dict[key] || key;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export type { Locale };
