import { apiGet, apiPost, apiPatch, apiDelete } from "./lib/api";

// ============================================================================
// Types
// ============================================================================

export interface EmailCampaign {
  id: number;
  uuid: string;
  account_id: number;
  name: string;
  description?: string;
  email_template_id?: number;
  contact_list_id?: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEmailCampaignPayload {
  name: string;
  description?: string;
  email_template_id?: number;
  contact_list_id?: number;
  status?: string;
}

export interface UpdateEmailCampaignPayload {
  name?: string;
  description?: string;
  email_template_id?: number;
  contact_list_id?: number;
  status?: string;
}

// ============================================================================
// Service
// ============================================================================

class EmailCampaignsService {
  async list(search?: string, status?: string): Promise<EmailCampaign[]> {
    return apiGet<EmailCampaign[]>(`/api/email-campaigns/`, {
      query: { search: search || undefined, status: status || undefined },
    });
  }

  async get(id: number): Promise<EmailCampaign> {
    return apiGet<EmailCampaign>(`/api/email-campaigns/${id}`);
  }

  async create(payload: CreateEmailCampaignPayload): Promise<EmailCampaign> {
    return apiPost<EmailCampaign>(`/api/email-campaigns/`, payload);
  }

  async update(id: number, payload: UpdateEmailCampaignPayload): Promise<EmailCampaign> {
    return apiPatch<EmailCampaign>(`/api/email-campaigns/${id}`, payload);
  }

  async delete(id: number): Promise<void> {
    return apiDelete<void>(`/api/email-campaigns/${id}`);
  }
}

export const emailCampaignsService = new EmailCampaignsService();
