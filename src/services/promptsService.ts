import { getAiApiBaseUrl, handleResponse } from "./lib/api";

const API_BASE_URL = getAiApiBaseUrl();

// ============================================================================
// Types
// ============================================================================

export interface Prompt {
  id: number;
  name: string;
  description?: string;
  content: string;
  account_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePromptRequest {
  name: string;
  description?: string;
  content: string;
}

export interface UpdatePromptRequest {
  name?: string;
  description?: string;
  content?: string;
}

// ============================================================================
// Service
// ============================================================================

class PromptsService {
  async listPrompts(): Promise<Prompt[]> {
    const response = await fetch(`${API_BASE_URL}/api/prompts/`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return handleResponse<Prompt[]>(response);
  }

  async getPrompt(promptId: number): Promise<Prompt> {
    const response = await fetch(
      `${API_BASE_URL}/api/prompts/${encodeURIComponent(promptId)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );
    return handleResponse<Prompt>(response);
  }

  async createPrompt(data: CreatePromptRequest): Promise<Prompt> {
    const response = await fetch(`${API_BASE_URL}/api/prompts/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return handleResponse<Prompt>(response);
  }

  async updatePrompt(promptId: number, data: UpdatePromptRequest): Promise<Prompt> {
    const response = await fetch(
      `${API_BASE_URL}/api/prompts/${encodeURIComponent(promptId)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      }
    );
    return handleResponse<Prompt>(response);
  }

  async deletePrompt(promptId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/prompts/${encodeURIComponent(promptId)}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );
    return handleResponse<void>(response);
  }
}

export const promptsService = new PromptsService();
