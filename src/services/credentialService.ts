export enum ServiceName {
  OPENAI_API_KEY = "OPENAI_API_KEY",
  ANTHROPIC_API_KEY = "ANTHROPIC_API_KEY",
  PINECONE_API_KEY = "PINECONE_API_KEY",
}

export interface Credential {
  id: number;
  service_name: ServiceName;
  created_at: string;
  updated_at: string;
}

export interface CredentialDetail extends Credential {
  api_key: string;
}

export interface CreateCredentialRequest {
  service_name: ServiceName;
  api_key: string;
}

export interface UpdateCredentialRequest {
  api_key: string;
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

  async getCredentialByService(serviceName: ServiceName): Promise<CredentialDetail> {
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

  async createCredential(
    data: CreateCredentialRequest
  ): Promise<Credential> {
    const response = await fetch(`${API_BASE_URL}/api/credentials/`, {
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

