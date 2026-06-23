import { apiGet, apiPost, apiPut, apiDelete } from "./lib/api";
import { Contact } from "./contactsService";

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
    const limit =
      typeof params?.limit === "number" && !isNaN(params.limit)
        ? Math.max(1, Math.min(COMPANIES_MAX_PAGE, params.limit))
        : 50;
    const offset =
      typeof params?.offset === "number" && !isNaN(params.offset)
        ? Math.max(0, params.offset)
        : 0;

    return apiGet<CompanyListResponse>(`/api/companies/`, {
      query: {
        search: params?.search || undefined,
        limit,
        offset,
      },
    });
  }

  async getCompany(companyId: number): Promise<CompanyDetail> {
    return apiGet<CompanyDetail>(`/api/companies/${companyId}`);
  }

  async createCompany(data: CreateCompanyRequest): Promise<Company> {
    return apiPost<Company>(`/api/companies/`, data);
  }

  async updateCompany(companyId: number, data: UpdateCompanyRequest): Promise<Company> {
    return apiPut<Company>(`/api/companies/${companyId}`, data);
  }

  async deleteCompany(companyId: number): Promise<void> {
    return apiDelete<void>(`/api/companies/${companyId}`);
  }

  // ── Associated contacts ──────────────────────────────────────────────────

  async listContacts(companyId: number): Promise<CompanyContact[]> {
    return apiGet<CompanyContact[]>(`/api/companies/${companyId}/contacts/`);
  }

  async addContact(companyId: number, data: AddContactToCompanyRequest): Promise<CompanyContact> {
    return apiPost<CompanyContact>(`/api/companies/${companyId}/contacts/`, data);
  }

  async bulkAddContacts(
    companyId: number,
    data: BulkAddContactsToCompanyRequest
  ): Promise<BulkAddResult> {
    return apiPost<BulkAddResult>(
      `/api/companies/${companyId}/contacts/bulk`,
      data
    );
  }

  async removeContact(companyId: number, contactId: number): Promise<void> {
    return apiDelete<void>(
      `/api/companies/${companyId}/contacts/${contactId}`
    );
  }
}

export const companiesService = new CompaniesService();
