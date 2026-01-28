// ============================================================================
// V1 Schema Types (Legacy - Backwards Compatibility)
// ============================================================================

export interface KnowledgeBaseV1 {
  id?: string;
  provider: string;
  index?: string;
  namespace?: string;
  description?: string;
  [key: string]: any; // Allow for provider-specific properties
}

export interface AgentConfigDataV1 {
  systemPrompt?: string;
  knowledgeBases?: KnowledgeBaseV1[];
}

export interface AgentConfigV1 {
  schema: "agent_config";
  version: 1;
  data: AgentConfigDataV1;
}

// ============================================================================
// V2 Schema Types (New)
// ============================================================================

export interface VectorSearchTool {
  type: "vectorSearch";
  provider: "pinecone";
  index: string;
  namespace: string;
  description?: string;
  topK?: number;
}

export interface VectorSearchWithRerankingTool {
  type: "vectorSearchWithReranking";
  provider: "pinecone";
  index: string;
  namespace: string;
  description?: string;
  topK?: number;
  topN?: number;
}

export interface DbTableReadTool {
  type: "dbTableRead";
  credentialId: number; // ID of stored credential with db_connection type
  table: string;
  name?: string; // Custom tool name (e.g., 'query_users'), defaults to 'query_{table}'
  description?: string;
  columns?: string[]; // Columns to expose to the agent
  maxLimit?: number; // Max rows per query (1-1000, default 100)
}

export interface DbTableWriteTool {
  type: "dbTableWrite";
  credentialId: number; // ID of stored credential with db_connection type
  table: string;
  name?: string; // Custom tool name (e.g., 'create_lead'), defaults to 'insert_{table}'
  description?: string;
  columns: string[]; // Columns that can be written (required)
  requiredColumns?: string[]; // Columns that must be provided when inserting
  injectAccountId?: boolean; // Auto-inject user's account_id into the record
}

export type ToolV2 = VectorSearchTool | VectorSearchWithRerankingTool | DbTableReadTool | DbTableWriteTool;

export interface AgentConfigDataV2 {
  systemPrompt: string;
  tools?: ToolV2[];
}

export interface AgentConfigV2 {
  schema: "agent_config";
  version: 2;
  data: AgentConfigDataV2;
}

// ============================================================================
// Union Types
// ============================================================================

export type AgentConfig = AgentConfigV1 | AgentConfigV2;
export type AgentConfigData = AgentConfigDataV1 | AgentConfigDataV2;
export type KnowledgeBase = KnowledgeBaseV1; // Keep for backwards compatibility

export interface Agent {
  id: string;
  name: string;
  systemPrompt?: string;
  description?: string; // Keep for backwards compatibility
  created_at?: string;
  updated_at?: string;
  status?: string;
  owner_id?: number;
  config?: AgentConfig; // Agent configuration (V1 or V2)
  [key: string]: any; // Allow for additional properties
}

export interface CreateAgentRequest {
  name: string;
  config: AgentConfig;
}

export interface UpdateAgentRequest {
  name?: string;
  config?: AgentConfig;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Type guard to check if agent config is V2
 */
export function isAgentConfigV2(config: AgentConfig | undefined): config is AgentConfigV2 {
  return config?.version === 2;
}

/**
 * Type guard to check if agent config is V1
 */
export function isAgentConfigV1(config: AgentConfig | undefined): config is AgentConfigV1 {
  return config?.version === 1 || !config?.version; // Treat missing version as V1
}

/**
 * Get the agent schema version
 */
export function getAgentVersion(agent: Agent): 1 | 2 {
  return agent.config?.version === 2 ? 2 : 1;
}

/**
 * Convert V1 knowledge bases to V2 tools (defaults to basic vectorSearch)
 */
export function convertKnowledgeBasesToTools(knowledgeBases: KnowledgeBaseV1[]): VectorSearchTool[] {
  return knowledgeBases
    .filter((kb) => kb.provider === "pinecone" && kb.index && kb.namespace)
    .map((kb) => ({
      type: "vectorSearch" as const,
      provider: "pinecone" as const,
      index: kb.index!,
      namespace: kb.namespace!,
      description: kb.description,
      topK: 10, // Default value
    }));
}

/**
 * Convert V2 tools to V1 knowledge bases (for backwards compatibility)
 * Note: This converts both vectorSearch and vectorSearchWithReranking to simple knowledge bases
 */
export function convertToolsToKnowledgeBases(tools: ToolV2[]): KnowledgeBaseV1[] {
  return tools
    .filter((tool) => tool.type === "vectorSearch" || tool.type === "vectorSearchWithReranking")
    .map((tool) => ({
      provider: tool.provider,
      index: tool.index,
      namespace: tool.namespace,
      description: tool.description,
    }));
}

// Helper function to ensure HTTPS in production
function getApiBaseUrl(): string {
  console.log("getApiBaseUrl", process.env.NEXT_PUBLIC_AI_API_URL);
  const apiUrl = process.env.NEXT_PUBLIC_AI_API_URL || "http://127.0.0.1:4000";
  
  // If we're in the browser and the page is HTTPS, ensure API URL is also HTTPS
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    // Replace http:// with https:// for production domains
    if (apiUrl.startsWith("http://")) {
      return apiUrl.replace("http://", "https://");
    }
  }
  
  return apiUrl;
}

const API_BASE_URL = getApiBaseUrl();

class AgentsService {
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Request failed: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  async listAgents(): Promise<Agent[]> {
    const response = await fetch(`${API_BASE_URL}/api/agents`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    return this.handleResponse<Agent[]>(response);
  }

  async getAgent(agentId: string): Promise<Agent> {
    const response = await fetch(
      `${API_BASE_URL}/api/agents/${encodeURIComponent(agentId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    return this.handleResponse<Agent>(response);
  }

  async createAgent(data: CreateAgentRequest): Promise<Agent> {
    const response = await fetch(`${API_BASE_URL}/api/agents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    return this.handleResponse<Agent>(response);
  }

  async updateAgent(agentId: string, data: UpdateAgentRequest): Promise<Agent> {
    const response = await fetch(
      `${API_BASE_URL}/api/agents/${encodeURIComponent(agentId)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      }
    );

    return this.handleResponse<Agent>(response);
  }

  async deleteAgent(agentId: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/agents/${encodeURIComponent(agentId)}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    return this.handleResponse<void>(response);
  }
}

export const agentsService = new AgentsService();
