/**
 * TTS next-turn (streaming): one agent turn per request.
 * POST /api/swarms/tts/next-turn/stream with { sessionId, swarm, prompt?, stateToken? }.
 * Accept: text/event-stream. Returns SSE stream of events; client resolves with tts_turn_result.
 *
 * Stream events:
 * - swarm_agent_start
 * - swarm_chat_model_stream
 * - swarm_agent_end
 * - tts_turn_result  (final payload: agentName, content, stateToken?, done)
 * - error
 */

import { getCookie } from "@/shared/utils";

const BASE_URL =
  process.env.NEXT_PUBLIC_COMPLETION_API_URL ||
  process.env.NEXT_PUBLIC_AI_API_URL ||
  "http://127.0.0.1:4100";
const PATH = "/api/swarms/tts/next-turn/stream";

export interface SwarmSupervisorSpec {
  name: string;
  modelName: string;
}

export interface SwarmWorkerSpec {
  agentName: string;
  agentDescription?: string;
  systemPrompt?: string;
  modelName?: string;
}

export interface SwarmPayload {
  supervisor: SwarmSupervisorSpec;
  workers: SwarmWorkerSpec[];
  outputMode?: "last_message" | string;
}

export interface SwarmTtsNextTurnResponse {
  agentName: string;
  content: string;
  stateToken: string | null;
  done: boolean;
}

export type SwarmTtsEventType =
  | "swarm_agent_start"
  | "swarm_chat_model_stream"
  | "swarm_agent_end"
  | "tts_turn_result"
  | "error";

export interface SwarmTtsStreamEvent {
  event: SwarmTtsEventType;
  [key: string]: unknown;
}

export interface TtsTurnResultPayload {
  agentName?: string;
  content?: string;
  stateToken?: string | null;
  done?: boolean;
}

export interface SwarmTtsStreamCallbacks {
  onAgentStart?: (agentName: string) => void;
  onStreamChunk?: (agentName: string, chunk: string) => void;
  onAgentEnd?: (agentName: string) => void;
  onTurnResult?: (result: SwarmTtsNextTurnResponse) => void;
  onError?: (err: Error) => void;
}

