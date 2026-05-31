const BASE_URL = "https://aios.vios.top";

interface RequestConfig {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl;
    // Restore token from localStorage
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("aios_token");
    }
  }

  setBaseUrl(url: string) { this.baseUrl = url; }

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

    const resp = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...authHeaders, ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: resp.statusText }));
      throw new Error(err.error || err.message || `HTTP ${resp.status}`);
    }
    return resp.json();
  }

  // ── Auth ──
  async login(email: string, password: string) {
    const data = await this.request<any>("/api/auth/login", { method: "POST", body: { email, password } });
    if (data.token) this.setToken(data.token);
    return data;
  }
  async register(username: string, email: string, password: string) {
    const data = await this.request<any>("/api/auth/register", { method: "POST", body: { username, email, password } });
    if (data.token) this.setToken(data.token);
    return data;
  }
  getMe() { return this.request<any>("/api/auth/me"); }
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

    const resp = await fetch(`${this.baseUrl}/api/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream", ...authHeaders },
      body: JSON.stringify({ modelId, messages, conversationId }),
    });

    if (!resp.ok) {
      onError(`HTTP ${resp.status}: ${resp.statusText}`);
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
