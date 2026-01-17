const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:4000";

export enum ApiKeyStatus {
  ACTIVE = "active",
  REVOKED = "revoked",
}

export interface ApiKey {
  id: number;
  name: string;
  key?: string; // The actual API key value (only shown once when created)
  status: ApiKeyStatus;
  created_at?: string;
  last_used_at?: string;
}

export interface CreateApiKeyRequest {
  name: string;
}

class ApiKeysService {
  private handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      return response.json().then((data) => {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      });
    }
    return response.json();
  }

  async listApiKeys(): Promise<ApiKey[]> {
    const response = await fetch(`${API_BASE_URL}/api/api-keys`, {
      method: "GET",
      headers: {
        Accept: "*/*",
      },
      credentials: "include",
    });

    return this.handleResponse<ApiKey[]>(response);
  }

  async createApiKey(data: CreateApiKeyRequest): Promise<ApiKey> {
    const response = await fetch(`${API_BASE_URL}/api/api-keys`, {
      method: "POST",
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    return this.handleResponse<ApiKey>(response);
  }

  async deleteApiKey(apiKeyId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/api-keys/${encodeURIComponent(apiKeyId)}`,
      {
        method: "DELETE",
        headers: {
          Accept: "*/*",
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      return response.json().then((data) => {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      });
    }
  }
}

export const apiKeysService = new ApiKeysService();
