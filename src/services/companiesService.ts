import { getAiApiBaseUrl, handleResponse } from "./lib/api";
import { Contact } from "./contactsService";

const API_BASE_URL = getAiApiBaseUrl();

// ============================================================================
// Types
// ============================================================================

export interface Company {
  id: number;
  account_id: number;
  name: string;
  domain?: string;
  website?: string;
  industry?: string;
  description?: string;
  linkedin_url?: string;
  contact_count: number;
  created_at: string;
  updated_at: string;
}

/** A contact associated with a company, including the join metadata. */
export interface CompanyContact {
  id: number;
  company_id: number;
  contact_id: number;
  account_id: number;
  /** Optional role/title the contact holds at this company, e.g. "CTO". */
  title?: string;
  added_at: string;
  contact: Contact;
}

export interface CompanyDetail {
  id: number;
  account_id: number;
  name: string;
  domain?: string;
  website?: string;
  industry?: string;
  description?: string;
  linkedin_url?: string;
  created_at: string;
  updated_at: string;
  contacts: CompanyContact[];
}

export interface CreateCompanyRequest {
  name: string;
  domain?: string;
  website?: string;
  industry?: string;
  description?: string;
  linkedin_url?: string;
}

export interface UpdateCompanyRequest {
  name?: string;
  domain?: string;
  website?: string;
  industry?: string;
  description?: string;
  linkedin_url?: string;
}

export interface CompanyListResponse {
  companies: Company[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface AddContactToCompanyRequest {
  contact_id: number;
  title?: string;
}

export interface BulkAddContactsToCompanyRequest {
  contact_ids: number[];
}

export interface BulkAddResult {
  added: number;
  skipped: number;
}

const COMPANIES_MAX_PAGE = 500; // matches the backend Query(le=500) cap

// ============================================================================
// Service
// ============================================================================

class CompaniesService {
  /**
   * Server-side paginated companies (the canonical endpoint). limit/offset are
   * clamped to the backend's accepted range, mirroring the contacts pattern.
   */
  async listCompaniesPage(params?: {
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<CompanyListResponse> {
    const url = new URL(`${API_BASE_URL}/api/companies/`);
    if (params?.search) url.searchParams.set("search", params.search);

    const limit =
      typeof params?.limit === "number" && !isNaN(params.limit)
        ? Math.max(1, Math.min(COMPANIES_MAX_PAGE, params.limit))
        : 50;
    const offset =
      typeof params?.offset === "number" && !isNaN(params.offset)
        ? Math.max(0, params.offset)
        : 0;
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return handleResponse<CompanyListResponse>(response);
  }

  async getCompany(companyId: number): Promise<CompanyDetail> {
    const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return handleResponse<CompanyDetail>(response);
  }

  async createCompany(data: CreateCompanyRequest): Promise<Company> {
    const response = await fetch(`${API_BASE_URL}/api/companies/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return handleResponse<Company>(response);
  }

  async updateCompany(companyId: number, data: UpdateCompanyRequest): Promise<Company> {
    const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return handleResponse<Company>(response);
  }

  async deleteCompany(companyId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return handleResponse<void>(response);
  }

  // ── Associated contacts ──────────────────────────────────────────────────

  async listContacts(companyId: number): Promise<CompanyContact[]> {
    const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}/contacts/`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return handleResponse<CompanyContact[]>(response);
  }

  async addContact(companyId: number, data: AddContactToCompanyRequest): Promise<CompanyContact> {
    const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}/contacts/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return handleResponse<CompanyContact>(response);
  }

  async bulkAddContacts(
    companyId: number,
    data: BulkAddContactsToCompanyRequest
  ): Promise<BulkAddResult> {
    const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}/contacts/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return handleResponse<BulkAddResult>(response);
  }

  async removeContact(companyId: number, contactId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/companies/${companyId}/contacts/${contactId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );
    return handleResponse<void>(response);
  }
}

export const companiesService = new CompaniesService();
