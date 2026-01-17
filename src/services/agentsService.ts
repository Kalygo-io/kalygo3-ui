export interface Agent {
  id: string;
  name: string;
  systemPrompt?: string;
  description?: string; // Keep for backwards compatibility
  created_at?: string;
  updated_at?: string;
  status?: string;
  owner_id?: number;
  [key: string]: any; // Allow for additional properties
}

export interface KnowledgeBase {
  id?: string;
  provider: string;
  index?: string;
  namespace?: string;
  description?: string;
  [key: string]: any; // Allow for provider-specific properties
}

export interface AgentConfigData {
  systemPrompt?: string;
  knowledgeBases?: KnowledgeBase[];
}

export interface AgentConfig {
  schema: string;
  version: number;
  data: AgentConfigData;
}

export interface CreateAgentRequest {
  name: string;
  config: AgentConfig;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_AI_API_URL;

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
