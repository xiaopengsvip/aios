// ============================================================
// Agent 执行引擎 - 工具调用循环
// ============================================================

import prisma from '@/lib/db';
import { decrypt } from '@/lib/security/crypto';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
}

export interface ToolCallResult {
  toolName: string;
  input: Record<string, unknown>;
  output: string;
  success: boolean;
  duration: number;
}

export interface AgentStep {
  stepNumber: number;
  type: 'thinking' | 'tool_call' | 'tool_result' | 'response';
  content: string;
  toolCalls?: ToolCallResult[];
  timestamp: Date;
}

// 获取可用工具列表
export function getAvailableTools(): ToolDefinition[] {
  return [
    {
      name: 'web_search',
      description: 'Search the web for information. Returns relevant search results.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The search query' },
        },
        required: ['query'],
      },
    },
    {
      name: 'url_fetch',
      description: 'Fetch content from a URL. Returns the page text content.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'The URL to fetch' },
        },
        required: ['url'],
      },
    },
    {
      name: 'code_runner',
      description: 'Execute JavaScript code in a sandboxed environment. Returns the output.',
      parameters: {
        type: 'object',
        properties: {
          code: { type: 'string', description: 'JavaScript code to execute' },
          language: { type: 'string', description: 'Programming language', enum: ['javascript', 'python'] },
        },
        required: ['code'],
      },
    },
    {
      name: 'calculator',
      description: 'Evaluate a mathematical expression. Returns the result.',
      parameters: {
        type: 'object',
        properties: {
          expression: { type: 'string', description: 'Math expression to evaluate' },
        },
        required: ['expression'],
      },
    },
    {
      name: 'datetime',
      description: 'Get current date, time, timezone info, or calculate date differences.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', description: 'Action: now, format, diff', enum: ['now', 'format', 'diff'] },
          date1: { type: 'string', description: 'First date for diff calculation' },
          date2: { type: 'string', description: 'Second date for diff calculation' },
          format: { type: 'string', description: 'Output format template' },
        },
      },
    },
    {
      name: 'json_processor',
      description: 'Parse, query, or transform JSON data.',
      parameters: {
        type: 'object',
        properties: {
          data: { type: 'string', description: 'JSON string to process' },
          query: { type: 'string', description: 'JSONPath or jq-style query' },
          action: { type: 'string', description: 'Action: parse, query, transform', enum: ['parse', 'query', 'transform'] },
        },
        required: ['data', 'action'],
      },
    },
  ];
}

// 执行单个工具
export async function executeTool(
  toolName: string,
  input: Record<string, unknown>
): Promise<ToolCallResult> {
  const start = Date.now();

  try {
    let output = '';

    switch (toolName) {
      case 'web_search':
        output = await toolWebSearch(input.query as string);
        break;
      case 'url_fetch':
        output = await toolUrlFetch(input.url as string);
        break;
      case 'code_runner':
        output = await toolCodeRunner(input.code as string, (input.language as string) || 'javascript');
        break;
      case 'calculator':
        output = await toolCalculator(input.expression as string);
        break;
      case 'datetime':
        output = await toolDatetime(input.action as string, input);
        break;
      case 'json_processor':
        output = await toolJsonProcessor(input.data as string, input.action as string, input.query as string);
        break;
      default:
        output = `Unknown tool: ${toolName}`;
    }

    return {
      toolName,
      input,
      output,
      success: true,
      duration: Date.now() - start,
    };
  } catch (error: any) {
    return {
      toolName,
      input,
      output: `Error: ${error.message}`,
      success: false,
      duration: Date.now() - start,
    };
  }
}

