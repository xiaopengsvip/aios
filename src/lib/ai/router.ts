// ============================================================
// 模型路由器 - 根据模型名称自动选择 Provider
// ============================================================

import type { AIProviderAdapter } from './providers';
import { createProviderAdapter } from './providers';

interface ProviderConfig {
  type: string;
  baseUrl: string;
  apiKey: string;
}

/**
 * 模型名称到 Provider 类型的映射
 */
const MODEL_PROVIDER_MAP: Record<string, string> = {
  // Anthropic Claude
  'claude': 'ANTHROPIC',
  // DeepSeek
  'deepseek': 'DEEPSEEK',
  // Xiaomi MiMo
  'mimo': 'XIAOMI',
  // Google Gemini
  'gemini': 'GOOGLE',
};

/**
 * 根据模型名称推断 Provider 类型
 */
export function inferProviderType(modelName: string): string {
  const lowerModel = modelName.toLowerCase();
  for (const [prefix, type] of Object.entries(MODEL_PROVIDER_MAP)) {
    if (lowerModel.startsWith(prefix) || lowerModel.includes(prefix)) {
      return type;
    }
  }
  return 'OPENAI'; // 默认
}

/**
 * 根据模型名称路由到正确的 Provider Adapter
 */
export function routeToProvider(
  modelName: string,
  providerConfigs: Record<string, ProviderConfig>
): AIProviderAdapter {
  const providerType = inferProviderType(modelName);
  const config = providerConfigs[providerType];

  if (!config) {
    throw new Error(`No provider config found for model: ${modelName} (type: ${providerType})`);
  }

  return createProviderAdapter(config.type, config.baseUrl, config.apiKey);
}
