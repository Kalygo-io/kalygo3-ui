import { apiGet, apiPost, apiDelete } from "./lib/api";

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
    return apiGet<ApiKey[]>(`/api/api-keys`, { headers: { Accept: "*/*" } });
  }

  async createApiKey(data: CreateApiKeyRequest): Promise<ApiKey> {
    return apiPost<ApiKey>(`/api/api-keys`, data, { headers: { Accept: "*/*" } });
  }

  async deleteApiKey(apiKeyId: number): Promise<void> {
    return apiDelete<void>(`/api/api-keys/${encodeURIComponent(apiKeyId)}`, undefined, {
      headers: { Accept: "*/*" },
    });
  }
}

export const apiKeysService = new ApiKeysService();
