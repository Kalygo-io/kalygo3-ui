import { apiGet } from "./lib/api";

export type ResourceType = "agent" | "vector_store" | "credential";

export interface EffectiveAccount {
  account_id: number;
  email?: string | null;
  /** 'owner' | 'read' | 'write' | 'use' */
  role: string;
  /** 'owner' | 'direct' | 'group:<name>' */
  via: string;
}

export interface DerivedExposure {
  resource_type: ResourceType;
  resource_id: number;
  label: string;
  note: string;
}

export interface ResourceAudit {
  resource_type: ResourceType;
  resource_id: number;
  effective_accounts: EffectiveAccount[];
  derived_exposure: DerivedExposure[];
}

export interface ReverseAuditItem {
  resource_type: ResourceType;
  resource_id: number;
  label: string;
  role: string;
  via: string;
}

export interface SharedGrant {
  grant_id: number;
  label: string;
  target_type: "group" | "individual";
  role: string;
}

export interface SharedResource {
  resource_type: ResourceType;
  resource_id: number;
  label: string;
  shared_with: SharedGrant[];
}

export interface AccessEvent {
  id: number;
  event_type: "create" | "revoke" | "role_change";
  resource_type: ResourceType;
  resource_id: number;
  resource_label?: string | null;
  principal_type: "group" | "account";
  principal_label?: string | null;
  role?: string | null;
  actor_email?: string | null;
  created_at: string;
}

class AccessService {
  /** Who can access a resource (resolved to accounts) + derived exposure. Owner only. */
  async auditResource(resourceType: ResourceType, resourceId: number): Promise<ResourceAudit> {
    return apiGet<ResourceAudit>(
      `/api/access/resources/${resourceType}/${resourceId}/audit`,
    );
  }

  /** Reverse audit: everything the current user can reach via grants. */
  async myAccessReport(): Promise<ReverseAuditItem[]> {
    return apiGet<ReverseAuditItem[]>(`/api/access/report`);
  }

  /** Everything the current user OWNS that is shared, and with whom. */
  async sharedByMe(): Promise<SharedResource[]> {
    return apiGet<SharedResource[]>(`/api/access/shared-by-me`);
  }

  /** Append-only audit log of access changes on resources the user owns. */
  async activity(): Promise<AccessEvent[]> {
    return apiGet<AccessEvent[]>(`/api/access/activity`);
  }
}

export const accessService = new AccessService();
