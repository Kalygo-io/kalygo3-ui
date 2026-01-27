// Service names that can have credentials
export enum ServiceName {
  OPENAI_API_KEY = "OPENAI_API_KEY",
  ANTHROPIC_API_KEY = "ANTHROPIC_API_KEY",
  PINECONE_API_KEY = "PINECONE_API_KEY",
  SUPABASE = "SUPABASE",
}

// Credential types supported by the system
export enum CredentialType {
  API_KEY = "api_key",
  DB_CONNECTION = "db_connection",
  CONNECTION_STRING = "connection_string",
  OAUTH_TOKEN = "oauth_token",
  SECRET_KEY = "secret_key",
  CERTIFICATE = "certificate",
  OTHER = "other",
}

// Metadata that can be stored with a credential
export interface CredentialMetadata {
  label?: string; // User-friendly label
  environment?: "production" | "staging" | "development";
  expires_at?: string; // ISO date string for expiration
  notes?: string;
  [key: string]: unknown; // Allow additional custom fields
}

// Credential data - flexible object containing the actual secret(s)
export interface CredentialData {
  api_key?: string;
  connection_string?: string;
  secret_key?: string;
  token?: string;
  certificate?: string;
  [key: string]: unknown; // Allow additional custom fields
}

// Basic credential info (returned in list view)
export interface Credential {
  id: number;
  service_name: ServiceName | string;
  credential_type: CredentialType | string;
  created_at: string;
  updated_at: string;
  credential_metadata?: CredentialMetadata | null;
}

// Full credential detail (includes decrypted data)
export interface CredentialDetail extends Credential {
  credential_data?: CredentialData; // Decrypted credential data
  // Legacy fields for backward compatibility
  api_key?: string;
  decrypted_data?: string;
}

// Request to create a new credential (flexible endpoint)
export interface CreateCredentialRequest {
  service_name: ServiceName | string;
  credential_type: CredentialType | string;
  credential_data: CredentialData;
  metadata?: CredentialMetadata;
}

// Request to update an existing credential
export interface UpdateCredentialRequest {
  credential_data?: CredentialData;
  metadata?: CredentialMetadata;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_AI_API_URL;

class CredentialService {
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Request failed: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorMessage;
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

  async listCredentials(): Promise<Credential[]> {
    const response = await fetch(`${API_BASE_URL}/api/credentials/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    return this.handleResponse<Credential[]>(response);
  }

  async getCredential(credentialId: number): Promise<CredentialDetail> {
    const response = await fetch(
      `${API_BASE_URL}/api/credentials/${credentialId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    return this.handleResponse<CredentialDetail>(response);
  }

  async getCredentialByService(serviceName: ServiceName | string): Promise<CredentialDetail> {
    const response = await fetch(
      `${API_BASE_URL}/api/credentials/service/${serviceName}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    return this.handleResponse<CredentialDetail>(response);
  }

  async createCredential(data: CreateCredentialRequest): Promise<Credential> {
    const response = await fetch(`${API_BASE_URL}/api/credentials/flexible`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    return this.handleResponse<Credential>(response);
  }

  async updateCredential(
    credentialId: number,
    data: UpdateCredentialRequest
  ): Promise<Credential> {
    const response = await fetch(
      `${API_BASE_URL}/api/credentials/${credentialId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      }
    );

    return this.handleResponse<Credential>(response);
  }

  async deleteCredential(credentialId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/credentials/${credentialId}`,
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

export const credentialService = new CredentialService();

// Helper functions for display
export function formatServiceName(serviceName: ServiceName | string): string {
  const displayNames: Record<string, string> = {
    [ServiceName.OPENAI_API_KEY]: "OpenAI",
    [ServiceName.ANTHROPIC_API_KEY]: "Anthropic",
    [ServiceName.PINECONE_API_KEY]: "Pinecone",
    [ServiceName.SUPABASE]: "Supabase",
  };
  return displayNames[serviceName] || serviceName;
}

export function formatCredentialType(credentialType: CredentialType | string): string {
  const displayNames: Record<string, string> = {
    [CredentialType.API_KEY]: "API Key",
    [CredentialType.DB_CONNECTION]: "Database Connection",
    [CredentialType.CONNECTION_STRING]: "Connection String",
    [CredentialType.OAUTH_TOKEN]: "OAuth Token",
    [CredentialType.SECRET_KEY]: "Secret Key",
    [CredentialType.CERTIFICATE]: "Certificate",
    [CredentialType.OTHER]: "Other",
  };
  return displayNames[credentialType] || credentialType;
}

export function getCredentialTypeColor(credentialType: CredentialType | string): string {
  const colors: Record<string, string> = {
    [CredentialType.API_KEY]: "bg-blue-600/20 text-blue-300 border-blue-500/40",
    [CredentialType.DB_CONNECTION]: "bg-teal-600/20 text-teal-300 border-teal-500/40",
    [CredentialType.CONNECTION_STRING]: "bg-green-600/20 text-green-300 border-green-500/40",
    [CredentialType.OAUTH_TOKEN]: "bg-purple-600/20 text-purple-300 border-purple-500/40",
    [CredentialType.SECRET_KEY]: "bg-yellow-600/20 text-yellow-300 border-yellow-500/40",
    [CredentialType.CERTIFICATE]: "bg-pink-600/20 text-pink-300 border-pink-500/40",
    [CredentialType.OTHER]: "bg-gray-600/20 text-gray-300 border-gray-500/40",
  };
  return colors[credentialType] || colors[CredentialType.OTHER];
}

// Helper to get the primary key from credential data based on type
export function getCredentialDataKey(credentialType: CredentialType | string): string {
  switch (credentialType) {
    case CredentialType.API_KEY:
      return "api_key";
    case CredentialType.DB_CONNECTION:
    case CredentialType.CONNECTION_STRING:
      return "connection_string";
    case CredentialType.OAUTH_TOKEN:
      return "token";
    case CredentialType.SECRET_KEY:
      return "secret_key";
    case CredentialType.CERTIFICATE:
      return "certificate";
    default:
      return "value";
  }
}

// Helper to extract the primary value from credential data
export function getCredentialValue(credential: CredentialDetail): string {
  if (credential.credential_data) {
    const key = getCredentialDataKey(credential.credential_type);
    return (credential.credential_data[key] as string) || "";
  }
  // Fallback to legacy fields
  return credential.api_key || credential.decrypted_data || "";
}
