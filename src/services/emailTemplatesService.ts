import { apiGet, apiPost, apiPatch, apiDelete } from "./lib/api";

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
  async list(search?: string): Promise<EmailTemplate[]> {
    return apiGet<EmailTemplate[]>(`/api/email-templates/`, {
      query: { search: search || undefined },
    });
  }

  async get(id: number): Promise<EmailTemplate> {
    return apiGet<EmailTemplate>(`/api/email-templates/${id}`);
  }

  async create(payload: CreateEmailTemplatePayload): Promise<EmailTemplate> {
    return apiPost<EmailTemplate>(`/api/email-templates/`, payload);
  }

  async update(id: number, payload: UpdateEmailTemplatePayload): Promise<EmailTemplate> {
    return apiPatch<EmailTemplate>(`/api/email-templates/${id}`, payload);
  }

  async delete(id: number): Promise<void> {
    return apiDelete<void>(`/api/email-templates/${id}`);
  }
}

export const emailTemplatesService = new EmailTemplatesService();
