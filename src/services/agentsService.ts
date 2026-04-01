// ============================================================================
// Tool Types
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
  credentialId: number;
  table: string;
  description?: string;
  columns?: string[];
  maxLimit?: number;
}

export interface DbTableWriteTool {
  type: "dbTableWrite";
  credentialId: number;
  table: string;
  description?: string;
  columns: string[];
  requiredColumns?: string[];
  injectAccountId?: boolean;
  injectChatSessionId?: boolean;
}

export interface SendTxtEmailTool {
  type: "sendTxtEmail";
  credentialId: number;
  description?: string;
}

export interface SendTxtEmailWithGoogleTool {
  type: "sendTxtEmailWithGoogle";
  credentialId: number;
  description?: string;
}

export type AgentTool =
  | VectorSearchTool
  | VectorSearchWithRerankingTool
  | DbTableReadTool
  | DbTableWriteTool
  | SendTxtEmailTool
  | SendTxtEmailWithGoogleTool;

// ============================================================================
// Agent Config (V4)
// ============================================================================

export type ModelProvider = "openai" | "anthropic" | "google" | "ollama";

export interface ModelConfig {
  provider: ModelProvider;
  model: string;
}

export interface AgentConfigData {
  systemPrompt: string;
  model?: ModelConfig;
  /** Optional ElevenLabs voice ID for TTS. */
  elevenlabsVoiceId?: string;
  tools?: AgentTool[];
}

export interface AgentConfig {
  schema: "agent_config";
  version: 4;
  data: AgentConfigData;
}

// ============================================================================
// Tool Type Metadata — single source of truth for display across the UI
// ============================================================================

export type ToolTypeMeta = {
  /** Human-readable label shown in the UI */
  label: string;
  /** Full Tailwind border class — must be a complete string for JIT purging */
  borderClass: string;
  /** Full Tailwind icon/text color class */
  iconClass: string;
  /** One-line summary of the tool's runtime config */
  summary: (tool: AgentTool) => string;
};

export const TOOL_TYPE_METADATA: Record<AgentTool["type"], ToolTypeMeta> = {
  vectorSearch: {
    label: "Vector Search",
    borderClass: "border-purple-700/30",
    iconClass: "text-purple-400",
    summary: (t) => {
      const v = t as VectorSearchTool;
      return `${v.provider} · ${v.index} / ${v.namespace} (top ${v.topK ?? 10})`;
    },
  },
  vectorSearchWithReranking: {
    label: "Vector Search + Rerank",
    borderClass: "border-purple-700/30",
    iconClass: "text-purple-400",
    summary: (t) => {
      const v = t as VectorSearchWithRerankingTool;
      return `${v.provider} · ${v.index} / ${v.namespace} (K=${v.topK ?? 20}, N=${v.topN ?? 5})`;
    },
  },
  dbTableRead: {
    label: "DB Read",
    borderClass: "border-green-700/30",
    iconClass: "text-green-400",
    summary: (t) => (t as DbTableReadTool).table,
  },
  dbTableWrite: {
    label: "DB Write",
    borderClass: "border-orange-700/30",
    iconClass: "text-orange-400",
    summary: (t) => (t as DbTableWriteTool).table,
  },
  sendTxtEmail: {
    label: "Send Email (SES)",
    borderClass: "border-pink-700/30",
    iconClass: "text-pink-400",
    summary: () => "AWS SES · requires human approval",
  },
  sendTxtEmailWithGoogle: {
    label: "Send Email (Google)",
    borderClass: "border-blue-700/30",
    iconClass: "text-blue-400",
    summary: () => "Google Gmail · requires human approval",
  },
};

// ============================================================================
// Available Models
// ============================================================================

export const AVAILABLE_MODELS: Record<
  ModelProvider,
  { value: string; label: string }[]
> = {
  openai: [
    { value: "gpt-5.4", label: "GPT-5.4" },
    { value: "gpt-5.2", label: "GPT-5.2" },
    { value: "gpt-5.1", label: "GPT-5.1" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini (Fast, Cost-effective)" },
    { value: "gpt-4o", label: "GPT-4o (Most Capable)" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo (Legacy)" },
  ],
  anthropic: [
    { value: "claude-opus-4-6", label: "Claude Opus 4.6" },
    { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
    { value: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
    { value: "claude-sonnet-4-5", label: "Claude Sonnet 4.5" },
    { value: "claude-opus-4-5", label: "Claude Opus 4.5" },
    { value: "claude-opus-4-1", label: "Claude Opus 4.1" },
  ],
  google: [
    { value: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro Preview" },
    { value: "gemini-3-flash-preview", label: "Gemini 3 Flash Preview" },
  ],
  ollama: [
    { value: "llama3.2", label: "Llama 3.2" },
    { value: "llama3.1", label: "Llama 3.1" },
    { value: "mistral", label: "Mistral" },
    { value: "codellama", label: "Code Llama" },
  ],
};

export const DEFAULT_MODEL: ModelConfig = {
  provider: "openai",
  model: "gpt-4o-mini",
};

// ============================================================================
// Agent
// ============================================================================

export interface Agent {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
  status?: string;
  owner_id?: number;
  is_owner?: boolean;
  config?: AgentConfig;
  [key: string]: any;
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
// Helpers
// ============================================================================

export function getAgentModelConfig(agent: Agent): ModelConfig {
  return agent.config?.data?.model ?? DEFAULT_MODEL;
}

export function getAgentElevenLabsVoiceId(agent: Agent): string | undefined {
  return agent.config?.data?.elevenlabsVoiceId;
}

// ============================================================================
// Service
// ============================================================================

function getApiBaseUrl(): string {
  console.log("getApiBaseUrl", process.env.NEXT_PUBLIC_AI_API_URL);
  const apiUrl = process.env.NEXT_PUBLIC_AI_API_URL || "http://127.0.0.1:4000";
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
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
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return this.handleResponse<Agent[]>(response);
  }

  async getAgent(agentId: string): Promise<Agent> {
    const response = await fetch(
      `${API_BASE_URL}/api/agents/${encodeURIComponent(agentId)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );
    return this.handleResponse<Agent>(response);
  }

  async createAgent(data: CreateAgentRequest): Promise<Agent> {
    const response = await fetch(`${API_BASE_URL}/api/agents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      },
    );
    return this.handleResponse<Agent>(response);
  }

  async deleteAgent(agentId: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/agents/${encodeURIComponent(agentId)}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );
    return this.handleResponse<void>(response);
  }
}

export const agentsService = new AgentsService();
