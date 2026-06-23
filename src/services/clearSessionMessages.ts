import { apiDelete } from "./lib/api";

export async function clearSessionMessages(sessionId: string): Promise<void> {
  if (!sessionId) {
    throw new Error("Session ID is required");
  }

  return apiDelete<void>(
    `/api/chat-sessions/sessions/${sessionId}/messages`,
  );
}
