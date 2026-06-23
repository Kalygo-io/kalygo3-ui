import { apiGet, apiPost, apiPut, apiDelete } from "./lib/api";

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
    return apiGet<Prompt[]>(`/api/prompts/`);
  }

  async getPrompt(promptId: number): Promise<Prompt> {
    return apiGet<Prompt>(`/api/prompts/${encodeURIComponent(promptId)}`);
  }

  async createPrompt(data: CreatePromptRequest): Promise<Prompt> {
    return apiPost<Prompt>(`/api/prompts/`, data);
  }

  async updatePrompt(promptId: number, data: UpdatePromptRequest): Promise<Prompt> {
    return apiPut<Prompt>(`/api/prompts/${encodeURIComponent(promptId)}`, data);
  }

  async deletePrompt(promptId: number): Promise<void> {
    return apiDelete<void>(`/api/prompts/${encodeURIComponent(promptId)}`);
  }
}

export const promptsService = new PromptsService();
