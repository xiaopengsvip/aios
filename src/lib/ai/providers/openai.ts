// ============================================================
// OpenAI 兼容适配器 (覆盖 OpenAI, DeepSeek, Qwen, etc.)
// ============================================================

import type { ChatParams, ChatChunk } from './base';
import { BaseProviderAdapter } from './base';

export class OpenAICompatibleAdapter extends BaseProviderAdapter {
  private apiBase: string;
  private hasVersionPath: boolean;

  constructor(
    private baseUrl: string,
    private apiKey: string,
    providerName: string
  ) {
    super(providerName);
    // 检测 baseUrl 是否已包含版本路径 (/v1, /v2, /api/v3 等)
    const versionMatch = baseUrl.match(/\/(v\d+|api\/v\d+)\/?$/);
    this.hasVersionPath = !!versionMatch;
    // 移除末尾的版本路径，得到干净的基础 URL
    this.apiBase = baseUrl.replace(/\/(v\d+|api\/v\d+)\/?$/, '');
  }

  async *chat(params: ChatParams): AsyncGenerator<ChatChunk> {
    const response = await fetch(`${this.apiBase}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 4096,
        top_p: params.topP,
        stream: params.stream ?? true,
        tools: params.tools,
        response_format: params.jsonMode
          ? { type: 'json_object' }
          : undefined,
      }),
    });

    if (!response.ok) {
      await this.handleResponseError(response);
    }

    if (params.stream && response.body) {
      for await (const { data } of this.parseOpenAISSEStream(response)) {
        if (data === '[DONE]') {
          yield { id: '', content: '', role: 'assistant', done: true };
          return;
        }

        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta;
          if (delta) {
            yield {
              id: json.id,
              content: delta.content || '',
              role: delta.role || 'assistant',
              done: false,
              toolCalls: delta.tool_calls,
              usage: json.usage,
            };
          }
        } catch {
          // skip invalid JSON
        }
      }
    } else {
      const json = await response.json();
      yield {
        id: json.id,
        content: json.choices?.[0]?.message?.content || '',
        role: 'assistant',
        done: true,
        usage: json.usage,
      };
    }
  }

  async models(): Promise<string[]> {
    const response = await fetch(`${this.apiBase}/v1/models`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.data?.map((m: any) => m.id) || [];
  }

  async healthCheck(): Promise<boolean> {
    try {
      // 构建候选 URL 列表 — 只测试需要认证的端点
      const urls: string[] = [];
      if (this.hasVersionPath) {
        // baseUrl 已含版本路径 (如 /v1, /api/v3): 直接加 /models
        urls.push(`${this.baseUrl}/models`);
      }
      // 通用回退: /v1/models
      urls.push(`${this.apiBase}/v1/models`);

      for (const url of urls) {
        try {
          const response = await fetch(url, {
            headers: { Authorization: `Bearer ${this.apiKey}` },
            signal: AbortSignal.timeout(5000),
          });
          if (response.ok) return true;
        } catch {
          // 继续尝试下一个 URL
        }
      }
      return false;
    } catch {
      return false;
    }
  }
}
