// Helper function to ensure HTTPS in production
function getApiBaseUrl(): string {
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
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Request failed: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorJson.message || errorMessage;
      } catch {
        // Keep the default error message
      }
      throw new Error(errorMessage);
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  async listPrompts(): Promise<Prompt[]> {
    const response = await fetch(`${API_BASE_URL}/api/prompts/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    return this.handleResponse<Prompt[]>(response);
  }

  async getPrompt(promptId: number): Promise<Prompt> {
    const response = await fetch(
      `${API_BASE_URL}/api/prompts/${encodeURIComponent(promptId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    return this.handleResponse<Prompt>(response);
  }

  async createPrompt(data: CreatePromptRequest): Promise<Prompt> {
    const response = await fetch(`${API_BASE_URL}/api/prompts/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    return this.handleResponse<Prompt>(response);
  }

  async updatePrompt(promptId: number, data: UpdatePromptRequest): Promise<Prompt> {
    const response = await fetch(
      `${API_BASE_URL}/api/prompts/${encodeURIComponent(promptId)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      }
    );

    return this.handleResponse<Prompt>(response);
  }

  async deletePrompt(promptId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/prompts/${encodeURIComponent(promptId)}`,
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

export const promptsService = new PromptsService();
