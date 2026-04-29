import { getAiApiBaseUrl, handleResponse } from "./lib/api";

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
  email: string;
  phone?: string;
  company?: string;
  source?: string;
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
  phone?: string;
  source?: string;
}

export interface UpdateContactRequest {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  source?: string;
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

// ============================================================================
// Service
// ============================================================================

class ContactsService {
  // ── Contacts ──────────────────────────────────────────────────────────────

  async listContacts(params?: { status?: string; search?: string }): Promise<Contact[]> {
    const url = new URL(`${API_BASE_URL}/api/contacts/`);
    if (params?.status) url.searchParams.set("status", params.status);
    if (params?.search) url.searchParams.set("search", params.search);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return handleResponse<Contact[]>(response);
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
}

export const contactsService = new ContactsService();
