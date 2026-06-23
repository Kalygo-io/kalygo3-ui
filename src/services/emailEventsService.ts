import { apiGet, apiDelete } from "./lib/api";

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
    return apiGet<EmailEvent[]>(`/api/email-events/`, {
      query: {
        event_type: params?.event_type || undefined,
        primary_recipient: params?.primary_recipient || undefined,
        message_id: params?.message_id || undefined,
        provider: params?.provider || undefined,
        campaign_id: params?.campaign_id ?? undefined,
        tool_approval_id: params?.tool_approval_id ?? undefined,
        credential_id: params?.credential_id ?? undefined,
        sender_domain: params?.sender_domain || undefined,
        from_date: params?.from_date || undefined,
        to_date: params?.to_date || undefined,
        limit: params?.limit ?? undefined,
        offset: params?.offset ?? undefined,
      },
    });
  }

  async getStats(params?: EmailEventStatsParams): Promise<EmailEventStats> {
    return apiGet<EmailEventStats>(`/api/email-events/stats`, {
      query: {
        campaign_id: params?.campaign_id ?? undefined,
        tool_approval_id: params?.tool_approval_id ?? undefined,
        credential_id: params?.credential_id ?? undefined,
        from_date: params?.from_date || undefined,
        to_date: params?.to_date || undefined,
      },
    });
  }

  async deleteEvent(eventId: number): Promise<void> {
    return apiDelete<void>(`/api/email-events/${eventId}`);
  }
}

export const emailEventsService = new EmailEventsService();
