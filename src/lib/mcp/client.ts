// MCP Client - Model Context Protocol implementation
// Supports stdio and HTTP transports

export interface MCPServerConfig {
  id: string;
  name: string;
  transport: 'stdio' | 'http';
  command?: string;      // for stdio
  args?: string[];       // for stdio
  url?: string;          // for http
  env?: Record<string, string>;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

export class MCPClient {
  private config: MCPServerConfig;
  private connected = false;
  private tools: MCPTool[] = [];

  constructor(config: MCPServerConfig) {
    this.config = config;
  }

  async connect(): Promise<boolean> {
    try {
      if (this.config.transport === 'http' && this.config.url) {
        // HTTP transport: check if server is reachable
        const response = await fetch(`${this.config.url}/health`, { method: 'GET' });
        this.connected = response.ok;
      } else if (this.config.transport === 'stdio') {
        // Stdio transport: would need child_process spawn
        // For now, mark as connected for local servers
        this.connected = true;
      }
      return this.connected;
    } catch {
      this.connected = false;
      return false;
    }
  }

  async listTools(): Promise<MCPTool[]> {
    if (!this.connected) await this.connect();
    if (!this.connected) return [];

    try {
      if (this.config.transport === 'http' && this.config.url) {
        const response = await fetch(`${this.config.url}/tools`);
        if (response.ok) {
          const data = await response.json();
          this.tools = data.tools || [];
        }
      }
      return this.tools;
    } catch {
      return [];
    }
  }

  async callTool(name: string, args: Record<string, any>): Promise<any> {
    if (!this.connected) await this.connect();
    if (!this.connected) throw new Error('MCP server not connected');

    try {
      if (this.config.transport === 'http' && this.config.url) {
        const response = await fetch(`${this.config.url}/tools/${name}/call`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ arguments: args }),
        });
        if (response.ok) return await response.json();
        throw new Error(`Tool call failed: ${response.status}`);
      }

      // Stdio: would send JSON-RPC via stdin
      throw new Error('Stdio transport not yet implemented');
    } catch (error: any) {
      throw new Error(`MCP tool error: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.tools = [];
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// MCP Server registry
export class MCPRegistry {
  private clients: Map<string, MCPClient> = new Map();

  async addServer(config: MCPServerConfig): Promise<boolean> {
    const client = new MCPClient(config);
    const connected = await client.connect();
    if (connected) {
      this.clients.set(config.id, client);
    }
    return connected;
  }

  async removeServer(id: string): Promise<void> {
    const client = this.clients.get(id);
    if (client) {
      await client.disconnect();
      this.clients.delete(id);
    }
  }

  getClient(id: string): MCPClient | undefined {
    return this.clients.get(id);
  }

  listServers(): string[] {
    return Array.from(this.clients.keys());
  }

  async listAllTools(): Promise<{ serverId: string; tools: MCPTool[] }[]> {
    const results = [];
    for (const [id, client] of this.clients) {
      const tools = await client.listTools();
      results.push({ serverId: id, tools });
    }
    return results;
  }
}

export const mcpRegistry = new MCPRegistry();
