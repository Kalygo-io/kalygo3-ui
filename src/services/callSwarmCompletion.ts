/**
 * Call hierarchical swarm completion endpoint and stream SSE events.
 * Dispatches to reducer: ADD_MESSAGE (with agentName), EDIT_MESSAGE (content), error.
 *
 * No agent id in the URL. Request shape (SwarmCompletionRequest):
 *   { prompt: string, sessionId: string, swarm: { director, workers, maxLoops? } }
 *
 * cURL example:
 *   curl -X POST 'http://127.0.0.1:4100/api/swarm/completion' \
 *     -H 'Content-Type: application/json' \
 *     --cookie 'session=...' \
 *     -d '{"prompt":"Your message here","sessionId":"550e8400-e29b-41d4-a716-446655440000","swarm":{"director":{"name":"Director","modelName":"gpt-4o-mini","systemPrompt":"You coordinate workers."},"workers":[{"agentName":"Researcher","agentDescription":"Researches topics","systemPrompt":"You are Researcher.","modelName":"gpt-4o-mini"}],"maxLoops":3}}'
 */
import React from "react";
import { nanoid } from "@/shared/utils";
import type { Message } from "@/ts/types/Message";

const COMPLETION_API_URL =
  process.env.NEXT_PUBLIC_COMPLETION_API_URL || process.env.NEXT_PUBLIC_AI_API_URL || "http://127.0.0.1:4100";

async function readStreamToEnd(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  decoder: TextDecoder,
  tryParseAndDispatch: (str: string) => string
): Promise<void> {
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      buffer = tryParseAndDispatch(buffer);
    }
  } finally {
    reader.releaseLock();
  }
}

/** Director spec for swarm (backend DirectorSpec). */
export interface SwarmDirectorSpec {
  name: string;
  modelName: string;
  systemPrompt: string;
}

/** Worker spec for swarm (backend WorkerSpec). */
export interface SwarmWorkerSpec {
  agentName: string;
  agentDescription?: string;
  systemPrompt?: string;
  modelName?: string;
}

/** Swarm config sent in request body (backend SwarmConfig input). */
export interface SwarmPayload {
  director: SwarmDirectorSpec;
  workers: SwarmWorkerSpec[];
  maxLoops?: number;
}

/** Full request body for swarm completion (no agent id in path). */
export interface SwarmCompletionRequestBody {
  prompt: string;
  sessionId: string;
  swarm: SwarmPayload;
}

