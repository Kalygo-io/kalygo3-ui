// Enum identifying which service/provider a credential belongs to
export enum ServiceName {
  OPENAI_API_KEY = "OPENAI_API_KEY",
  ANTHROPIC_API_KEY = "ANTHROPIC_API_KEY",
  GOOGLE_GEMINI_API_KEY = "GOOGLE_GEMINI_API_KEY",
  PINECONE_API_KEY = "PINECONE_API_KEY",
  ELEVENLABS_API_KEY = "ELEVENLABS_API_KEY",
  SUPABASE = "SUPABASE",
  AWS_SES = "AWS_SES",
  GOOGLE_OAUTH = "GOOGLE_OAUTH",
  GOOGLE_GMAIL_SMTP = "GOOGLE_GMAIL_SMTP",
}

// Auth mechanism / format of the stored secret
export enum AuthType {
  API_KEY = "api_key",
  AWS_ACCESS_KEY_PAIR = "aws_access_key_pair",
  DB_CONNECTION = "db_connection",
  CONNECTION_STRING = "connection_string",
  OAUTH_TOKEN = "oauth_token",
  SECRET_KEY = "secret_key",
  CERTIFICATE = "certificate",
  OTHER = "other",
}

// Keep CredentialType as an alias so existing imports don't break
export const CredentialType = AuthType;
export type CredentialType = AuthType;

// Metadata stored alongside a credential
export interface CredentialMetadata {
  environment?: "production" | "staging" | "development";
  expires_at?: string;
  notes?: string;
  [key: string]: unknown;
}

// Flexible credential data payload
export interface CredentialData {
  api_key?: string;
  key_id?: string;
  secret_key?: string;
  connection_string?: string;
  token?: string;
  certificate?: string;
  [key: string]: unknown;
}

// Basic credential info (returned in list view)
export interface Credential {
  id: number;
  /** Which service/provider this credential is for (e.g. AWS_SES, OPENAI_API_KEY) */
  credential_type: ServiceName | string;
  /** Auth mechanism (e.g. api_key, aws_access_key_pair) */
  auth_type: AuthType | string;
  /** Human-readable name to distinguish multiple credentials of the same type */
  credential_name?: string | null;
  created_at: string;
  updated_at: string;
  credential_metadata?: CredentialMetadata | null;
}

// Full credential detail (includes decrypted data)
export interface CredentialDetail extends Credential {
  credential_data?: CredentialData;
  // Legacy fields for backward compatibility
  api_key?: string;
  decrypted_data?: string;
}

// Request to create a new credential
export interface CreateCredentialRequest {
  credential_type: ServiceName | string;
  auth_type: AuthType | string;
  credential_name?: string;
  credential_data: CredentialData;
  metadata?: CredentialMetadata;
}

// Request to update an existing credential
export interface UpdateCredentialRequest {
  credential_name?: string;
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
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return this.handleResponse<Credential[]>(response);
  }

  async getCredential(credentialId: number): Promise<CredentialDetail> {
    const response = await fetch(
      `${API_BASE_URL}/api/credentials/${credentialId}/full`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );
    return this.handleResponse<CredentialDetail>(response);
  }

  async getCredentialByService(
    serviceName: ServiceName | string,
  ): Promise<CredentialDetail> {
    const response = await fetch(
      `${API_BASE_URL}/api/credentials/service/${serviceName}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );
    return this.handleResponse<CredentialDetail>(response);
  }

  async createCredential(data: CreateCredentialRequest): Promise<Credential> {
    const response = await fetch(`${API_BASE_URL}/api/credentials/flexible`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return this.handleResponse<Credential>(response);
  }

  async updateCredential(
    credentialId: number,
    data: UpdateCredentialRequest,
  ): Promise<Credential> {
    const response = await fetch(
      `${API_BASE_URL}/api/credentials/${credentialId}/full`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      },
    );
    return this.handleResponse<Credential>(response);
  }

  async deleteCredential(credentialId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/credentials/${credentialId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
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
    [ServiceName.GOOGLE_GEMINI_API_KEY]: "Google Gemini",
    [ServiceName.PINECONE_API_KEY]: "Pinecone",
    [ServiceName.ELEVENLABS_API_KEY]: "ElevenLabs",
    [ServiceName.SUPABASE]: "Supabase",
    [ServiceName.AWS_SES]: "AWS SES",
    [ServiceName.GOOGLE_OAUTH]: "Google OAuth",
    [ServiceName.GOOGLE_GMAIL_SMTP]: "Google Gmail (SMTP)",
  };
  return displayNames[serviceName] || String(serviceName);
}

export function formatCredentialType(authType: AuthType | string): string {
  const displayNames: Record<string, string> = {
    [AuthType.API_KEY]: "API Key",
    [AuthType.AWS_ACCESS_KEY_PAIR]: "AWS Access Key Pair",
    [AuthType.DB_CONNECTION]: "Database Connection",
    [AuthType.CONNECTION_STRING]: "Connection String",
    [AuthType.OAUTH_TOKEN]: "OAuth Token",
    [AuthType.SECRET_KEY]: "Secret Key",
    [AuthType.CERTIFICATE]: "Certificate",
    [AuthType.OTHER]: "Other",
  };
  return displayNames[authType] || String(authType);
}

export function getCredentialTypeColor(authType: AuthType | string): string {
  const colors: Record<string, string> = {
    [AuthType.API_KEY]: "bg-blue-600/20 text-blue-300 border-blue-500/40",
    [AuthType.AWS_ACCESS_KEY_PAIR]: "bg-orange-600/20 text-orange-300 border-orange-500/40",
    [AuthType.DB_CONNECTION]: "bg-teal-600/20 text-teal-300 border-teal-500/40",
    [AuthType.CONNECTION_STRING]: "bg-green-600/20 text-green-300 border-green-500/40",
    [AuthType.OAUTH_TOKEN]: "bg-purple-600/20 text-purple-300 border-purple-500/40",
    [AuthType.SECRET_KEY]: "bg-yellow-600/20 text-yellow-300 border-yellow-500/40",
    [AuthType.CERTIFICATE]: "bg-pink-600/20 text-pink-300 border-pink-500/40",
    [AuthType.OTHER]: "bg-gray-600/20 text-gray-300 border-gray-500/40",
  };
  return colors[authType] || colors[AuthType.OTHER];
}

export function getCredentialDataKey(authType: AuthType | string): string {
  switch (authType) {
    case AuthType.API_KEY:
      return "api_key";
    case AuthType.AWS_ACCESS_KEY_PAIR:
      return "key_id";
    case AuthType.DB_CONNECTION:
    case AuthType.CONNECTION_STRING:
      return "connection_string";
    case AuthType.OAUTH_TOKEN:
      return "token";
    case AuthType.SECRET_KEY:
      return "secret_key";
    case AuthType.CERTIFICATE:
      return "certificate";
    default:
      return "value";
  }
}

export function getCredentialValue(credential: CredentialDetail): string {
  if (credential.credential_data) {
    const key = getCredentialDataKey(credential.auth_type);
    return (credential.credential_data[key] as string) || "";
  }
  return credential.api_key || credential.decrypted_data || "";
}
