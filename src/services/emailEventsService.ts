import { getAiApiBaseUrl, handleResponse } from "./lib/api";

const API_BASE_URL = getAiApiBaseUrl();

// ============================================================================
// Types
// ============================================================================

export type EmailEventType = "send" | "send_to_ses" | "delivery" | "open" | "bounce" | "complaint" | "click" | "other";

export interface EmailEvent {
  id: number;
  account_id: number;
  tool_approval_id?: number;
  campaign_id?: number;
  contact_id?: number;
  credential_id?: number;
  sender_domain?: string;
  primary_recipient?: string;
  event_type: EmailEventType;
  provider?: string;
  message_id?: string;
  event_metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EmailEventStats {
  send: number;
  send_to_ses: number;
  delivery: number;
  open: number;
  bounce: number;
  complaint: number;
  click: number;
  other: number;
  total: number;
}

export interface ListEmailEventsParams {
  event_type?: string;
  primary_recipient?: string;
  message_id?: string;
  provider?: string;
  campaign_id?: number;
  tool_approval_id?: number;
  credential_id?: number;
  sender_domain?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}

export interface EmailEventStatsParams {
  campaign_id?: number;
  tool_approval_id?: number;
  credential_id?: number;
  from_date?: string;
  to_date?: string;
}

// ============================================================================
// Service
// ============================================================================

class EmailEventsService {
  async listEvents(params?: ListEmailEventsParams): Promise<EmailEvent[]> {
    const url = new URL(`${API_BASE_URL}/api/email-events/`);
    if (params?.event_type) url.searchParams.set("event_type", params.event_type);
    if (params?.primary_recipient) url.searchParams.set("primary_recipient", params.primary_recipient);
    if (params?.message_id) url.searchParams.set("message_id", params.message_id);
    if (params?.provider) url.searchParams.set("provider", params.provider);
    if (params?.campaign_id != null) url.searchParams.set("campaign_id", String(params.campaign_id));
    if (params?.tool_approval_id != null) url.searchParams.set("tool_approval_id", String(params.tool_approval_id));
    if (params?.credential_id != null) url.searchParams.set("credential_id", String(params.credential_id));
    if (params?.sender_domain) url.searchParams.set("sender_domain", params.sender_domain);
    if (params?.from_date) url.searchParams.set("from_date", params.from_date);
    if (params?.to_date) url.searchParams.set("to_date", params.to_date);
    if (params?.limit != null) url.searchParams.set("limit", String(params.limit));
    if (params?.offset != null) url.searchParams.set("offset", String(params.offset));

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return handleResponse<EmailEvent[]>(response);
  }

  async getStats(params?: EmailEventStatsParams): Promise<EmailEventStats> {
    const url = new URL(`${API_BASE_URL}/api/email-events/stats`);
    if (params?.campaign_id != null) url.searchParams.set("campaign_id", String(params.campaign_id));
    if (params?.tool_approval_id != null) url.searchParams.set("tool_approval_id", String(params.tool_approval_id));
    if (params?.credential_id != null) url.searchParams.set("credential_id", String(params.credential_id));
    if (params?.from_date) url.searchParams.set("from_date", params.from_date);
    if (params?.to_date) url.searchParams.set("to_date", params.to_date);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return handleResponse<EmailEventStats>(response);
  }

  async deleteEvent(eventId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/email-events/${eventId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return handleResponse<void>(response);
  }
}

export const emailEventsService = new EmailEventsService();
