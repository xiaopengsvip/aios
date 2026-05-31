// ============================================================
// Workflow 执行引擎
// ============================================================

import prisma from '@/lib/db';
import { decrypt } from '@/lib/security/crypto';

interface WorkflowNode {
  id: string;
  type: string; // 'start' | 'llm' | 'tool' | 'condition' | 'end'
  data: Record<string, unknown>;
  position?: { x: number; y: number };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  label?: string;
}

interface ExecutionStep {
  nodeId: string;
  nodeType: string;
  input: unknown;
  output: unknown;
  status: 'success' | 'error' | 'skipped';
  duration: number;
  timestamp: Date;
}

// 执行工作流
export async function executeWorkflow(
  workflowId: string,
  userId: string,
  input: Record<string, unknown>
): Promise<{ output: Record<string, unknown>; steps: ExecutionStep[]; status: string }> {
  const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
  if (!workflow) throw new Error('Workflow not found');

  const nodes = (workflow.nodes as unknown as WorkflowNode[]) || [];
  const edges = (workflow.edges as unknown as WorkflowEdge[]) || [];
  const variables = { ...((workflow.variables as Record<string, unknown>) || {}), ...input };

  // 找到开始节点
  const startNode = nodes.find((n) => n.type === 'start') || nodes[0];
  if (!startNode) throw new Error('No start node');

  const steps: ExecutionStep[] = [];
  const context: Record<string, unknown> = { ...variables };
  let currentNodeId = startNode.id;
  let maxIterations = 50; // 防止死循环

  while (currentNodeId && maxIterations-- > 0) {
    const node = nodes.find((n) => n.id === currentNodeId);
    if (!node) break;

    const start = Date.now();
    try {
      const result = await executeNode(node, context);
      steps.push({
        nodeId: node.id,
        nodeType: node.type,
        input: context,
        output: result,
        status: 'success',
        duration: Date.now() - start,
        timestamp: new Date(),
      });

      // 更新上下文
      if (result && typeof result === 'object') {
        Object.assign(context, result);
      }

      // 如果是结束节点，停止
      if (node.type === 'end') break;

      // 找下一个节点
      const nextEdge = edges.find((e) => e.source === currentNodeId);
      currentNodeId = nextEdge?.target || '';
    } catch (error: any) {
      steps.push({
        nodeId: node.id,
        nodeType: node.type,
        input: context,
        output: { error: error.message },
        status: 'error',
        duration: Date.now() - start,
        timestamp: new Date(),
      });
      break;
    }
  }

  // 记录执行
  const status = steps.some((s) => s.status === 'error') ? 'FAILED' : 'COMPLETED';
  await prisma.workflowExecution.create({
    data: {
      workflowId,
      userId,
      input: input as any,
      output: context as any,
      steps: steps as any,
      status: status as any,
      startedAt: new Date(),
      completedAt: new Date(),
    },
  });

  await prisma.workflow.update({
    where: { id: workflowId },
    data: { runCount: { increment: 1 }, lastRunAt: new Date() },
  });

  return { output: context, steps, status };
}

// 执行单个节点
async function executeNode(
  node: WorkflowNode,
  context: Record<string, unknown>
): Promise<Record<string, unknown>> {
  switch (node.type) {
    case 'start':
      return {};

    case 'llm': {
      const { prompt, modelId, systemPrompt } = node.data as any;
      // 处理模板变量
      const processedPrompt = replaceVariables(prompt || '', context);

      const model = modelId
        ? await prisma.model.findUnique({ where: { id: modelId }, include: { provider: true } })
        : await prisma.model.findFirst({ where: { isEnabled: true }, include: { provider: true } });

      if (!model) return { error: 'No model available' };

      const keys = await prisma.apiKey.findMany({
        where: { providerId: model.providerId, status: 'ACTIVE', isEnabled: true },
        orderBy: { weight: 'desc' },
      });
      if (keys.length === 0) return { error: 'No API key' };

      const apiKey = decrypt(keys[0].keyEncrypted);
      const baseUrl = model.provider.baseUrl.replace(/\/v1\/?$/, '');

      const messages = [];
      if (systemPrompt) messages.push({ role: 'system', content: replaceVariables(systemPrompt, context) });
      messages.push({ role: 'user', content: processedPrompt });

      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
        body: JSON.stringify({ model: model.name, messages, max_tokens: 4096 }),
      });

      if (!response.ok) return { error: `LLM error ${response.status}` };
      const data = await response.json();
      const result = data.choices?.[0]?.message?.content || '';
      return { llm_output: result, tokens_used: data.usage?.total_tokens || 0 };
    }

    case 'tool': {
      const { toolName, toolInput } = node.data as any;
      const { executeTool } = await import('@/lib/agent/engine');
      const processedInput: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(toolInput || {})) {
        processedInput[k] = typeof v === 'string' ? replaceVariables(v, context) : v;
      }
      const result = await executeTool(toolName || 'calculator', processedInput);
      return { tool_output: result.output, tool_success: result.success };
    }

    case 'condition': {
      const { expression } = node.data as any;
      const processed = replaceVariables(expression || 'true', context);
      try {
        const result = Function(`"use strict"; return (${processed})`)();
        return { condition_result: !!result };
      } catch {
        return { condition_result: false };
      }
    }

    case 'end':
      return {};

    default:
      return {};
  }
}

// 替换模板变量 {{variable}}
function replaceVariables(template: string, context: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = context[key];
    return value !== undefined ? String(value) : `{{${key}}}`;
  });
}
