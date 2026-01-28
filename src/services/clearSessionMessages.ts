/**
 * Clear all messages from a session
 * DELETE /api/chat-sessions/sessions/{session_id}/messages
 *
 * This endpoint:
 * - Clears all messages from the specified chat session
 * - Does NOT delete the session itself (only the messages)
 * - Returns 204 No Content on success
 * - Requires JWT authentication (credentials: include)
 * - Rate limited to 10 requests per minute
 */
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
    // Handle different error codes
    if (resp.status === 404) {
      throw new Error("Session not found or does not belong to you");
    }
    if (resp.status === 401) {
      throw new Error("Authentication required");
    }
    if (resp.status === 400) {
      throw new Error("Invalid session ID format");
    }

    // Try to get error details from response
    const errorData = await resp
      .json()
      .catch(() => ({ error: "Unknown error" }));
    const errorMessage = errorData.error || errorData.detail || `HTTP ${resp.status}`;
    console.error(
      "Failed to clear session messages:",
      resp.status,
      errorMessage
    );
    throw new Error(`Failed to clear session messages: ${errorMessage}`);
  }

  // 204 No Content response has no body
  console.log("Session messages cleared successfully");
}
