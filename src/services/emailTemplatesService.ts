import { getAiApiBaseUrl, handleResponse } from "./lib/api";

// ============================================================================
// Types
// ============================================================================

export interface TemplateVariable {
  name: string;
  label: string;
  default?: string;
}

export interface EmailTemplate {
  id: number;
  account_id: number;
  name: string;
  description?: string;
  subject_template: string;
  html_template: string;
  variables?: TemplateVariable[];
  created_at: string;
  updated_at: string;
}

export interface CreateEmailTemplatePayload {
  name: string;
  description?: string;
  subject_template: string;
  html_template: string;
  variables?: TemplateVariable[];
}

export interface UpdateEmailTemplatePayload {
  name?: string;
  description?: string;
  subject_template?: string;
  html_template?: string;
  variables?: TemplateVariable[];
}

// ============================================================================
// Service
// ============================================================================

class EmailTemplatesService {
  private get base(): string {
    return `${getAiApiBaseUrl()}/api/email-templates`;
  }

  async list(search?: string): Promise<EmailTemplate[]> {
    const url = new URL(`${this.base}/`);
    if (search) url.searchParams.set("search", search);
    const res = await fetch(url.toString(), { credentials: "include" });
    return handleResponse<EmailTemplate[]>(res);
  }

  async get(id: number): Promise<EmailTemplate> {
    const res = await fetch(`${this.base}/${id}`, { credentials: "include" });
    return handleResponse<EmailTemplate>(res);
  }

  async create(payload: CreateEmailTemplatePayload): Promise<EmailTemplate> {
    const res = await fetch(`${this.base}/`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<EmailTemplate>(res);
  }

  async update(id: number, payload: UpdateEmailTemplatePayload): Promise<EmailTemplate> {
    const res = await fetch(`${this.base}/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<EmailTemplate>(res);
  }

  async delete(id: number): Promise<void> {
    const res = await fetch(`${this.base}/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    return handleResponse<void>(res);
  }
}

export const emailTemplatesService = new EmailTemplatesService();
