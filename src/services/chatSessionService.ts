import { Message } from "@/ts/types/Message";
import { v4 as uuid } from "uuid";
import { apiGet, apiPost, apiDelete } from "./lib/api";

export interface ChatSession {
  id: number;
  sessionId: string;
  chatAppId: string | null;
  agentId: number | null;
  accountId: number;
  chatHistory: Message[];
  createdAt: string;
  title?: string;
  contactId?: number | null;
}

export interface ChatSessionCreate {
  agentId?: number;
  title?: string;
  contactId?: number;
}

class ChatSessionService {
  private MAX_SESSIONS = 10;

  async getSessions(
    limit: number = 50,
    offset: number = 0,
    contactId?: number,
  ): Promise<ChatSession[]> {
    // Contact-bound sessions are excluded by the backend unless contact_id is
    // explicitly requested (keeps them out of global chat history).
    const sessionsData = await apiGet<any[]>(
      `/api/chat-sessions/sessions`,
      {
        query: {
          limit,
          offset,
          contact_id: contactId != null ? contactId : undefined,
        },
      },
    );

    const sessions: ChatSession[] = sessionsData.map((sessionData: any) => ({
      id: sessionData.id,
      sessionId: sessionData.sessionId,
      chatAppId: sessionData.chatAppId,
      agentId: sessionData.agentId,
      accountId: sessionData.accountId,
      createdAt: sessionData.createdAt,
      title: sessionData.title,
      contactId: sessionData.contactId,
      chatHistory: [],
    }));

    return sessions;
  }

  async getRecentSessions(): Promise<ChatSession[]> {
    const sessions = await this.getSessions();
    return sessions.slice(0, this.MAX_SESSIONS);
  }

  async getSession(id: string): Promise<ChatSession | null> {
    let sessionData: any;
    try {
      sessionData = await apiGet<any>(
        `/api/chat-sessions/sessions/${id}`,
      );
    } catch {
      // A missing session (404) resolves to null so callers can branch on it.
      return null;
    }

    const session: ChatSession = {
      id: sessionData.id,
      sessionId: sessionData.sessionId,
      chatAppId: sessionData.chatAppId,
      agentId: sessionData.agentId,
      accountId: sessionData.accountId,
      createdAt: sessionData.createdAt,
      title: sessionData.title,
      contactId: sessionData.contactId,
      chatHistory: sessionData.messages || [],
    };

    return session;
  }

  async createSession(agentId: number, title?: string): Promise<ChatSession> {
    const sessionData: ChatSessionCreate = {
      agentId: agentId,
      title: title,
    };

    return apiPost<ChatSession>(`/api/chat-sessions/sessions`, sessionData);
  }

  /**
   * Create a chat session bound to a CRM contact (no agent — the contact-chat
   * endpoint injects a code-defined agent). The backend validates that the
   * contact belongs to the caller's account.
   */
  async createContactSession(
    contactId: number,
    title?: string,
  ): Promise<ChatSession> {
    const body: ChatSessionCreate = { contactId, title };

    return apiPost<ChatSession>(`/api/chat-sessions/sessions`, body);
  }

  /**
   * Return the most recent chat session bound to this contact, or null.
   * Used to resume an existing contact conversation instead of spawning a new
   * one each time the drawer opens.
   */
  async findContactSession(contactId: number): Promise<ChatSession | null> {
    const sessions = await this.getSessions(1, 0, contactId);
    return sessions[0] ?? null;
  }

  async deleteSession(sessionId: string): Promise<void> {
    return apiDelete<void>(
      `/api/chat-sessions/sessions/${sessionId}`,
    );
  }

  private generateId(): string {
    return uuid();
  }
}

export const chatSessionService = new ChatSessionService();
