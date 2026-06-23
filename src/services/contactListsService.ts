import { apiGet, apiPost, apiPut, apiDelete } from "./lib/api";

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
    return apiGet<ContactList[]>(`/api/contact-lists/`);
  }

  async getContactList(listId: number): Promise<ContactListDetail> {
    return apiGet<ContactListDetail>(`/api/contact-lists/${listId}`);
  }

  async createContactList(data: CreateContactListRequest): Promise<ContactList> {
    return apiPost<ContactList>(`/api/contact-lists/`, data);
  }

  async updateContactList(listId: number, data: UpdateContactListRequest): Promise<ContactList> {
    return apiPut<ContactList>(`/api/contact-lists/${listId}`, data);
  }

  async deleteContactList(listId: number): Promise<void> {
    return apiDelete<void>(`/api/contact-lists/${listId}`);
  }

  // ── Members ────────────────────────────────────────────────────────────────

  async listMembers(listId: number): Promise<ContactListMember[]> {
    return apiGet<ContactListMember[]>(
      `/api/contact-lists/${listId}/members/`
    );
  }

  async addMember(listId: number, data: AddContactToListRequest): Promise<ContactListMember> {
    return apiPost<ContactListMember>(
      `/api/contact-lists/${listId}/members/`,
      data
    );
  }

  async bulkAddMembers(listId: number, data: BulkAddContactsToListRequest): Promise<BulkAddResult> {
    return apiPost<BulkAddResult>(
      `/api/contact-lists/${listId}/members/bulk`,
      data
    );
  }

  async removeMember(listId: number, contactId: number): Promise<void> {
    return apiDelete<void>(
      `/api/contact-lists/${listId}/members/${contactId}`
    );
  }
}

export const contactListsService = new ContactListsService();
