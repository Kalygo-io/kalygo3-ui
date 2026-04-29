import { getAiApiBaseUrl, handleResponse } from "./lib/api";

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
  private get base(): string {
    return `${getAiApiBaseUrl()}/api/email-campaigns`;
  }

  async list(search?: string, status?: string): Promise<EmailCampaign[]> {
    const url = new URL(`${this.base}/`);
    if (search) url.searchParams.set("search", search);
    if (status) url.searchParams.set("status", status);
    const res = await fetch(url.toString(), { credentials: "include" });
    return handleResponse<EmailCampaign[]>(res);
  }

  async get(id: number): Promise<EmailCampaign> {
    const res = await fetch(`${this.base}/${id}`, { credentials: "include" });
    return handleResponse<EmailCampaign>(res);
  }

  async create(payload: CreateEmailCampaignPayload): Promise<EmailCampaign> {
    const res = await fetch(`${this.base}/`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<EmailCampaign>(res);
  }

  async update(id: number, payload: UpdateEmailCampaignPayload): Promise<EmailCampaign> {
    const res = await fetch(`${this.base}/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<EmailCampaign>(res);
  }

  async delete(id: number): Promise<void> {
    const res = await fetch(`${this.base}/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    return handleResponse<void>(res);
  }
}

export const emailCampaignsService = new EmailCampaignsService();