export async function callSwarmCompletion(
  sessionId: string,
  prompt: string,
  swarm: SwarmPayload,
  dispatch: React.Dispatch<any>,
  abortController?: AbortController
): Promise<void> {
  const url = `${COMPLETION_API_URL}/api/swarm/completion`;
  const body: SwarmCompletionRequestBody = { sessionId, prompt, swarm };

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
    signal: abortController?.signal,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Swarm completion failed: ${resp.status} - ${text}`);
  }

  const reader = resp.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";
  let currentMessageId: string | null = null;
  let currentAgentName: string | null = null;
  let currentContent = "";

  const dispatchEvent = (obj: Record<string, any>) => {
    const event = obj.event as string;
    const data = obj.data;
    const agentName = obj.agentName as string | undefined;

    if (event === "swarm_run_start") {
      dispatch({ type: "SET_CURRENT_STREAMING_AGENT", payload: null });
      return;
    }
    if (event === "swarm_director_start") {
      dispatch({ type: "SET_CURRENT_STREAMING_AGENT", payload: "Director" });
      return;
    }
    if (event === "swarm_director_done") {
      const plan = data?.plan || "";
      const orders = data?.orders || [];
      const ordersText = orders.length
        ? "\n\nOrders: " + orders.map((o: any) => `${o.agent_name}: ${(o.task || "").slice(0, 80)}...`).join("; ")
        : "";
      const id = nanoid();
      currentMessageId = id;
      dispatch({
        type: "ADD_MESSAGE",
        payload: { id, content: plan + ordersText, role: "ai" as const, agentName: "Director", error: null } as Message,
      });
      return;
    }
    if (event === "swarm_agent_start") {
      const name = agentName || "Agent";
      dispatch({ type: "SET_CURRENT_STREAMING_AGENT", payload: name });
      currentAgentName = name;
      currentContent = "";
      currentMessageId = nanoid();
      dispatch({
        type: "ADD_MESSAGE",
        payload: { id: currentMessageId, content: "", role: "ai" as const, agentName: name, error: null } as Message,
      });
      return;
    }
    if (event === "swarm_chat_model_stream" && currentMessageId) {
      const chunk = typeof data === "string" ? data : "";
      currentContent += chunk;
      dispatch({ type: "EDIT_MESSAGE", payload: { id: currentMessageId, content: currentContent, agentName: currentAgentName ?? undefined } });
      return;
    }
    // Backend may send ("stream", agent_name, chunk, is_final) as event "stream"
    if (event === "stream") {
      const name = (obj.agentName as string) || agentName || "Agent";
      const chunk = typeof data === "string" ? data : "";
      const isFinal = obj.is_final === true;
      if (!currentMessageId) {
        dispatch({ type: "SET_CURRENT_STREAMING_AGENT", payload: name });
        currentAgentName = name;
        currentContent = chunk;
        currentMessageId = nanoid();
        dispatch({
          type: "ADD_MESSAGE",
          payload: { id: currentMessageId, content: currentContent, role: "ai" as const, agentName: name, error: null } as Message,
        });
      } else {
        currentContent += chunk;
        dispatch({ type: "EDIT_MESSAGE", payload: { id: currentMessageId, content: currentContent, agentName: currentAgentName ?? undefined } });
      }
      if (isFinal) {
        dispatch({ type: "SET_CURRENT_STREAMING_AGENT", payload: null });
        currentMessageId = null;
        currentAgentName = null;
        currentContent = "";
      }
      return;
    }
    if (event === "swarm_agent_end") {
      dispatch({ type: "SET_CURRENT_STREAMING_AGENT", payload: null });
      currentMessageId = null;
      currentAgentName = null;
      currentContent = "";
      return;
    }
    if (event === "swarm_loop_end" || event === "swarm_run_end") {
      dispatch({ type: "SET_CURRENT_STREAMING_AGENT", payload: null });
      return;
    }
    if (event === "error") {
      const err = data?.message || data?.error || "Unknown error";
      if (currentMessageId) {
        dispatch({ type: "EDIT_MESSAGE", payload: { id: currentMessageId, error: { error: "Error", message: err }, content: err } });
      }
      dispatch({ type: "SET_CURRENT_STREAMING_AGENT", payload: null });
      return;
    }
  };

  function tryParseAndDispatch(str: string): string {
    let rest = str.trim();
    while (rest) {
      const trimmed = rest.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("data:")) {
        const after = trimmed.slice(5).trim();
        const end = after.indexOf("}");
        if (end === -1) return rest;
        try {
          const parsed = JSON.parse(after.slice(0, end + 1));
          dispatchEvent(parsed);
          rest = after.slice(end + 1);
          continue;
        } catch (_) {
          return rest;
        }
      }
      let depth = 0;
      let inString = false;
      let escape = false;
      let i = 0;
      for (; i < trimmed.length; i++) {
        const c = trimmed[i];
        if (escape) {
          escape = false;
          continue;
        }
        if (c === "\\" && inString) {
          escape = true;
          continue;
        }
        if ((c === '"' || c === "'") && !escape) inString = !inString;
        if (!inString) {
          if (c === "{") depth++;
          else if (c === "}") {
            depth--;
            if (depth === 0) {
              try {
                const parsed = JSON.parse(trimmed.slice(0, i + 1));
                dispatchEvent(parsed);
                rest = trimmed.slice(i + 1);
                continue;
              } catch (_) {
                return rest;
              }
            }
        }
      }
    }
    }
    return rest;
  }

  return readStreamToEnd(reader, decoder, tryParseAndDispatch);
}
