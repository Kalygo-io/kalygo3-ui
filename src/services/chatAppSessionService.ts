import { Message } from "@/ts/types/Message";
import { v4 as uuid } from "uuid";

export interface ChatAppSession {
  id: number;
  sessionId: string;
  chatAppId: string;
  accountId: number;
  chatHistory: Message[];
  createdAt: string;
  title?: string;
}

export interface ChatAppSessionCreate {
  chatAppId: string;
  title?: string;
}

class ChatAppSessionService {
  private MAX_SESSIONS = 10;

  async getSessions(
    limit: number = 50,
    offset: number = 0
  ): Promise<ChatAppSession[]> {
    try {
      const params = new URLSearchParams();
      params.append("limit", limit.toString());
      params.append("offset", offset.toString());

      const resp = await fetch(
        `${
          process.env.NEXT_PUBLIC_AI_API_URL
        }/api/chat-app-sessions/sessions?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error("Failed to get sessions:", resp.status, errorText);
        throw new Error(
          `Failed to get sessions: ${resp.status} - ${errorText}`
        );
      }

      const sessionsData = await resp.json();

      // Transform the API response to match our interface
      const sessions: ChatAppSession[] = sessionsData.map(
        (sessionData: any) => ({
          id: sessionData.id,
          sessionId: sessionData.sessionId,
          chatAppId: sessionData.chatAppId,
          accountId: sessionData.accountId,
          createdAt: sessionData.createdAt,
          title: sessionData.title,
          chatHistory: [], // Sessions list doesn't include messages
        })
      );

      return sessions;
    } catch (error) {
      console.error("Error getting chat app sessions:", error);
      throw error;
    }
  }

  // private saveSessions(sessions: ChatAppSession[]): void {
  //   if (typeof window === "undefined") return;

  //   try {
  //     localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
  //   } catch (error) {
  //     console.error("Error saving chat sessions:", error);
  //   }
  // }

  async getRecentSessions(): Promise<ChatAppSession[]> {
    const sessions = await this.getSessions();
    return sessions.slice(0, this.MAX_SESSIONS);
  }

  async getSession(id: string): Promise<ChatAppSession | null> {
    try {
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_AI_API_URL}/api/chat-app-sessions/sessions/${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!resp.ok) {
        if (resp.status === 404) {
          return null; // Session not found
        }
        const errorText = await resp.text();
        console.error("Failed to get session:", resp.status, errorText);
        throw new Error(`Failed to get session: ${resp.status} - ${errorText}`);
      }

      const sessionData = await resp.json();

      // Transform the API response to match our interface
      // Note: messages from the backend should follow the chat-message schema
      // and include fields like role, content, and toolCalls (for AI messages)
      const session: ChatAppSession = {
        id: sessionData.id,
        sessionId: sessionData.sessionId,
        chatAppId: sessionData.chatAppId,
        accountId: sessionData.accountId,
        createdAt: sessionData.createdAt,
        title: sessionData.title,
        chatHistory: sessionData.messages || [], // Messages preserve all fields including toolCalls
      };

      return session;
    } catch (error) {
      console.error("Error getting chat app session:", error);
      throw error;
    }
  }

  async createSession(appId: string, title?: string): Promise<ChatAppSession> {
    try {
      const sessionData: ChatAppSessionCreate = {
        chatAppId: appId,
        title: title,
      };

      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_AI_API_URL}/api/chat-app-sessions/sessions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sessionData),
          credentials: "include",
        }
      );

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error("Failed to create session:", resp.status, errorText);
        throw new Error(
          `Failed to create session: ${resp.status} - ${errorText}`
        );
      }

      const session: ChatAppSession = await resp.json();
      return session;
    } catch (error) {
      console.error("Error creating chat app session:", error);
      throw error;
    }
  }

  // updateSession(id: string, messages: any[]): void {
  //   const sessions = this.getSessions();
  //   const sessionIndex = sessions.findIndex((session) => session.id === id);

  //   if (sessionIndex !== -1) {
  //     sessions[sessionIndex].messages = messages;
  //     sessions[sessionIndex].lastUpdated = new Date();
  //     sessions[sessionIndex].title = this.generateTitle(
  //       sessions[sessionIndex].levelName,
  //       messages
  //     );

  //     // Move to top of list
  //     const session = sessions.splice(sessionIndex, 1)[0];
  //     sessions.unshift(session);

  //     this.saveSessions(sessions);
  //   }
  // }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_AI_API_URL}/api/chat-app-sessions/sessions/${sessionId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!resp.ok) {
        if (resp.status === 404) {
          throw new Error("Session not found");
        }
        const errorText = await resp.text();
        console.error("Failed to delete session:", resp.status, errorText);
        throw new Error(
          `Failed to delete session: ${resp.status} - ${errorText}`
        );
      }

      console.log("Session deleted successfully");
    } catch (error) {
      console.error("Error deleting chat app session:", error);
      throw error;
    }
  }

  private generateId(): string {
    return uuid();
  }

  // private generateTitle(levelName: string, messages: any[]): string {
  //   if (messages.length === 0) {
  //     return `${levelName} - New Session`;
  //   }

  //   // Try to get the first user message as title
  //   const firstUserMessage = messages.find((msg) => msg.role === "human");
  //   if (firstUserMessage) {
  //     const content = firstUserMessage.content;
  //     return content.length > 50 ? content.substring(0, 50) + "..." : content;
  //   }

  //   return `${levelName} - ${messages.length} messages`;
  // }
}

export const chatAppSessionService = new ChatAppSessionService();
