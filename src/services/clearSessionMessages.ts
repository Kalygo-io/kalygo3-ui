export async function clearSessionMessages(sessionId: string): Promise<void> {
  if (!sessionId) {
    throw new Error("Session ID is required");
  }

  const resp = await fetch(
    `${process.env.NEXT_PUBLIC_AI_API_URL}/api/chat-sessions/sessions/${sessionId}/messages`,
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
      throw new Error("Session not found or does not belong to you");
    }
    if (resp.status === 401) {
      throw new Error("Authentication required");
    }
    if (resp.status === 400) {
      throw new Error("Invalid session ID format");
    }

    const errorData = await resp
      .json()
      .catch(() => ({ error: "Unknown error" }));
    const errorMessage = errorData.error || errorData.detail || `HTTP ${resp.status}`;
    throw new Error(`Failed to clear session messages: ${errorMessage}`);
  }
}
