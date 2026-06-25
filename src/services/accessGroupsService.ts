import { apiGet, apiPost, apiPatch, apiDelete } from "./lib/api";

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

export interface GroupAgent {
  agent_id: number;
  agent_name: string;
  granted_at: string;
}

// ============================================================================
// Service
// ============================================================================

class AccessGroupsService {
  // ------------------------------------------------------------------
  // Access Groups CRUD
  // ------------------------------------------------------------------

  async listGroups(): Promise<AccessGroup[]> {
    return apiGet<AccessGroup[]>(`/api/access-groups`);
  }

  async getGroup(groupId: number): Promise<AccessGroup> {
    return apiGet<AccessGroup>(`/api/access-groups/${groupId}`);
  }

  async createGroup(data: CreateAccessGroupRequest): Promise<AccessGroup> {
    return apiPost<AccessGroup>(`/api/access-groups`, data);
  }

  async updateGroup(
    groupId: number,
    data: UpdateAccessGroupRequest,
  ): Promise<AccessGroup> {
    return apiPatch<AccessGroup>(`/api/access-groups/${groupId}`, data);
  }

  async deleteGroup(groupId: number): Promise<void> {
    return apiDelete<void>(`/api/access-groups/${groupId}`);
  }

  // ------------------------------------------------------------------
  // Group Members
  // ------------------------------------------------------------------

  async listMembers(groupId: number): Promise<AccessGroupMember[]> {
    return apiGet<AccessGroupMember[]>(
      `/api/access-groups/${groupId}/members`,
    );
  }

  async addMember(
    groupId: number,
    data: AddMemberRequest,
  ): Promise<AccessGroupMember> {
    return apiPost<AccessGroupMember>(
      `/api/access-groups/${groupId}/members`,
      data,
    );
  }

  async removeMember(groupId: number, accountId: number): Promise<void> {
    return apiDelete<void>(
      `/api/access-groups/${groupId}/members/${accountId}`,
    );
  }

  /** Agents granted to this group (visible to the owner or any member). */
  async listGroupAgents(groupId: number): Promise<GroupAgent[]> {
    return apiGet<GroupAgent[]>(`/api/access-groups/${groupId}/agents`);
  }

  // ------------------------------------------------------------------
  // Agent Access Grants
  // ------------------------------------------------------------------

  async listAgentGrants(agentId: string): Promise<AgentAccessGrant[]> {
    return apiGet<AgentAccessGrant[]>(
      `/api/agents/${encodeURIComponent(agentId)}/access-grants`,
    );
  }

  async grantAgentAccess(
    agentId: string,
    data: CreateAgentAccessGrantRequest,
  ): Promise<AgentAccessGrant> {
    return apiPost<AgentAccessGrant>(
      `/api/agents/${encodeURIComponent(agentId)}/access-grants`,
      data,
    );
  }

  async revokeAgentAccess(
    agentId: string,
    accessGroupId: number,
  ): Promise<void> {
    return apiDelete<void>(
      `/api/agents/${encodeURIComponent(agentId)}/access-grants/${accessGroupId}`,
    );
  }
}

export const accessGroupsService = new AccessGroupsService();
