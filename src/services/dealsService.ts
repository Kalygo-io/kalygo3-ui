import { apiGet, apiPost, apiPut, apiDelete } from "./lib/api";

// ============================================================================
// Types
// ============================================================================

/** Pipeline stages — mirrors DEAL_STAGES in the backend models. */
export const DEAL_STAGES = [
  "lead",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const;

export type DealStage = (typeof DEAL_STAGES)[number];

export interface Deal {
  id: number;
  account_id: number;
  /** Optional: a deal can exist without being tied to a contact. */
  contact_id?: number | null;
  /** Display name of the linked contact (server-joined); null if unlinked. */
  contact_name?: string | null;
  title: string;
  description?: string | null;
  amount?: number | null;
  currency: string;
  stage: DealStage;
  expected_close_date?: string | null;
  closed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDealRequest {
  title: string;
  description?: string;
  amount?: number;
  currency?: string;
  stage?: DealStage;
  expected_close_date?: string;
  closed_at?: string;
  /** Link to a contact; null = no contact (account-level deal). */
  contact_id?: number | null;
}

export interface UpdateDealRequest {
  title?: string;
  description?: string;
  amount?: number;
  currency?: string;
  stage?: DealStage;
  expected_close_date?: string;
  closed_at?: string;
  /** Link to a contact; null = unlink (account-level deal). */
  contact_id?: number | null;
}

export interface DealListResponse {
  deals: Deal[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

const DEALS_MAX_PAGE = 500; // matches the backend Query(le=500) cap

// ============================================================================
// Service
// ============================================================================

class DealsService {
  /** Server-side paginated deals (the canonical endpoint). */
  async listDealsPage(params?: {
    contactId?: number;
    stage?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<DealListResponse> {
    const limit =
      typeof params?.limit === "number" && !isNaN(params.limit)
        ? Math.max(1, Math.min(DEALS_MAX_PAGE, params.limit))
        : 50;
    const offset =
      typeof params?.offset === "number" && !isNaN(params.offset)
        ? Math.max(0, params.offset)
        : 0;

    return apiGet<DealListResponse>(`/api/deals/`, {
      query: {
        contact_id:
          typeof params?.contactId === "number" ? params.contactId : undefined,
        stage: params?.stage || undefined,
        search: params?.search || undefined,
        limit,
        offset,
      },
    });
  }

  /** All deals across the account (paged through to completion). */
  async listAllDeals(): Promise<Deal[]> {
    const all: Deal[] = [];
    let offset = 0;
    while (true) {
      const page = await this.listDealsPage({
        limit: DEALS_MAX_PAGE,
        offset,
      });
      all.push(...page.deals);
      if (!page.has_more || page.deals.length === 0) break;
      offset += DEALS_MAX_PAGE;
    }
    return all;
  }

  /** All deals for a given contact (paged through to completion). */
  async listDealsForContact(contactId: number): Promise<Deal[]> {
    const all: Deal[] = [];
    let offset = 0;
    while (true) {
      const page = await this.listDealsPage({
        contactId,
        limit: DEALS_MAX_PAGE,
        offset,
      });
      all.push(...page.deals);
      if (!page.has_more) break;
      offset += DEALS_MAX_PAGE;
    }
    return all;
  }

  async getDeal(dealId: number): Promise<Deal> {
    return apiGet<Deal>(`/api/deals/${dealId}`);
  }

  async createDeal(data: CreateDealRequest): Promise<Deal> {
    return apiPost<Deal>(`/api/deals/`, data);
  }

  async updateDeal(dealId: number, data: UpdateDealRequest): Promise<Deal> {
    return apiPut<Deal>(`/api/deals/${dealId}`, data);
  }

  async deleteDeal(dealId: number): Promise<void> {
    return apiDelete<void>(`/api/deals/${dealId}`);
  }
}

export const dealsService = new DealsService();
