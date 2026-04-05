function getApiBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_AI_API_URL || "http://127.0.0.1:4000";
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    if (apiUrl.startsWith("http://")) return apiUrl.replace("http://", "https://");
  }
  return apiUrl;
}

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
    return `${getApiBaseUrl()}/api/email-templates`;
  }

  private async handle<T>(res: Response): Promise<T> {
    if (!res.ok) {
      const text = await res.text();
      let msg = `Request failed: ${res.status}`;
      try { msg = JSON.parse(text).detail || msg; } catch { /* use default */ }
      throw new Error(msg);
    }
    if (res.status === 204) return undefined as T;
    return res.json();
  }

  async list(search?: string): Promise<EmailTemplate[]> {
    const url = new URL(`${this.base}/`);
    if (search) url.searchParams.set("search", search);
    const res = await fetch(url.toString(), { credentials: "include" });
    return this.handle<EmailTemplate[]>(res);
  }

  async get(id: number): Promise<EmailTemplate> {
    const res = await fetch(`${this.base}/${id}`, { credentials: "include" });
    return this.handle<EmailTemplate>(res);
  }

  async create(payload: CreateEmailTemplatePayload): Promise<EmailTemplate> {
    const res = await fetch(`${this.base}/`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return this.handle<EmailTemplate>(res);
  }

  async update(id: number, payload: UpdateEmailTemplatePayload): Promise<EmailTemplate> {
    const res = await fetch(`${this.base}/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return this.handle<EmailTemplate>(res);
  }

  async delete(id: number): Promise<void> {
    const res = await fetch(`${this.base}/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    return this.handle<void>(res);
  }
}

export const emailTemplatesService = new EmailTemplatesService();
