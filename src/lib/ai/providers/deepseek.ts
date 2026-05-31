// ============================================================
// DeepSeek 适配器 (OpenAI 兼容)
// ============================================================

import { OpenAICompatibleAdapter } from './openai';

export class DeepSeekAdapter extends OpenAICompatibleAdapter {
  constructor(apiKey: string) {
    super('https://api.deepseek.com', apiKey, 'DEEPSEEK');
  }

  async models(): Promise<string[]> {
    return [
      'deepseek-chat',
      'deepseek-coder',
      'deepseek-reasoner',
    ];
  }
}
