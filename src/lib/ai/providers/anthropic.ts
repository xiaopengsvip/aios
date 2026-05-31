// ============================================================
// Anthropic Claude 适配器
// ============================================================

import type { ChatParams, ChatChunk } from './base';
import { BaseProviderAdapter } from './base';

export class AnthropicAdapter extends BaseProviderAdapter {
  constructor(private apiKey: string) {
    super('ANTHROPIC');
  }

  async *chat(params: ChatParams): AsyncGenerator<ChatChunk> {
    // 分离 system prompt
    const systemMsg = params.messages.find((m) => m.role === 'system');
    const nonSystemMsgs = params.messages.filter((m) => m.role !== 'system');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: params.model,
        system: systemMsg?.content,
        messages: nonSystemMsgs.map((m) => ({
          role: m.role === 'tool' ? 'assistant' : m.role,
          content: m.content,
        })),
        max_tokens: params.maxTokens ?? 4096,
        temperature: params.temperature ?? 0.7,
        stream: params.stream ?? true,
      }),
    });

    if (!response.ok) {
      await this.handleResponseError(response);
    }

    if (params.stream && response.body) {
      for await (const { data } of this.parseOpenAISSEStream(response)) {
        try {
          const json = JSON.parse(data);
          if (json.type === 'content_block_delta') {
            yield {
              id: '',
              content: json.delta?.text || '',
              role: 'assistant',
              done: false,
            };
          } else if (json.type === 'message_stop') {
            yield { id: '', content: '', role: 'assistant', done: true };
            return;
          }
        } catch {
          // skip
        }
      }
    }
  }

  async models(): Promise<string[]> {
    return [
      'claude-opus-4-20250514',
      'claude-sonnet-4-20250514',
      'claude-3-5-haiku-20241022',
    ];
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
