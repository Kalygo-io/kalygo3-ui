/**
 * Shared API utilities used across all service modules.
 *
 * getAiApiBaseUrl()   → NEXT_PUBLIC_AI_API_URL   (agents, contacts, prompts, …)
 * getAuthApiBaseUrl() → NEXT_PUBLIC_AUTH_API_URL  (auth, account, payments)
 *
 * Both apply an HTTPS upgrade when running in a browser over HTTPS so that
 * mixed-content errors are avoided in production.
 */

function ensureHttps(url: string): string {
  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    url.startsWith("http://")
  ) {
    return url.replace("http://", "https://");
  }
  return url;
}

export function getAiApiBaseUrl(): string {
  return ensureHttps(
    process.env.NEXT_PUBLIC_AI_API_URL || "http://127.0.0.1:4000",
  );
}

export function getAuthApiBaseUrl(): string {
  return ensureHttps(
    process.env.NEXT_PUBLIC_AUTH_API_URL || "http://127.0.0.1:4000",
  );
}

/**
 * Standard response handler for JSON APIs.
 *
 * - Throws with the most specific error message available (detail → message → status)
 * - Returns `undefined` for 204 No Content
 * - Otherwise parses JSON
 */
export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Request failed: ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.detail || errorJson.message || errorMessage;
    } catch {
      if (errorText) errorMessage = errorText;
    }
    throw new Error(errorMessage);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}
