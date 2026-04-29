import { getAiApiBaseUrl, handleResponse } from "./lib/api";

const API_BASE_URL = getAiApiBaseUrl();

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
  // ------------------------------------------------------------------
  // Access Groups CRUD
  // ------------------------------------------------------------------

  async listGroups(): Promise<AccessGroup[]> {
    const response = await fetch(`${API_BASE_URL}/api/access-groups`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return handleResponse<AccessGroup[]>(response);
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
    return handleResponse<AccessGroup>(response);
  }

  async createGroup(data: CreateAccessGroupRequest): Promise<AccessGroup> {
    const response = await fetch(`${API_BASE_URL}/api/access-groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return handleResponse<AccessGroup>(response);
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
    return handleResponse<AccessGroup>(response);
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
    return handleResponse<void>(response);
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
    return handleResponse<AccessGroupMember[]>(response);
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
    return handleResponse<AccessGroupMember>(response);
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
    return handleResponse<void>(response);
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
    return handleResponse<AgentAccessGrant[]>(response);
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
    return handleResponse<AgentAccessGrant>(response);
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
    return handleResponse<void>(response);
  }
}

export const accessGroupsService = new AccessGroupsService();
