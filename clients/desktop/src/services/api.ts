const BASE_URL = "https://aios.vios.top";

interface RequestConfig {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setBaseUrl(url: string) { this.baseUrl = url; }

  private async request<T>(path: string, config: RequestConfig = {}): Promise<T> {
    const { method = "GET", body, headers = {} } = config;
    const resp = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...headers },
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include", // Cookie-based auth
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: resp.statusText }));
      throw new Error(err.error || err.message || `HTTP ${resp.status}`);
    }
    return resp.json();
  }

  // ── Auth ──
  login(email: string, password: string) {
    return this.request("/api/auth/login", { method: "POST", body: { email, password } });
  }
  register(username: string, email: string, password: string) {
    return this.request("/api/auth/register", { method: "POST", body: { username, email, password } });
  }
  getMe() { return this.request<any>("/api/auth/me"); }
  logout() { return this.request("/api/auth/logout", { method: "POST" }); }
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
    const resp = await fetch(`${this.baseUrl}/api/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify({ modelId, messages, conversationId }),
      credentials: "include",
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
}

export const api = new ApiService();
