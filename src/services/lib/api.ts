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
  // Tolerate empty bodies: void endpoints (logout, validate-token, …) often
  // answer with an empty 200 where response.json() would throw.
  try {
    return (await response.json()) as T;
  } catch {
    return undefined as T;
  }
}

// ============================================================================
// Verb helpers
//
// Thin wrappers around fetch() that every JSON service should use instead of
// hand-rolling fetch. They guarantee the HTTPS upgrade (via the base-url
// helpers), `credentials: "include"`, the JSON content-type, and centralized
// error handling through handleResponse().
//
//   apiGet<T>("/api/prompts/")
//   apiPost<T>("/api/prompts/", body)
//   apiPut<T>("/api/prompts/123", body)
//   apiDelete<T>("/api/prompts/123")
//
// For the auth API, pass `{ baseUrl: getAuthApiBaseUrl() }`. FormData bodies
// are sent as-is (the browser sets the multipart content-type/boundary).
// ============================================================================

export interface RequestOptions {
  /** Base URL override. Defaults to the AI API base. */
  baseUrl?: string;
  /** Query-string params; undefined/null values are skipped. */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Extra headers merged over the defaults. */
  headers?: Record<string, string>;
  /** Abort signal for cancellation. */
  signal?: AbortSignal;
}

function buildUrl(path: string, opts?: RequestOptions): string {
  const base = opts?.baseUrl ?? getAiApiBaseUrl();
  const url = new URL(`${base}${path}`);
  if (opts?.query) {
    for (const [key, value] of Object.entries(opts.query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function request<T>(
  method: string,
  path: string,
  body: unknown,
  opts?: RequestOptions,
): Promise<T> {
  const isForm =
    typeof FormData !== "undefined" && body instanceof FormData;
  const hasJsonBody = body !== undefined && !isForm;

  const init: RequestInit = {
    method,
    credentials: "include",
    headers: {
      // Only declare a JSON content-type when we actually send a JSON body.
      // (FormData sets its own multipart boundary; bodyless GET/DELETE need none.)
      ...(hasJsonBody ? { "Content-Type": "application/json" } : {}),
      ...opts?.headers,
    },
    signal: opts?.signal,
  };
  if (body !== undefined) {
    init.body = isForm ? (body as FormData) : JSON.stringify(body);
  }

  const response = await fetch(buildUrl(path, opts), init);
  return handleResponse<T>(response);
}

export function apiGet<T>(path: string, opts?: RequestOptions): Promise<T> {
  return request<T>("GET", path, undefined, opts);
}

export function apiPost<T>(
  path: string,
  body?: unknown,
  opts?: RequestOptions,
): Promise<T> {
  return request<T>("POST", path, body, opts);
}

export function apiPut<T>(
  path: string,
  body?: unknown,
  opts?: RequestOptions,
): Promise<T> {
  return request<T>("PUT", path, body, opts);
}

export function apiPatch<T>(
  path: string,
  body?: unknown,
  opts?: RequestOptions,
): Promise<T> {
  return request<T>("PATCH", path, body, opts);
}

export function apiDelete<T>(
  path: string,
  body?: unknown,
  opts?: RequestOptions,
): Promise<T> {
  return request<T>("DELETE", path, body, opts);
}
