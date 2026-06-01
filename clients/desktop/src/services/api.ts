const BASE_URL = "https://aios.vios.top";
const FALLBACK_URL = "https://aios.allapple.top";
export const APP_VERSION = "0.0.7";

// Dynamic import of Tauri HTTP plugin (respects system proxy via reqwest)
// Falls back to browser fetch when not in Tauri context
let _tauriFetch: any = null;
let _fetchResolved = false;

async function resolveFetch(): Promise<any> {
  if (_fetchResolved) return _tauriFetch || fetch;
  _fetchResolved = true;
  try {
    const mod = await import(/* @vite-ignore */ "@tauri-apps/plugin-http");
    if (mod?.fetch) { _tauriFetch = mod.fetch; console.log("[NET] tauri-plugin-http (reqwest, proxy=system)"); }
  } catch {}
  if (!_tauriFetch) console.log("[NET] browser fetch (no proxy)");
  return _tauriFetch || fetch;
}

/** fetch with timeout via AbortController */
function fetchWithTimeout(fn: typeof fetch, url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fn(url, { ...init, signal: ctrl.signal }).finally(() => clearTimeout(timer));
}

interface RequestConfig {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

class ApiService {
  private baseUrl: string;
  private fallbackUrl: string;
  private activeUrl: string;
  private token: string | null = null;
  private urlResolved = false;

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl;
    this.fallbackUrl = FALLBACK_URL;
    this.activeUrl = baseUrl;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("aios_token");
    }
  }

  setBaseUrl(url: string) { this.baseUrl = url; this.activeUrl = url; this.urlResolved = false; }
  private smartFetch: any = null;
  private async ensureFetch(): Promise<any> {
    if (!this.smartFetch) this.smartFetch = await resolveFetch();
    return this.smartFetch;
  }

  /**
   * Probe both URLs, pick the first one that responds. Cached after first success.
   */
  private async resolveUrl(): Promise<string> {
    if (this.urlResolved) return this.activeUrl;
    const fn = await this.ensureFetch();
    for (const url of [this.baseUrl, this.fallbackUrl]) {
      try {
        await fetchWithTimeout(fn, `${url}/api/auth/login`, { method: "OPTIONS" }, 5000);
        this.activeUrl = url;
        this.urlResolved = true;
        console.log(`[NET] resolved_url=${url}`);
        return this.activeUrl;
      } catch { /* try next */ }
    }
    this.activeUrl = this.baseUrl;
    this.urlResolved = true;
    return this.activeUrl;
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) localStorage.setItem("aios_token", token);
      else localStorage.removeItem("aios_token");
    }
  }

  getToken() { return this.token; }

  private async request<T>(path: string, config: RequestConfig = {}): Promise<T> {
    const { method = "GET", body, headers = {} } = config;
    const authHeaders: Record<string, string> = {};
    if (this.token) authHeaders["Authorization"] = `Bearer ${this.token}`;
    const init: RequestInit = {
      method,
      headers: { "Content-Type": "application/json", ...authHeaders, ...headers },
      body: body ? JSON.stringify(body) : undefined,
    };

    const base = await this.resolveUrl();
    const fn = await this.ensureFetch();

    let resp: Response;
    try {
      resp = await fetchWithTimeout(fn, `${base}${path}`, init, 15000);
    } catch (primaryErr) {
      // Primary failed — try fallback
      const fallback = base === this.baseUrl ? this.fallbackUrl : this.baseUrl;
      try {
        console.log(`[NET] primary failed, trying fallback=${fallback}`);
        resp = await fetchWithTimeout(fn, `${fallback}${path}`, init, 15000);
        if (base === this.baseUrl) this.activeUrl = this.fallbackUrl;
      } catch {
        throw new Error(`网络连接失败: 无法访问 ${this.baseUrl}，请检查网络或 VPN 设置`);
      }
    }

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: resp.statusText }));
      if (resp.status === 401) throw new Error(err.error || "登录已过期，请重新登录");
      if (resp.status === 403) throw new Error(err.error || "没有权限执行此操作");
      if (resp.status === 429) throw new Error(err.error || "请求过于频繁，请稍后重试");
      if (resp.status >= 500) throw new Error(err.error || `服务器错误 (${resp.status})`);
      throw new Error(err.error || err.message || `请求失败: HTTP ${resp.status}`);
    }
    return resp.json();
  }

  // ── Auth ──
  async login(email: string, password: string) {
    const data = await this.request<any>("/api/auth/login", { method: "POST", body: { email, password } });
    if (data.token) this.setToken(data.token);
    return data;
  }
  async register(username: string, email: string, password: string, code: string) {
    const data = await this.request<any>("/api/auth/register", { method: "POST", body: { username, email, password, code } });
    if (data.token) this.setToken(data.token);
    return data;
  }
  async sendCode(email: string, type: string = "REGISTER") {
    return this.request<any>("/api/auth/send-code", { method: "POST", body: { email, type } });
  }
  getMe() { return this.request<any>("/api/auth/me"); }

  // ── Forgot / Reset Password ──
  async requestResetCode(email: string) {
    return this.request<any>("/api/auth/reset-password", {
      method: "POST", body: { action: "request", email }
    });
  }
  async resetPassword(email: string, code: string, newPassword: string) {
    return this.request<any>("/api/auth/reset-password", {
      method: "POST", body: { action: "confirm", email, code, newPassword }
    });
  }
  logout() {
    this.setToken(null);
    return this.request("/api/auth/logout", { method: "POST" });
  }
  updateProfile(data: any) { return this.request("/api/auth/profile", { method: "PATCH", body: data }); }

  // ── Models ──
  getModels() { return this.request<{ models: any[] }>("/api/models"); }

  // ── Conversations ──
  getConversations() { return this.request<{ conversations: any[] }>("/api/conversations"); }
  getConversation(id: string) { return this.request<any>(`/api/conversations/${id}`); }
  deleteConversation(id: string) { return this.request(`/api/conversations/${id}`, { method: "DELETE" }); }

  // ── Chat SSE Stream ──
  async streamChat(
    modelId: string,
    messages: { role: string; content: string }[],
    conversationId: string | null,
    onChunk: (text: string) => void,
    onReasoning: (text: string) => void,
    onDone: (convId?: string) => void,
    onError: (error: string) => void
  ) {
    const authHeaders: Record<string, string> = {};
    if (this.token) authHeaders["Authorization"] = `Bearer ${this.token}`;
    const base = await this.resolveUrl();

    let resp: Response;
    try {
      // For SSE streaming, try Tauri fetch first, then native fetch
      // (Tauri HTTP plugin may not support ReadableStream for SSE)
      const fn = await this.ensureFetch();
      try {
        resp = await fetchWithTimeout(fn, `${base}/api/chat/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "text/event-stream", ...authHeaders },
          body: JSON.stringify({ modelId, messages, conversationId }),
        }, 30000);
      } catch {
        // If Tauri fetch fails for streaming, try native browser fetch
        if (fn !== fetch) {
          console.log("[NET] Tauri fetch failed for SSE, falling back to browser fetch");
          resp = await fetchWithTimeout(fetch, `${base}/api/chat/stream`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "text/event-stream", ...authHeaders },
            body: JSON.stringify({ modelId, messages, conversationId }),
          }, 30000);
        } else {
          throw new Error("fetch failed");
        }
      }
    } catch {
      onError("网络连接失败，请检查网络设置");
      return;
    }

    if (!resp.ok) {
      const errBody = await resp.json().catch(() => null);
      const errMsg = errBody?.error || resp.statusText;
      if (resp.status === 401) onError("登录已过期，请重新登录");
      else onError(`请求失败 [${resp.status}]: ${errMsg}`);
      return;
    }

    const reader = resp.body?.getReader();
    if (!reader) { onError("No response body"); return; }
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") { onDone(); return; }
        try {
          const chunk = JSON.parse(data);
          if (chunk.error) { onError(chunk.error); return; }
          chunk.choices?.forEach((c: any) => {
            if (c.delta?.content) onChunk(c.delta.content);
            if (c.delta?.reasoning) onReasoning(c.delta.reasoning);
          });
        } catch {}
      }
    }
    onDone();
  }

  // ── Agents ──
  getAgents() { return this.request<{ agents: any[] }>("/api/agents"); }
  executeAgent(id: string, input: string) {
    return this.request(`/api/agents/${id}/execute`, { method: "POST", body: { input } });
  }

  // ── Workflows ──
  getWorkflows() { return this.request<any>("/api/workflows"); }

  // ── Knowledge ──
  getKnowledge() { return this.request<any>("/api/knowledge"); }

  // ── Credits ──
  getCreditsBalance() { return this.request<any>("/api/credits/balance"); }

  // ── Usage ──
  getUsageStats() { return this.request<any>("/api/usage"); }

  // ── Site Config ──
  getSiteConfig() { return this.request<any>("/api/site-config"); }

  // ── App Update ──
  async checkUpdate(currentVersion: string): Promise<UpdateInfo | null> {
    try {
      const info = await this.request<UpdateInfo>("/api/app/version?platform=desktop");
      if (this.isNewerVersion(info.versionName, currentVersion)) return info;
      return null;
    } catch { return null; }
  }

  // ── Device Install Report ──
  async reportInstall() {
    try {
      let deviceId = localStorage.getItem("aios_device_id");
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("aios_device_id", deviceId);
      }
      const ua = navigator.userAgent;
      let osVersion = "Unknown";
      if (ua.includes("Windows NT 10")) osVersion = "Windows 10/11";
      else if (ua.includes("Windows NT 6.3")) osVersion = "Windows 8.1";
      else if (ua.includes("Windows NT 6.1")) osVersion = "Windows 7";
      else if (ua.includes("Mac OS X")) {
        const m = ua.match(/Mac OS X (\d+[._]\d+[._]?\d*)/);
        osVersion = `macOS ${m?.[1]?.replace(/_/g, ".") || ""}`;
      } else if (ua.includes("Linux")) osVersion = "Linux";

      const base = await this.resolveUrl();
      const fn = await this.ensureFetch();
      await fetchWithTimeout(fn, `${base}/api/app/install`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          platform: "windows",
          appVersion: APP_VERSION,
          osVersion,
          deviceModel: "Desktop PC",
        }),
      }, 10000);
    } catch { /* silent */ }
  }

  private isNewerVersion(remote: string, local: string): boolean {
    const parse = (v: string) => v.replace(/[^0-9.]/g, "").split(".").map(Number);
    const r = parse(remote), l = parse(local);
    for (let i = 0; i < Math.max(r.length, l.length); i++) {
      const a = r[i] || 0, b = l[i] || 0;
      if (a > b) return true;
      if (a < b) return false;
    }
    return false;
  }
}

export interface UpdateInfo {
  versionCode: number;
  versionName: string;
  minSupportedCode: number;
  downloadUrl: string;
  releaseNotes: string;
  releasedAt: string;
  apkSize?: number;
  filename?: string;
}

export const api = new ApiService();
