// ============================================================
// Google Gemini 适配器 (REST API，非 OpenAI 兼容格式)
// ============================================================

import type { ChatParams, ChatChunk, ChatMessage } from './base';
import { BaseProviderAdapter } from './base';

export class GoogleGeminiAdapter extends BaseProviderAdapter {
  private baseUrl: string;

  constructor(
    private apiKey: string,
    baseUrl?: string
  ) {
    super('GOOGLE');
    this.baseUrl =
      baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
  }

  async *chat(params: ChatParams): AsyncGenerator<ChatChunk> {
    const { systemInstruction, contents } = this.transformMessages(
      params.messages
    );

    const url = `${this.baseUrl}/models/${params.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;

    const body: Record<string, any> = {
      contents,
      generationConfig: {
        temperature: params.temperature ?? 0.7,
        maxOutputTokens: params.maxTokens ?? 4096,
        topP: params.topP,
      },
    };

    if (systemInstruction) {
      body.systemInstruction = systemInstruction;
    }

    if (params.tools) {
      body.tools = params.tools;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      await this.handleResponseError(response);
    }

    if (params.stream && response.body) {
      for await (const { data } of this.parseOpenAISSEStream(response)) {
        try {
          const json = JSON.parse(data);
          const candidates = json.candidates;
          if (!candidates || candidates.length === 0) continue;

          const candidate = candidates[0];
          const parts = candidate.content?.parts;
          if (!parts) continue;

          const textContent = parts
            .filter((p: any) => p.text)
            .map((p: any) => p.text)
            .join('');

          const isFinished =
            candidate.finishReason === 'STOP' ||
            candidate.finishReason === 'MAX_TOKENS' ||
            candidate.finishReason === 'SAFETY';

          if (textContent || isFinished) {
            yield {
              id: '',
              content: textContent,
              role: 'assistant',
              done: isFinished,
              usage: json.usageMetadata
                ? {
                    promptTokens: json.usageMetadata.promptTokenCount || 0,
                    completionTokens:
                      json.usageMetadata.candidatesTokenCount || 0,
                    totalTokens: json.usageMetadata.totalTokenCount || 0,
                  }
                : undefined,
            };
          }

          if (isFinished) return;
        } catch {
          // skip invalid JSON
        }
      }
    } else {
      const json = await response.json();
      const text =
        json.candidates?.[0]?.content?.parts
          ?.filter((p: any) => p.text)
          .map((p: any) => p.text)
          .join('') || '';

      yield {
        id: '',
        content: text,
        role: 'assistant',
        done: true,
        usage: json.usageMetadata
          ? {
              promptTokens: json.usageMetadata.promptTokenCount || 0,
              completionTokens: json.usageMetadata.candidatesTokenCount || 0,
              totalTokens: json.usageMetadata.totalTokenCount || 0,
            }
          : undefined,
      };
    }
  }

  /**
   * 将 OpenAI 格式消息转换为 Gemini 格式
   */
  private transformMessages(messages: ChatMessage[]): {
    systemInstruction: { parts: { text: string }[] } | null;
    contents: { role: string; parts: { text: string }[] }[];
  } {
    let systemInstruction: { parts: { text: string }[] } | null = null;
    const contents: { role: string; parts: { text: string }[] }[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction = { parts: [{ text: msg.content || '' }] };
        continue;
      }

      // Gemini uses 'user' and 'model' roles
      const role = msg.role === 'assistant' ? 'model' : 'user';
      contents.push({
        role,
        parts: [{ text: msg.content || '' }],
      });
    }

    return { systemInstruction, contents };
  }

  async models(): Promise<string[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/models?key=${this.apiKey}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!response.ok) return ['gemini-2.5-pro', 'gemini-2.5-flash'];
      const data = await response.json();
      return (
        data.models
          ?.filter((m: any) =>
            m.supportedGenerationMethods?.includes('generateContent')
          )
          .map((m: any) => m.name?.replace('models/', '')) || []
      );
    } catch {
      return ['gemini-2.5-pro', 'gemini-2.5-flash'];
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/models?key=${this.apiKey}`,
        { signal: AbortSignal.timeout(5000) }
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}
