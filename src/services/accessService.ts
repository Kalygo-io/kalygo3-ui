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
}

export const accessService = new AccessService();
