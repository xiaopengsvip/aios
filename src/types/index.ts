// ─── User & Auth ──────────────────────────────────────────────

export type Role = 'USER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  role: Role;
  provider: string;
  providerId?: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Providers & Models ──────────────────────────────────────

export interface Provider {
  id: string;
  name: string;
  slug: string;
  baseUrl: string;
  apiKey?: string | null;
  enabled: boolean;
  config?: Record<string, any> | null;
  models: Model[];
  createdAt: string;
  updatedAt: string;
}

export type ModelType = 'chat' | 'completion' | 'embedding' | 'image' | 'audio' | 'video';

export interface Model {
  id: string;
  providerId: string;
  name: string;
  slug: string;
  displayName: string;
  description?: string | null;
  type: ModelType;
  contextWindow: number;
  maxOutput?: number | null;
  inputPrice?: number | null;
  outputPrice?: number | null;
  enabled: boolean;
  config?: Record<string, any> | null;
  provider?: Provider;
  createdAt: string;
  updatedAt: string;
}

// ─── Chat ─────────────────────────────────────────────────────

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  modelId?: string | null;
  agentId?: string | null;
  pinned: boolean;
  archived: boolean;
  metadata?: Record<string, any> | null;
  messages?: Message[];
  model?: Model | null;
  agent?: Agent | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  modelId?: string | null;
  tokenCount?: number | null;
  cost?: number | null;
  metadata?: Record<string, any> | null;
  parentId?: string | null;
  model?: Model | null;
  parent?: Message | null;
  children?: Message[];
  createdAt: string;
}

// ─── Agents & Workflows ──────────────────────────────────────

export interface Agent {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description?: string | null;
  systemPrompt: string;
  modelId?: string | null;
  tools?: string[];
  config?: Record<string, any> | null;
  public: boolean;
  model?: Model | null;
  createdAt: string;
  updatedAt: string;
}

export interface Workflow {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  steps: WorkflowStep[];
  config?: Record<string, any> | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStep {
  id: string;
  type: string;
  config: Record<string, any>;
  next?: string | null;
}

// ─── Files & Storage ─────────────────────────────────────────

export interface FileRecord {
  id: string;
  userId: string;
  name: string;
  path: string;
  mimeType: string;
  size: number;
  url: string;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

// ─── Billing & Usage ─────────────────────────────────────────

export type TransactionType = 'credit' | 'debit';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  description: string;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

export interface UsageLog {
  id: string;
  userId: string;
  modelId: string;
  conversationId?: string | null;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  latencyMs: number;
  metadata?: Record<string, any> | null;
  model?: Model;
  createdAt: string;
}

// ─── Audit ────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  details?: Record<string, any> | null;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

// ─── API Keys ────────────────────────────────────────────────

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  key: string;
  prefix: string;
  lastUsedAt?: string | null;
  expiresAt?: string | null;
  enabled: boolean;
  permissions?: string[];
  createdAt: string;
}

// ─── Pagination ──────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ─── Chat API Types ──────────────────────────────────────────

export interface ChatRequest {
  conversationId?: string;
  message: string;
  modelId?: string;
  agentId?: string;
  stream?: boolean;
}

export interface ChatResponse {
  conversationId: string;
  message: Message;
}
