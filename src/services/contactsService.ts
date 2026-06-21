import { getAiApiBaseUrl, handleResponse } from "./lib/api";
import type { Company } from "./companiesService";

const API_BASE_URL = getAiApiBaseUrl();

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
    const url = new URL(`${API_BASE_URL}/api/contacts/`);
    if (params?.status) url.searchParams.set("status", params.status);
    if (params?.search) url.searchParams.set("search", params.search);

    const limit =
      typeof params?.limit === "number" && !isNaN(params.limit)
        ? Math.max(1, Math.min(CONTACTS_MAX_PAGE, params.limit))
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
    return handleResponse<ContactListResponse>(response);
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
    const response = await fetch(`${API_BASE_URL}/api/contacts/${contactId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return handleResponse<Contact>(response);
  }

  async createContact(data: CreateContactRequest): Promise<Contact> {
    const response = await fetch(`${API_BASE_URL}/api/contacts/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return handleResponse<Contact>(response);
  }

  async updateContact(contactId: number, data: UpdateContactRequest): Promise<Contact> {
    const response = await fetch(`${API_BASE_URL}/api/contacts/${contactId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return handleResponse<Contact>(response);
  }

  async deleteContact(contactId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/contacts/${contactId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return handleResponse<void>(response);
  }

  // ── Events ────────────────────────────────────────────────────────────────

  async listEvents(contactId: number): Promise<ContactEvent[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/contacts/${contactId}/events/`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );
    return handleResponse<ContactEvent[]>(response);
  }

  async createEvent(
    contactId: number,
    data: CreateContactEventRequest
  ): Promise<ContactEvent> {
    const response = await fetch(
      `${API_BASE_URL}/api/contacts/${contactId}/events/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      }
    );
    return handleResponse<ContactEvent>(response);
  }

  async updateEvent(
    contactId: number,
    eventId: number,
    data: UpdateContactEventRequest
  ): Promise<ContactEvent> {
    const response = await fetch(
      `${API_BASE_URL}/api/contacts/${contactId}/events/${eventId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      }
    );
    return handleResponse<ContactEvent>(response);
  }

  async deleteEvent(contactId: number, eventId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/contacts/${contactId}/events/${eventId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );
    return handleResponse<void>(response);
  }

  // ── Career Timeline ──────────────────────────────────────────────────────

  async listCareerTimeline(contactId: number): Promise<CareerTimelineEntry[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/contacts/${contactId}/career-timeline/`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );
    return handleResponse<CareerTimelineEntry[]>(response);
  }

  async createCareerTimelineEntry(
    contactId: number,
    data: CreateCareerTimelineRequest
  ): Promise<CareerTimelineEntry> {
    const response = await fetch(
      `${API_BASE_URL}/api/contacts/${contactId}/career-timeline/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      }
    );
    return handleResponse<CareerTimelineEntry>(response);
  }

  async updateCareerTimelineEntry(
    contactId: number,
    entryId: number,
    data: UpdateCareerTimelineRequest
  ): Promise<CareerTimelineEntry> {
    const response = await fetch(
      `${API_BASE_URL}/api/contacts/${contactId}/career-timeline/${entryId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      }
    );
    return handleResponse<CareerTimelineEntry>(response);
  }

  async deleteCareerTimelineEntry(
    contactId: number,
    entryId: number
  ): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/contacts/${contactId}/career-timeline/${entryId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );
    return handleResponse<void>(response);
  }

  // ── Companies (reverse association) ──────────────────────────────────────

  async listCompanies(contactId: number): Promise<ContactCompany[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/contacts/${contactId}/companies/`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );
    return handleResponse<ContactCompany[]>(response);
  }

  async addCompany(
    contactId: number,
    data: AddCompanyToContactRequest
  ): Promise<ContactCompany> {
    const response = await fetch(
      `${API_BASE_URL}/api/contacts/${contactId}/companies/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      }
    );
    return handleResponse<ContactCompany>(response);
  }

  async removeCompany(contactId: number, companyId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/contacts/${contactId}/companies/${companyId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );
    return handleResponse<void>(response);
  }
}

export const contactsService = new ContactsService();
