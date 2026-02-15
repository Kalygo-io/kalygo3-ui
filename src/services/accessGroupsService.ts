// ============================================================================
// Access Groups Service
// ============================================================================
// Manages access groups for sharing agents with other accounts.
// Access rule: account can view/use an agent if they own it OR are a member
// of a group that has been granted access to it.
// ============================================================================

// Helper function to ensure HTTPS in production
function getApiBaseUrl(): string {
  const apiUrl =
    process.env.NEXT_PUBLIC_AI_API_URL || "http://127.0.0.1:4000";

  if (typeof window !== "undefined" && window.location.protocol === "https:") {
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

export interface AccessGroup {
  id: number;
  name: string;
  owner_account_id: number;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export interface AccessGroupMember {
  id: number;
  access_group_id: number;
  account_id: number;
  email?: string;
  created_at: string;
}

export interface AgentAccessGrant {
  id: number;
  agent_id: number;
  access_group_id: number;
  access_group_name?: string;
  created_at: string;
}

export interface CreateAccessGroupRequest {
  name: string;
}

export interface UpdateAccessGroupRequest {
  name: string;
}

export interface AddMemberRequest {
  email: string;
}

export interface CreateAgentAccessGrantRequest {
  accessGroupId: number;
}

// ============================================================================
// Service
// ============================================================================

class AccessGroupsService {
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

  // ------------------------------------------------------------------
  // Access Groups CRUD
  // ------------------------------------------------------------------

  async listGroups(): Promise<AccessGroup[]> {
    const response = await fetch(`${API_BASE_URL}/api/access-groups`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    return this.handleResponse<AccessGroup[]>(response);
  }

  async getGroup(groupId: number): Promise<AccessGroup> {
    const response = await fetch(
      `${API_BASE_URL}/api/access-groups/${groupId}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );

    return this.handleResponse<AccessGroup>(response);
  }

  async createGroup(data: CreateAccessGroupRequest): Promise<AccessGroup> {
    const response = await fetch(`${API_BASE_URL}/api/access-groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    return this.handleResponse<AccessGroup>(response);
  }

  async updateGroup(
    groupId: number,
    data: UpdateAccessGroupRequest,
  ): Promise<AccessGroup> {
    const response = await fetch(
      `${API_BASE_URL}/api/access-groups/${groupId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      },
    );

    return this.handleResponse<AccessGroup>(response);
  }

  async deleteGroup(groupId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/access-groups/${groupId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );

    return this.handleResponse<void>(response);
  }

  // ------------------------------------------------------------------
  // Group Members
  // ------------------------------------------------------------------

  async listMembers(groupId: number): Promise<AccessGroupMember[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/access-groups/${groupId}/members`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );

    return this.handleResponse<AccessGroupMember[]>(response);
  }

  async addMember(
    groupId: number,
    data: AddMemberRequest,
  ): Promise<AccessGroupMember> {
    const response = await fetch(
      `${API_BASE_URL}/api/access-groups/${groupId}/members`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      },
    );

    return this.handleResponse<AccessGroupMember>(response);
  }

  async removeMember(groupId: number, accountId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/access-groups/${groupId}/members/${accountId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );

    return this.handleResponse<void>(response);
  }

  // ------------------------------------------------------------------
  // Agent Access Grants
  // ------------------------------------------------------------------

  async listAgentGrants(agentId: string): Promise<AgentAccessGrant[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/agents/${encodeURIComponent(agentId)}/access-grants`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );

    return this.handleResponse<AgentAccessGrant[]>(response);
  }

  async grantAgentAccess(
    agentId: string,
    data: CreateAgentAccessGrantRequest,
  ): Promise<AgentAccessGrant> {
    const response = await fetch(
      `${API_BASE_URL}/api/agents/${encodeURIComponent(agentId)}/access-grants`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      },
    );

    return this.handleResponse<AgentAccessGrant>(response);
  }

  async revokeAgentAccess(
    agentId: string,
    accessGroupId: number,
  ): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/agents/${encodeURIComponent(agentId)}/access-grants/${accessGroupId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );

    return this.handleResponse<void>(response);
  }
}

export const accessGroupsService = new AccessGroupsService();
