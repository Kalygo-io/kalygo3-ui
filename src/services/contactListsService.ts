import { getAiApiBaseUrl, handleResponse } from "./lib/api";

const API_BASE_URL = getAiApiBaseUrl();

// ============================================================================
// Types
// ============================================================================

export interface ContactSummary {
  id: number;
  account_id: number;
  first_name: string;
  middle_name?: string;
  last_name?: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactListMember {
  id: number;
  contact_list_id: number;
  contact_id: number;
  account_id: number;
  added_at: string;
  contact: ContactSummary;
}

export interface ContactList {
  id: number;
  account_id: number;
  name: string;
  description?: string;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface ContactListDetail {
  id: number;
  account_id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  members: ContactListMember[];
}

export interface CreateContactListRequest {
  name: string;
  description?: string;
}

export interface UpdateContactListRequest {
  name?: string;
  description?: string;
}

export interface AddContactToListRequest {
  contact_id: number;
}

export interface BulkAddContactsToListRequest {
  contact_ids: number[];
}

export interface BulkAddResult {
  added: number;
  skipped: number;
}

// ============================================================================
// Service
// ============================================================================

class ContactListsService {
  async listContactLists(): Promise<ContactList[]> {
    const response = await fetch(`${API_BASE_URL}/api/contact-lists/`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return handleResponse<ContactList[]>(response);
  }

  async getContactList(listId: number): Promise<ContactListDetail> {
    const response = await fetch(`${API_BASE_URL}/api/contact-lists/${listId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return handleResponse<ContactListDetail>(response);
  }

  async createContactList(data: CreateContactListRequest): Promise<ContactList> {
    const response = await fetch(`${API_BASE_URL}/api/contact-lists/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return handleResponse<ContactList>(response);
  }

  async updateContactList(listId: number, data: UpdateContactListRequest): Promise<ContactList> {
    const response = await fetch(`${API_BASE_URL}/api/contact-lists/${listId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return handleResponse<ContactList>(response);
  }

  async deleteContactList(listId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/contact-lists/${listId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return handleResponse<void>(response);
  }

  // ── Members ────────────────────────────────────────────────────────────────

  async listMembers(listId: number): Promise<ContactListMember[]> {
    const response = await fetch(`${API_BASE_URL}/api/contact-lists/${listId}/members/`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return handleResponse<ContactListMember[]>(response);
  }

  async addMember(listId: number, data: AddContactToListRequest): Promise<ContactListMember> {
    const response = await fetch(`${API_BASE_URL}/api/contact-lists/${listId}/members/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return handleResponse<ContactListMember>(response);
  }

  async bulkAddMembers(listId: number, data: BulkAddContactsToListRequest): Promise<BulkAddResult> {
    const response = await fetch(`${API_BASE_URL}/api/contact-lists/${listId}/members/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return handleResponse<BulkAddResult>(response);
  }

  async removeMember(listId: number, contactId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/contact-lists/${listId}/members/${contactId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );
    return handleResponse<void>(response);
  }
}

export const contactListsService = new ContactListsService();
