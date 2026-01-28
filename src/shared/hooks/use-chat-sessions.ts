import { useState, useCallback, useEffect } from "react";
import { chatSessionService, ChatSession } from "@/services/chatSessionService";

export function useChatSessions(onCurrentSessionDeleted?: () => void) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const recent = await chatSessionService.getRecentSessions();
      setSessions(recent);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createSession = useCallback(async (appId: string) => {
    const newSession = await chatSessionService.createSession(appId);
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