function isTurnResultPayload(obj: unknown): obj is TtsTurnResultPayload {
  if (obj == null || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return (
    "agentName" in o ||
    "content" in o ||
    "stateToken" in o ||
    "done" in o
  );
}

function extractTurnResult(parsed: Record<string, unknown>): SwarmTtsNextTurnResponse | null {
  // Nested payload: { event: "tts_turn_result", data: {...} } or { result: {...} }
  const data = (parsed.data ?? parsed.result) as Record<string, unknown> | undefined;
  const payload = data && typeof data === "object" ? data : parsed;
  if (!isTurnResultPayload(payload)) return null;
  return {
    agentName: (payload.agentName ?? "") as string,
    content: (payload.content ?? "") as string,
    stateToken: (payload.stateToken ?? null) as string | null,
    done: (payload.done ?? true) as boolean,
  };
}

/**
 * Consume the response as a stream of events (NDJSON or SSE-style) or a single JSON body.
 * Resolves with the tts_turn_result payload, or any object with agentName/content/stateToken/done.
 * Rejects on error event or non-ok response.
 */
export async function callSwarmTtsNextTurn(
  sessionId: string,
  swarm: SwarmPayload,
  options: { prompt?: string; stateToken?: string | null },
  signal?: AbortSignal
): Promise<SwarmTtsNextTurnResponse> {
  const url = `${BASE_URL}${PATH.startsWith("/") ? "" : "/"}${PATH}`;
  const jwt = typeof document !== "undefined" ? getCookie("jwt") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  };
  if (jwt) headers["Authorization"] = `Bearer ${jwt}`;

  const body: Record<string, unknown> = {
    sessionId,
    swarm,
  };
  if (options.prompt != null) body.prompt = options.prompt;
  if (options.stateToken != null) body.stateToken = options.stateToken;

  const res = await fetch(url, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`TTS next-turn failed: ${res.status} - ${text}`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  const isLikelyStream =
    contentType.includes("text/event-stream") ||
    contentType.includes("application/x-ndjson") ||
    contentType.includes("stream");

  // Non-streaming: single JSON body
  if (!isLikelyStream) {
    const data = (await res.json()) as SwarmTtsNextTurnResponse & Record<string, unknown>;
    return {
      agentName: data.agentName ?? "",
      content: data.content ?? "",
      stateToken: data.stateToken ?? null,
      done: data.done ?? true,
    };
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error("TTS next-turn: no response body");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let result: SwarmTtsNextTurnResponse | null = null;

  function processLine(trimmed: string): void {
    if (!trimmed) return;
    const data = trimmed.startsWith("data:")
      ? trimmed.slice(5).trim()
      : trimmed;
    if (data === "[DONE]" || data === "") return;
    try {
      const parsed = JSON.parse(data) as Record<string, unknown>;
      const event = (parsed.event ?? parsed.type) as string | undefined;

      if (event === "error") {
        const msg = (parsed.message ?? parsed.error) ?? "Stream error";
        throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
      }

      if (
        event === "tts_turn_result" ||
        isTurnResultPayload(parsed) ||
        (parsed.data && isTurnResultPayload(parsed.data)) ||
        (parsed.result && isTurnResultPayload(parsed.result))
      ) {
        const next = extractTurnResult(parsed);
        if (next) result = next;
      }
    } catch (e) {
      if (e instanceof SyntaxError) return;
      throw e;
    }
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      processLine(line.trim());
    }
  }

  if (buffer.trim()) processLine(buffer.trim());

  // If stream had no result, try parsing entire buffer as single JSON (some servers send one chunk)
  if (!result && buffer.trim()) {
    try {
      const parsed = JSON.parse(buffer.trim()) as Record<string, unknown>;
      if (isTurnResultPayload(parsed) || (parsed.data && isTurnResultPayload(parsed.data))) {
        result = extractTurnResult(parsed);
      }
    } catch {
      // ignore
    }
  }

  if (!result) {
    throw new Error("TTS next-turn: no tts_turn_result event in stream");
  }

  return result;
}

/**
 * Consume the SSE stream and invoke callbacks for each event. Resolves with the
 * tts_turn_result payload. Use this for token streaming UI and chunked TTS.
 */
export async function callSwarmTtsNextTurnStream(
  sessionId: string,
  swarm: SwarmPayload,
  options: { prompt?: string; stateToken?: string | null },
  callbacks: SwarmTtsStreamCallbacks,
  signal?: AbortSignal
): Promise<SwarmTtsNextTurnResponse> {
  const url = `${BASE_URL}${PATH.startsWith("/") ? "" : "/"}${PATH}`;
  const jwt = typeof document !== "undefined" ? getCookie("jwt") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  };
  if (jwt) headers["Authorization"] = `Bearer ${jwt}`;

  const body: Record<string, unknown> = { sessionId, swarm };
  if (options.prompt != null) body.prompt = options.prompt;
  if (options.stateToken != null) body.stateToken = options.stateToken;

  const res = await fetch(url, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`TTS next-turn failed: ${res.status} - ${text}`);
    callbacks.onError?.(err);
    throw err;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    const err = new Error("TTS next-turn: no response body");
    callbacks.onError?.(err);
    throw err;
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent: string | null = null;
  let result: SwarmTtsNextTurnResponse | null = null;

  const processDataLine = (dataStr: string) => {
    if (!dataStr.trim()) return;
    if (dataStr === "[DONE]") return;
    try {
      const parsed = JSON.parse(dataStr) as Record<string, unknown>;

      if (currentEvent === "error") {
        const msg = (parsed.message ?? parsed.error) ?? "Stream error";
        const err = new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
        callbacks.onError?.(err);
        throw err;
      }

      if (currentEvent === "swarm_agent_start") {
        const agentName = (parsed.agentName ?? "") as string;
        callbacks.onAgentStart?.(agentName);
      } else if (currentEvent === "swarm_chat_model_stream") {
        const agentName = (parsed.agentName ?? "") as string;
        const chunk = (parsed.data ?? parsed.content ?? "") as string;
        if (chunk) callbacks.onStreamChunk?.(agentName, chunk);
      } else if (currentEvent === "swarm_agent_end") {
        const agentName = (parsed.agentName ?? "") as string;
        callbacks.onAgentEnd?.(agentName);
      } else if (currentEvent === "tts_turn_result") {
        const next = extractTurnResult(parsed);
        if (next) {
          result = next;
          callbacks.onTurnResult?.(next);
        }
      }
    } catch (e) {
      if (e instanceof SyntaxError) return;
      throw e;
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("event:")) {
        currentEvent = trimmed.slice(6).trim();
      } else if (trimmed.startsWith("data:")) {
        const dataStr = trimmed.slice(5).trim();
        processDataLine(dataStr);
      }
    }
  }

  if (buffer.trim()) {
    const trimmed = buffer.trim();
    if (trimmed.startsWith("event:")) currentEvent = trimmed.slice(6).trim();
    else if (trimmed.startsWith("data:")) processDataLine(trimmed.slice(5).trim());
  }

  if (!result) {
    const err = new Error("TTS next-turn: no tts_turn_result event in stream");
    callbacks.onError?.(err);
    throw err;
  }

  return result;
}
