import { apiGet, apiPost, apiPut, apiDelete } from "./lib/api";
import type { Company } from "./companiesService";

// ============================================================================
// Types
// ============================================================================

export interface ContactEvent {
  id: number;
  contact_id: number;
  account_id: number;
  event_type: string;
  title: string;
  description?: string;
  occurred_at: string;
  created_at: string;
}

export interface Contact {
  id: number;
  account_id: number;
  first_name: string;
  middle_name?: string;
  last_name?: string;
  /** Computed by API: `"${first_name} ${middle_name} ${last_name}".trim()` */
  name: string;
  /** The default (primary) email — shown as "Default email" in the UI. */
  email: string;
  alt_email_1?: string;
  alt_email_2?: string;
  phone?: string;
  company?: string;
  source?: string;
  linkedin_url?: string;
  instagram_url?: string;
  youtube_url?: string;
  x_url?: string;
  created_at: string;
  updated_at: string;
  status?: string;
  events?: ContactEvent[];
}

export interface CreateContactRequest {
  first_name: string;
  middle_name?: string;
  last_name?: string;
  email: string;
  alt_email_1?: string;
  alt_email_2?: string;
  phone?: string;
  source?: string;
  linkedin_url?: string;
  instagram_url?: string;
  youtube_url?: string;
  x_url?: string;
}

export interface UpdateContactRequest {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  email?: string;
  alt_email_1?: string;
  alt_email_2?: string;
  phone?: string;
  source?: string;
  linkedin_url?: string;
  instagram_url?: string;
  youtube_url?: string;
  x_url?: string;
}

export interface CreateContactEventRequest {
  event_type: string;
  title: string;
  description?: string;
  occurred_at?: string;
}

export interface UpdateContactEventRequest {
  event_type?: string;
  title?: string;
  description?: string;
  occurred_at?: string;
}

export interface CareerTimelineEntry {
  id: number;
  contact_id: number;
  account_id: number;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCareerTimelineRequest {
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
}

export interface UpdateCareerTimelineRequest {
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
}

export interface ContactListResponse {
  contacts: Contact[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

/** A company a contact is associated with, including the join metadata. */
export interface ContactCompany {
  id: number;
  company_id: number;
  contact_id: number;
  account_id: number;
  /** Optional role/title the contact holds at this company, e.g. "CTO". */
  title?: string;
  added_at: string;
  company: Company;
}

export interface AddCompanyToContactRequest {
  company_id: number;
  title?: string;
}

const CONTACTS_MAX_PAGE = 500; // matches the backend Query(le=500) cap

// ============================================================================
// Service
// ============================================================================

class ContactsService {
  // ── Contacts ──────────────────────────────────────────────────────────────

  /**
   * Server-side paginated contacts (the canonical endpoint). limit/offset are
   * clamped to the backend's accepted range, mirroring the ingestion-logs
   * pattern.
   */
  async listContactsPage(params?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ContactListResponse> {
    const limit =
      typeof params?.limit === "number" && !isNaN(params.limit)
        ? Math.max(1, Math.min(CONTACTS_MAX_PAGE, params.limit))
        : 50;
    const offset =
      typeof params?.offset === "number" && !isNaN(params.offset)
        ? Math.max(0, params.offset)
        : 0;

    return apiGet<ContactListResponse>(`/api/contacts/`, {
      query: {
        status: params?.status || undefined,
        search: params?.search || undefined,
        limit,
        offset,
      },
    });
  }

  /**
   * Back-compat: return ALL matching contacts as a flat array by paging
   * through the server-side endpoint. Used by callers that aggregate over the
   * full set (dashboard stats, contact-list picker). Bounded by page size.
   */
  async listContacts(params?: { status?: string; search?: string }): Promise<Contact[]> {
    const all: Contact[] = [];
    let offset = 0;
    // Loop is bounded: each page is up to CONTACTS_MAX_PAGE and we stop as
    // soon as the server reports no more.
    while (true) {
      const page = await this.listContactsPage({
        ...params,
        limit: CONTACTS_MAX_PAGE,
        offset,
      });
      all.push(...page.contacts);
      if (!page.has_more || page.contacts.length === 0) break;
      offset += CONTACTS_MAX_PAGE;
    }
    return all;
  }

  async getContact(contactId: number): Promise<Contact> {
    return apiGet<Contact>(`/api/contacts/${contactId}`);
  }

  async createContact(data: CreateContactRequest): Promise<Contact> {
    return apiPost<Contact>(`/api/contacts/`, data);
  }

  async updateContact(contactId: number, data: UpdateContactRequest): Promise<Contact> {
    return apiPut<Contact>(`/api/contacts/${contactId}`, data);
  }

  async deleteContact(contactId: number): Promise<void> {
    return apiDelete<void>(`/api/contacts/${contactId}`);
  }

  // ── Events ────────────────────────────────────────────────────────────────

  async listEvents(contactId: number): Promise<ContactEvent[]> {
    return apiGet<ContactEvent[]>(`/api/contacts/${contactId}/events/`);
  }

  async createEvent(
    contactId: number,
    data: CreateContactEventRequest
  ): Promise<ContactEvent> {
    return apiPost<ContactEvent>(`/api/contacts/${contactId}/events/`, data);
  }

  async updateEvent(
    contactId: number,
    eventId: number,
    data: UpdateContactEventRequest
  ): Promise<ContactEvent> {
    return apiPut<ContactEvent>(
      `/api/contacts/${contactId}/events/${eventId}`,
      data
    );
  }

  async deleteEvent(contactId: number, eventId: number): Promise<void> {
    return apiDelete<void>(`/api/contacts/${contactId}/events/${eventId}`);
  }

  // ── Career Timeline ──────────────────────────────────────────────────────

  async listCareerTimeline(contactId: number): Promise<CareerTimelineEntry[]> {
    return apiGet<CareerTimelineEntry[]>(
      `/api/contacts/${contactId}/career-timeline/`
    );
  }

  async createCareerTimelineEntry(
    contactId: number,
    data: CreateCareerTimelineRequest
  ): Promise<CareerTimelineEntry> {
    return apiPost<CareerTimelineEntry>(
      `/api/contacts/${contactId}/career-timeline/`,
      data
    );
  }

  async updateCareerTimelineEntry(
    contactId: number,
    entryId: number,
    data: UpdateCareerTimelineRequest
  ): Promise<CareerTimelineEntry> {
    return apiPut<CareerTimelineEntry>(
      `/api/contacts/${contactId}/career-timeline/${entryId}`,
      data
    );
  }

  async deleteCareerTimelineEntry(
    contactId: number,
    entryId: number
  ): Promise<void> {
    return apiDelete<void>(
      `/api/contacts/${contactId}/career-timeline/${entryId}`
    );
  }

  // ── Companies (reverse association) ──────────────────────────────────────

  async listCompanies(contactId: number): Promise<ContactCompany[]> {
    return apiGet<ContactCompany[]>(`/api/contacts/${contactId}/companies/`);
  }

  async addCompany(
    contactId: number,
    data: AddCompanyToContactRequest
  ): Promise<ContactCompany> {
    return apiPost<ContactCompany>(
      `/api/contacts/${contactId}/companies/`,
      data
    );
  }

  async removeCompany(contactId: number, companyId: number): Promise<void> {
    return apiDelete<void>(
      `/api/contacts/${contactId}/companies/${companyId}`
    );
  }
}

export const contactsService = new ContactsService();
