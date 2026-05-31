// ============================================================
// Base Provider Adapter - 抽象基类和接口定义
// ============================================================

// Provider 适配器接口
export interface AIProviderAdapter {
  chat(params: ChatParams): AsyncGenerator<ChatChunk>;
  models(): Promise<string[]>;
  healthCheck(): Promise<boolean>;
}

export interface ChatParams {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
  tools?: any[];
  jsonMode?: boolean;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  toolCalls?: any[];
  toolCallId?: string;
}

export interface ChatChunk {
  id: string;
  content: string;
  role: string;
  done: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  toolCalls?: any[];
}

/**
 * 抽象基类，所有 Provider Adapter 必须继承此类
 */
export abstract class BaseProviderAdapter implements AIProviderAdapter {
  protected providerName: string;

  constructor(providerName: string) {
    this.providerName = providerName;
  }

  abstract chat(params: ChatParams): AsyncGenerator<ChatChunk>;
  abstract models(): Promise<string[]>;
  abstract healthCheck(): Promise<boolean>;

  /**
   * 通用 SSE 流解析器
   * 解析 OpenAI 兼容的 SSE 流，逐行提取 data: 行
   */
  protected async *parseOpenAISSEStream(
    response: Response
  ): AsyncGenerator<{ event: string; data: string }> {
    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('data: ')) {
          yield { event: 'data', data: trimmed.slice(6) };
        } else if (trimmed.startsWith('event: ')) {
          // Anthropic style events - skip, handled by data lines
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim()) {
      if (buffer.trim().startsWith('data: ')) {
        yield { event: 'data', data: buffer.trim().slice(6) };
      }
    }
  }

  /**
   * 通用错误包装
   */
  protected async handleResponseError(response: Response): Promise<never> {
    const error = await response.text();
    throw new Error(
      `${this.providerName} API Error: ${response.status} - ${error}`
    );
  }
}
