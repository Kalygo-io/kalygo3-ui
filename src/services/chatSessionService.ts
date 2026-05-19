import { Message } from "@/ts/types/Message";
import { v4 as uuid } from "uuid";

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
    const params = new URLSearchParams();
    params.append("limit", limit.toString());
    params.append("offset", offset.toString());
    // Contact-bound sessions are excluded by the backend unless contact_id is
    // explicitly requested (keeps them out of global chat history).
    if (contactId != null) {
      params.append("contact_id", contactId.toString());
    }

    const resp = await fetch(
      `${process.env.NEXT_PUBLIC_AI_API_URL}/api/chat-sessions/sessions?${params.toString()}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );

    if (!resp.ok) {
      const errorText = await resp.text();
      throw new Error(
        `Failed to get sessions: ${resp.status} - ${errorText}`,
      );
    }

    const sessionsData = await resp.json();

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
    const resp = await fetch(
      `${process.env.NEXT_PUBLIC_AI_API_URL}/api/chat-sessions/sessions/${id}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );

    if (!resp.ok) {
      if (resp.status === 404) {
        return null;
      }
      const errorText = await resp.text();
      throw new Error(`Failed to get session: ${resp.status} - ${errorText}`);
    }

    const sessionData = await resp.json();

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

    const resp = await fetch(
      `${process.env.NEXT_PUBLIC_AI_API_URL}/api/chat-sessions/sessions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionData),
        credentials: "include",
      },
    );

    if (!resp.ok) {
      const errorText = await resp.text();
      throw new Error(
        `Failed to create session: ${resp.status} - ${errorText}`,
      );
    }

    const session: ChatSession = await resp.json();
    return session;
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

    const resp = await fetch(
      `${process.env.NEXT_PUBLIC_AI_API_URL}/api/chat-sessions/sessions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      },
    );

    if (!resp.ok) {
      const errorText = await resp.text();
      throw new Error(
        `Failed to create contact session: ${resp.status} - ${errorText}`,
      );
    }

    return (await resp.json()) as ChatSession;
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
    const resp = await fetch(
      `${process.env.NEXT_PUBLIC_AI_API_URL}/api/chat-sessions/sessions/${sessionId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );

    if (!resp.ok) {
      if (resp.status === 404) {
        throw new Error("Session not found");
      }
      const errorText = await resp.text();
      throw new Error(
        `Failed to delete session: ${resp.status} - ${errorText}`,
      );
    }
  }

  private generateId(): string {
    return uuid();
  }
}

export const chatSessionService = new ChatSessionService();