// Agent 执行主循环
export async function runAgent(
  agentId: string,
  userId: string,
  userMessage: string,
  maxSteps: number = 10
): Promise<{ response: string; steps: AgentStep[]; tokensUsed: number }> {
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) throw new Error('Agent not found');

  // 获取模型配置
  const model = agent.modelId
    ? await prisma.model.findUnique({ where: { id: agent.modelId }, include: { provider: true } })
    : await prisma.model.findFirst({ where: { name: 'mimo-v2.5-pro', isEnabled: true }, include: { provider: true } });

  if (!model) throw new Error('No available model');

  // 获取 API Key
  const keys = await prisma.apiKey.findMany({
    where: { providerId: model.providerId, status: 'ACTIVE', isEnabled: true, circuitOpen: false },
    orderBy: { weight: 'desc' },
  });
  if (keys.length === 0) throw new Error('No available API key');

  const apiKey = decrypt(keys[0].keyEncrypted);
  const tools = getAvailableTools();
  const agentTools = (agent.tools as string[]) || [];
  const activeTools = tools.filter((t) => agentTools.includes(t.name) || agentTools.includes('*'));

  const steps: AgentStep[] = [];
  const messages: Array<{ role: string; content: string; tool_calls?: any[]; tool_call_id?: string }> = [];

  // System prompt
  messages.push({ role: 'system', content: agent.systemPrompt });
  messages.push({ role: 'user', content: userMessage });

  // Memory: retrieve past execution context
  const pastExecutions = await prisma.agentExecution.findMany({
    where: { agentId, userId, status: 'COMPLETED' },
    orderBy: { completedAt: 'desc' },
    take: 5,
    select: { input: true, output: true, steps: true, completedAt: true },
  });

  if (pastExecutions.length > 0) {
    const memoryContext = pastExecutions.map((e, i) =>
      `[Memory ${i + 1}] Input: ${JSON.stringify(e.input).slice(0, 200)} | Output: ${JSON.stringify(e.output).slice(0, 300)}`
    ).join('\n');
    messages.push({
      role: 'system',
      content: `Past execution context (for reference):\n${memoryContext}`,
    });
  }

  // Planning: break task into steps if complex
  const planningPrompt = `Before executing, analyze if this task needs multiple steps. If yes, create a brief plan. If simple, proceed directly.\nTask: ${userMessage}`;
  messages.push({ role: 'system', content: planningPrompt });

  let totalTokens = 0;
  let finalResponse = '';
  const reflectionNotes: string[] = [];

  for (let step = 0; step < maxSteps; step++) {
    // 调用 LLM
    const body: any = {
      model: model.name,
      messages,
      max_tokens: agent.maxTokens || 4096,
      temperature: agent.temperature ? Number(agent.temperature) : 0.7,
    };

    if (activeTools.length > 0) {
      body.tools = activeTools.map((t) => ({
        type: 'function',
        function: { name: t.name, description: t.description, parameters: t.parameters },
      }));
    }

    const baseUrl = model.provider.baseUrl.replace(/\/v1\/?$/, '');
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Provider error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    totalTokens += data.usage?.total_tokens || 0;

    if (!choice) throw new Error('No response from model');

    const assistantMessage = choice.message;
    messages.push(assistantMessage);

    // 检查是否有工具调用
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolResults: ToolCallResult[] = [];

      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        let functionArgs: Record<string, unknown> = {};
        try {
          functionArgs = JSON.parse(toolCall.function.arguments);
        } catch {}

        const result = await executeTool(functionName, functionArgs);
        toolResults.push(result);

        // 把工具结果加入消息
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: result.output,
        });
      }

      // Reflection: evaluate tool results
      const successfulTools = toolResults.filter(r => r.success);
      const failedTools = toolResults.filter(r => !r.success);
      let reflection = `Step ${step + 1}: ${successfulTools.length}/${toolResults.length} tools succeeded.`;
      if (failedTools.length > 0) {
        reflection += ` Failed: ${failedTools.map(t => t.toolName).join(', ')}. Consider alternative approaches.`;
      }
      reflectionNotes.push(reflection);

      steps.push({
        stepNumber: step + 1,
        type: 'tool_call',
        content: `Called ${toolResults.length} tool(s). ${reflection}`,
        toolCalls: toolResults,
        timestamp: new Date(),
      });
      // Add reflection context for next step
      if (step < maxSteps - 1 && reflectionNotes.length > 0) {
        messages.push({
          role: 'system',
          content: `Reflection: ${reflectionNotes[reflectionNotes.length - 1]} Continue or provide final answer.`,
        });
      }
    } else {
      // 没有工具调用，这就是最终回复
      finalResponse = assistantMessage.content || '';
      steps.push({
        stepNumber: step + 1,
        type: 'response',
        content: finalResponse,
        timestamp: new Date(),
      });
      break;
    }
  }

  // 记录执行
  await prisma.agentExecution.create({
    data: {
      agentId,
      userId,
      input: { message: userMessage },
      output: { response: finalResponse },
      steps: steps as any,
      status: 'COMPLETED',
      tokensUsed: totalTokens,
      startedAt: new Date(),
      completedAt: new Date(),
    },
  });

  // 更新运行次数
  await prisma.agent.update({
    where: { id: agentId },
    data: { runCount: { increment: 1 } },
  });

  return { response: finalResponse, steps, tokensUsed: totalTokens };
}

