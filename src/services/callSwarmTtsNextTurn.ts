/**
 * TTS next-turn: one agent turn per request.
 * POST /api/swarms/tts/next-turn with { sessionId, swarm, prompt?, stateToken? }.
 * Returns { agentName, content, stateToken?, done }.
 */

import { getCookie } from "@/shared/utils";

const BASE_URL =
  process.env.NEXT_PUBLIC_COMPLETION_API_URL ||
  process.env.NEXT_PUBLIC_AI_API_URL ||
  "http://127.0.0.1:4100";
const PATH = "/api/swarms/tts/next-turn";

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

export async function callSwarmTtsNextTurn(
  sessionId: string,
  swarm: SwarmPayload,
  options: { prompt?: string; stateToken?: string | null },
  signal?: AbortSignal
): Promise<SwarmTtsNextTurnResponse> {
  const url = `${BASE_URL}${PATH.startsWith("/") ? "" : "/"}${PATH}`;
  const jwt = typeof document !== "undefined" ? getCookie("jwt") : null;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
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

  const data = (await res.json()) as SwarmTtsNextTurnResponse;
  return {
    agentName: data.agentName ?? "",
    content: data.content ?? "",
    stateToken: data.stateToken ?? null,
    done: data.done ?? true,
  };
}
