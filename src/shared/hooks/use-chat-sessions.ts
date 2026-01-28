import { useState, useCallback, useEffect } from "react";
import { chatSessionService, ChatSession } from "@/services/chatSessionService";

interface UseChatSessionsOptions {
  enabled?: boolean;
  onCurrentSessionDeleted?: () => void;
}

export function useChatSessions(options: UseChatSessionsOptions = {}) {
  const { enabled = true, onCurrentSessionDeleted } = options;
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(enabled);

  const loadSessions = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const recent = await chatSessionService.getRecentSessions();
      setSessions(recent);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      loadSessions();
    }
  }, [enabled, loadSessions]);

  const createSession = useCallback(async (agentId: number) => {
    const newSession = await chatSessionService.createSession(agentId);
    return newSession;
  }, []);

  const deleteSession = useCallback(
    async (id: string) => {
      try {
        await chatSessionService.deleteSession(id);
        setSessions((prev) =>
          prev.filter((session) => session.sessionId !== id),
        );

        // Check if the deleted session was the current session
        const currentSessionId = new URLSearchParams(
          window.location.search,
        ).get("session");
        if (currentSessionId === id && onCurrentSessionDeleted) {
          onCurrentSessionDeleted();
        }
      } catch (error) {
        console.error("Error deleting session:", error);
        throw error;
      }
    },
    [onCurrentSessionDeleted],
  );

  const getSession = useCallback((id: string) => {
    return chatSessionService.getSession(id);
  }, []);

  return {
    sessions,
    loading,
    createSession,
    // updateSession,
    deleteSession,
    getSession,
    // refreshSessions: loadSessions,
  };
}
