// ============================================================
// AI Gateway - 统一 AI Provider 适配层
// 前端绝不能直接访问真实 Provider API Key
// ============================================================

import prisma from '@/lib/db';
import { decrypt } from '@/lib/security/crypto';
import type { AIProviderAdapter, ChatParams } from './providers';
import { createProviderAdapter } from './providers';
import { recoverRateLimitedKeys } from './key-pool';

export type { ChatParams, ChatMessage, ChatChunk } from './providers';

/** 熔断阈值: 连续失败次数 */
const CIRCUIT_BREAKER_THRESHOLD = 5;
/** 熔断恢复时间: 5 分钟 */
const CIRCUIT_RECOVERY_MS = 5 * 60 * 1000;

export class AIGateway {
  // 获取可用的 API Key (带轮询、熔断、自动恢复)
  async getKey(providerId: string): Promise<{
    adapter: AIProviderAdapter;
    keyId: string;
  }> {
    // 自动恢复过期的熔断 Key
    await recoverRateLimitedKeys();

    const keys = await prisma.apiKey.findMany({
      where: {
        providerId,
        status: 'ACTIVE',
        isEnabled: true,
        circuitOpen: false,
      },
      include: { provider: true },
      orderBy: { weight: 'desc' },
    });

    if (keys.length === 0) {
      throw new Error('没有可用的 API Key');
    }

    // 权重随机选择
    const totalWeight = keys.reduce((sum, k) => sum + k.weight, 0);
    let random = Math.random() * totalWeight;
    let selected = keys[0];
    for (const key of keys) {
      random -= key.weight;
      if (random <= 0) {
        selected = key;
        break;
      }
    }

    // 解密 Key
    const decryptedKey = decrypt(selected.keyEncrypted);
    const adapter = createProviderAdapter(
      selected.provider.type,
      selected.provider.baseUrl,
      decryptedKey
    );

    return { adapter, keyId: selected.id };
  }

  // 记录 Key 错误 + 统一熔断逻辑
  private async recordKeyError(keyId: string, error: any) {
    await prisma.apiKey.update({
      where: { id: keyId },
      data: {
        lastError: error.message,
        errorCount: { increment: 1 },
        consecutiveErrors: { increment: 1 },
      },
    });

    // 熔断检查
    const key = await prisma.apiKey.findUnique({ where: { id: keyId } });
    if (key && key.consecutiveErrors >= CIRCUIT_BREAKER_THRESHOLD) {
      await prisma.apiKey.update({
        where: { id: keyId },
        data: {
          circuitOpen: true,
          circuitOpenUntil: new Date(Date.now() + CIRCUIT_RECOVERY_MS),
          status: 'RATE_LIMITED',
        },
      });
    }
  }

  // 执行聊天请求 (带重试和 Fallback)
  async chat(params: ChatParams & { modelId: string; userId: string }) {
    const model = await prisma.model.findUnique({
      where: { id: params.modelId },
      include: { provider: true },
    });

    if (!model || !model.isEnabled) {
      throw new Error('模型不可用');
    }

    // 检查用户额度
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
    });
    if (!user) throw new Error('用户不存在');

    const availableBalance = Number(user.balance) + Number(user.creditLimit);
    if (availableBalance <= 0) {
      throw new Error('余额不足，请充值');
    }

    // 注入语言跟随提示
    const locale = user.locale || 'zh-CN';
    const langHint =
      locale === 'zh-CN'
        ? '请默认使用简体中文回答用户。'
        : 'Please answer in English by default.';

    const messages = [...params.messages];
    if (messages[0]?.role === 'system') {
      messages[0] = {
        ...messages[0],
        content: `${messages[0].content}\n\n${langHint}`,
      };
    } else {
      messages.unshift({ role: 'system', content: langHint });
    }

    // 获取 Key 并执行
    const { adapter, keyId } = await this.getKey(model.providerId);
    const startTime = Date.now();

    try {
      const generator = adapter.chat({ ...params, messages });
      const chunks: string[] = [];
      let usage: any = null;

      for await (const chunk of generator) {
        if (chunk.content) chunks.push(chunk.content);
        if (chunk.usage) usage = chunk.usage;
        if (chunk.done) break;
      }

      const latency = Date.now() - startTime;
      const content = chunks.join('');

      // 计算费用
      const promptTokens = usage?.promptTokens || 0;
      const completionTokens = usage?.completionTokens || 0;
      const cost =
        (promptTokens * Number(model.inputPrice) +
          completionTokens * Number(model.outputPrice)) /
        1_000_000;

      // 记录使用日志
      await prisma.usageLog.create({
        data: {
          userId: params.userId,
          modelId: model.id,
          requestId: crypto.randomUUID(),
          endpoint: 'chat',
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
          cost,
          providerCost: cost,
          latency,
          apiKeyId: keyId,
          statusCode: 200,
        },
      });

      // 更新模型统计
      await prisma.model.update({
        where: { id: model.id },
        data: {
          totalCalls: { increment: 1 },
          totalTokens: { increment: promptTokens + completionTokens },
        },
      });

      // 更新用户余额
      if (cost > 0) {
        await prisma.user.update({
          where: { id: params.userId },
          data: {
            balance: { decrement: cost },
            totalSpent: { increment: cost },
          },
        });
      }

      return {
        content,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
        cost,
        latency,
        model: model.name,
        provider: model.provider.name,
      };
    } catch (error: any) {
      // 统一记录错误 + 熔断
      await this.recordKeyError(keyId, error);

      throw error;
    }
  }

  // 流式聊天
  async *chatStream(params: ChatParams & { modelId: string; userId: string }) {
    const model = await prisma.model.findUnique({
      where: { id: params.modelId },
      include: { provider: true },
    });

    if (!model || !model.isEnabled) {
      throw new Error('模型不可用');
    }

    const user = await prisma.user.findUnique({
      where: { id: params.userId },
    });
    if (!user) throw new Error('用户不存在');

    const availableBalance = Number(user.balance) + Number(user.creditLimit);
    if (availableBalance <= 0) {
      throw new Error('余额不足，请充值');
    }

    // 注入语言跟随
    const locale = user.locale || 'zh-CN';
    const langHint =
      locale === 'zh-CN'
        ? '请默认使用简体中文回答用户。'
        : 'Please answer in English by default.';

    const messages = [...params.messages];
    if (messages[0]?.role === 'system') {
      messages[0] = {
        ...messages[0],
        content: `${messages[0].content}\n\n${langHint}`,
      };
    } else {
      messages.unshift({ role: 'system', content: langHint });
    }

    const { adapter, keyId } = await this.getKey(model.providerId);
    const startTime = Date.now();

    try {
      const generator = adapter.chat({ ...params, messages, stream: true });

      for await (const chunk of generator) {
        yield chunk;
      }

      const latency = Date.now() - startTime;

      // 记录使用日志
      await prisma.usageLog.create({
        data: {
          userId: params.userId,
          modelId: model.id,
          requestId: crypto.randomUUID(),
          endpoint: 'chat/stream',
          promptTokens: 0, // 会在最终 chunk 中更新
          completionTokens: 0,
          totalTokens: 0,
          cost: 0,
          providerCost: 0,
          latency,
          apiKeyId: keyId,
          statusCode: 200,
        },
      });
    } catch (error: any) {
      await this.recordKeyError(keyId, error);
      throw error;
    }
  }
}

// 单例
export const aiGateway = new AIGateway();
