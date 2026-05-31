// ============================================================
// Provider Registry + Factory
// ============================================================

import type { AIProviderAdapter } from './base';
import { OpenAICompatibleAdapter } from './openai';
import { AnthropicAdapter } from './anthropic';
import { DeepSeekAdapter } from './deepseek';
import { XiaomiMiMoAdapter } from './xiaomi';
import { GoogleGeminiAdapter } from './google';

export { BaseProviderAdapter } from './base';
export type {
  AIProviderAdapter,
  ChatParams,
  ChatMessage,
  ChatChunk,
} from './base';
export { OpenAICompatibleAdapter } from './openai';
export { AnthropicAdapter } from './anthropic';
export { DeepSeekAdapter } from './deepseek';
export { XiaomiMiMoAdapter } from './xiaomi';
export { GoogleGeminiAdapter } from './google';

/**
 * Provider 工厂 - 根据 type 创建对应的适配器实例
 */
export function createProviderAdapter(
  type: string,
  baseUrl: string,
  apiKey: string
): AIProviderAdapter {
  switch (type) {
    case 'ANTHROPIC':
      return new AnthropicAdapter(apiKey);

    case 'DEEPSEEK':
      return new DeepSeekAdapter(apiKey);

    case 'XIAOMI':
      return new XiaomiMiMoAdapter(apiKey, baseUrl || undefined);

    case 'GOOGLE':
      return new GoogleGeminiAdapter(apiKey, baseUrl || undefined);

    default:
      // OpenAI 兼容: OpenAI, Qwen, GLM, Kimi, etc.
      return new OpenAICompatibleAdapter(baseUrl, apiKey, type);
  }
}
