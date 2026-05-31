// ============================================================
// Xiaomi MiMo 适配器 (OpenAI 兼容，自定义 Header，多模态支持)
// ============================================================

import type { ChatParams, ChatChunk, ChatMessage } from './base';
import { BaseProviderAdapter } from './base';

export class XiaomiMiMoAdapter extends BaseProviderAdapter {
  private baseUrl: string;

  constructor(
    private apiKey: string,
    baseUrl?: string
  ) {
    super('XIAOMI');
    this.baseUrl = baseUrl || 'https://api.xiaomi.com/v1';
  }

  async *chat(params: ChatParams): AsyncGenerator<ChatChunk> {
    // 转换消息格式以支持多模态
    const messages = this.transformMessages(params.messages);

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.apiKey,
      },
      body: JSON.stringify({
        model: params.model,
        messages,
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

  /**
   * 转换消息以支持多模态内容
   * MiMo 支持：图片(base64)、音频(input_audio)、视频(video_url+fps)
   */
  private transformMessages(messages: ChatMessage[]): any[] {
    return messages.map((m) => {
      // 如果 content 已经是结构化内容（多模态），直接返回
      if (Array.isArray(m.content)) {
        return { role: m.role, content: m.content };
      }

      // 普通文本消息
      return {
        role: m.role === 'tool' ? 'assistant' : m.role,
        content: m.content,
        ...(m.toolCalls ? { tool_calls: m.toolCalls } : {}),
        ...(m.toolCallId ? { tool_call_id: m.toolCallId } : {}),
      };
    });
  }

  async models(): Promise<string[]> {
    return [
      'mimo-v2.5-pro',
      'mimo-v2.5-vision',
    ];
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { 'api-key': this.apiKey },
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
