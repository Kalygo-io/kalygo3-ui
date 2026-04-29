import { getAiApiBaseUrl, handleResponse } from "./lib/api";

const API_BASE_URL = getAiApiBaseUrl();

export enum ApiKeyStatus {
  ACTIVE = "active",
  REVOKED = "revoked",
}

export interface ApiKey {
  id: number;
  name: string;
  key?: string;
  status: ApiKeyStatus;
  created_at?: string;
  last_used_at?: string;
}

export interface CreateApiKeyRequest {
  name: string;
}

class ApiKeysService {
  async listApiKeys(): Promise<ApiKey[]> {
    const response = await fetch(`${API_BASE_URL}/api/api-keys`, {
      method: "GET",
      headers: { Accept: "*/*" },
      credentials: "include",
    });
    return handleResponse<ApiKey[]>(response);
  }

  async createApiKey(data: CreateApiKeyRequest): Promise<ApiKey> {
    const response = await fetch(`${API_BASE_URL}/api/api-keys`, {
      method: "POST",
      headers: { Accept: "*/*", "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return handleResponse<ApiKey>(response);
  }

  async deleteApiKey(apiKeyId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/api-keys/${encodeURIComponent(apiKeyId)}`,
      {
        method: "DELETE",
        headers: { Accept: "*/*" },
        credentials: "include",
      }
    );
    return handleResponse<void>(response);
  }
}

export const apiKeysService = new ApiKeysService();