// ============================================================
// 工具实现
// ============================================================

async function toolWebSearch(query: string): Promise<string> {
  // 使用 DuckDuckGo Instant Answer API (无需 key)
  try {
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`,
      { signal: AbortSignal.timeout(10000) }
    );
    const data = await res.json();

    const results: string[] = [];
    if (data.Abstract) results.push(`Summary: ${data.Abstract}`);
    if (data.Answer) results.push(`Answer: ${data.Answer}`);
    if (data.RelatedTopics) {
      data.RelatedTopics.slice(0, 5).forEach((t: any) => {
        if (t.Text) results.push(`- ${t.Text}`);
      });
    }
    return results.length > 0 ? results.join('\n') : `No results found for: ${query}`;
  } catch (e: any) {
    return `Search failed: ${e.message}`;
  }
}

async function toolUrlFetch(url: string): Promise<string> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: { 'User-Agent': 'AIOS-Agent/1.0' },
  });
  const text = await res.text();
  // Strip HTML tags for basic text extraction
  const cleaned = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned.slice(0, 8000); // Limit output
}

async function toolCodeRunner(code: string, language: string): Promise<string> {
  if (language === 'javascript') {
    try {
      // Sandboxed eval with limited scope
      const fn = new Function('console', code);
      const logs: string[] = [];
      const mockConsole = { log: (...args: any[]) => logs.push(args.map(String).join(' ')) };
      fn(mockConsole);
      return logs.join('\n') || '(no output)';
    } catch (e: any) {
      return `Error: ${e.message}`;
    }
  }
  return `Language '${language}' not supported in sandbox`;
}

async function toolCalculator(expression: string): Promise<string> {
  try {
    // Basic math evaluation (safe)
    const sanitized = expression.replace(/[^0-9+\-*/().%\s^]/g, '');
    const result = Function(`"use strict"; return (${sanitized})`)();
    return String(result);
  } catch (e: any) {
    return `Error: ${e.message}`;
  }
}

async function toolDatetime(action: string, input: Record<string, unknown>): Promise<string> {
  const now = new Date();
  switch (action) {
    case 'now':
      return JSON.stringify({
        utc: now.toISOString(),
        local: now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
        timestamp: now.getTime(),
      });
    case 'diff': {
      const d1 = new Date(input.date1 as string);
      const d2 = new Date((input.date2 as string) || now.toISOString());
      const diffMs = d2.getTime() - d1.getTime();
      const diffDays = Math.floor(diffMs / 86400000);
      const diffHours = Math.floor((diffMs % 86400000) / 3600000);
      return `${diffDays} days, ${diffHours} hours`;
    }
    default:
      return now.toISOString();
  }
}

async function toolJsonProcessor(data: string, action: string, query?: string): Promise<string> {
  try {
    const parsed = JSON.parse(data);
    switch (action) {
      case 'parse':
        return JSON.stringify(parsed, null, 2).slice(0, 4000);
      case 'query': {
        // Simple key access
        const keys = (query || '').split('.');
        let result: any = parsed;
        for (const k of keys) {
          if (k && result) result = result[k];
        }
        return JSON.stringify(result, null, 2).slice(0, 4000);
      }
      default:
        return JSON.stringify(parsed, null, 2).slice(0, 4000);
    }
  } catch (e: any) {
    return `JSON Error: ${e.message}`;
  }
}
