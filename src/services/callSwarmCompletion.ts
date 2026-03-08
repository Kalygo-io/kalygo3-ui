/**
 * Call LangGraph swarm completion endpoint. Streams SSE and invokes callbacks for messages/loading.
 * POST /api/swarms/langgraph/completion with { prompt, sessionId, swarm: { supervisor, workers, outputMode } }.
 */
import { nanoid, getCookie } from "@/shared/utils";
import type { Message } from "@/ts/types/Message";

const BASE_URL =
  process.env.NEXT_PUBLIC_COMPLETION_API_URL ||
  process.env.NEXT_PUBLIC_AI_API_URL ||
  "http://127.0.0.1:4000";
const PATH =
  process.env.NEXT_PUBLIC_SWARM_COMPLETION_PATH ||
  "/api/swarms/langgraph/completion";
const TIMEOUT_MS = 120_000;

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

export interface SwarmCallbacks {
  addMessage: (msg: Message) => void;
  editMessage: (id: string, update: { content?: string; error?: Message["error"] }) => void;
  setLoading: (loading: boolean) => void;
}

export async function callSwarmCompletion(
  sessionId: string,
  prompt: string,
  swarm: SwarmPayload,
  callbacks: SwarmCallbacks,
  abortController?: AbortController
): Promise<void> {
  const url = `${BASE_URL}${PATH.startsWith("/") ? "" : "/"}${PATH}`;
  const jwt = typeof document !== "undefined" ? getCookie("jwt") : null;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (jwt) headers["Authorization"] = `Bearer ${jwt}`;

  const streamController = new AbortController();
  const timeoutId = setTimeout(() => streamController.abort(), TIMEOUT_MS);
  if (abortController?.signal) {
    abortController.signal.addEventListener("abort", () => {
      clearTimeout(timeoutId);
      streamController.abort();
    });
  }

  let resp: Response;
  try {
    resp = await fetch(url, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({ sessionId, prompt, swarm }),
      signal: streamController.signal,
    });
  } catch (e) {
    clearTimeout(timeoutId);
    callbacks.setLoading(false);
    throw e;
  }

  if (!resp.ok) {
    clearTimeout(timeoutId);
    const text = await resp.text();
    callbacks.setLoading(false);
    throw new Error(`Swarm completion failed: ${resp.status} - ${text}`);
  }

  const reader = resp.body?.getReader();
  if (!reader) {
    clearTimeout(timeoutId);
    callbacks.setLoading(false);
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let currentId: string | null = null;
  let currentContent = "";
  const { addMessage, editMessage, setLoading } = callbacks;

  const dispatch = (obj: Record<string, unknown>) => {
    const event = String(obj.event ?? "");
    const data = obj.data;
    const agentName = obj.agentName as string | undefined;

    if (event === "swarm_director_done" || event === "swarm_supervisor_done") {
      const plan = (data as { plan?: string })?.plan ?? "";
      const orders = ((data as { orders?: { agent_name?: string; task?: string }[] })?.orders ?? []) as { agent_name?: string; task?: string }[];
      const ordersBlock =
        orders.length > 0
          ? "\n\n**Orders:**\n" +
            orders.map((o) => `- **${o.agent_name ?? "Agent"}**: ${o.task ?? ""}`).join("\n")
          : "";
      const content = (plan + ordersBlock).trim() || "Planning...";
      addMessage({
        id: nanoid(),
        content,
        role: "ai",
        error: null,
        agentName: "Director",
      });
      return;
    }
    if (event === "swarm_agent_start" || event === "swarm_director_start" || event === "swarm_supervisor_start") {
      const name = agentName ?? "Director";
      currentId = nanoid();
      currentContent = "";
      addMessage({
        id: currentId,
        content: "",
        role: "ai",
        error: null,
        agentName: name,
      });
      return;
    }
    if (event === "swarm_chat_model_stream" && currentId && typeof data === "string") {
      currentContent += data;
      editMessage(currentId, { content: currentContent });
      return;
    }
    if (event === "stream") {
      const name = (obj.agentName as string) ?? agentName ?? "Agent";
      const chunk = typeof data === "string" ? data : "";
      if (!currentId) {
        currentId = nanoid();
        currentContent = chunk;
        addMessage({
          id: currentId,
          content: currentContent,
          role: "ai",
          error: null,
          agentName: name,
        });
      } else {
        currentContent += chunk;
        editMessage(currentId, { content: currentContent });
      }
      if (obj.is_final === true) {
        currentId = null;
        currentContent = "";
      }
      return;
    }
    if (event === "swarm_agent_end") {
      currentId = null;
      currentContent = "";
      return;
    }
    if (event === "swarm_run_end") {
      const summary = (data as { summary?: string; message?: string })?.summary ?? (data as { summary?: string; message?: string })?.message;
      if (summary) {
        addMessage({
          id: nanoid(),
          content: `**Run complete**\n\n${summary}`,
          role: "ai",
          error: null,
          agentName: "Director",
        });
      }
      return;
    }
    if (event === "error") {
      const err = (data as { message?: string; error?: string })?.message ?? (data as { message?: string; error?: string })?.error ?? "Unknown error";
      if (currentId) editMessage(currentId, { content: String(err), error: { error: "Error", message: String(err) } });
      setLoading(false);
      return;
    }
    const genericContent = typeof data === "string" ? data : (obj.content ?? obj.message ?? (data as { content?: string; message?: string; text?: string })?.content ?? (data as { content?: string; message?: string; text?: string })?.message ?? (data as { content?: string; message?: string; text?: string })?.text);
    if (genericContent != null && String(genericContent).trim()) {
      addMessage({
        id: nanoid(),
        content: String(genericContent).trim(),
        role: "ai",
        error: null,
        agentName: "Director",
      });
    }
  };

  const tryParse = (str: string): string => {
    let rest = str.trim();
    while (rest) {
      const trimmed = rest.trim();
      if (!trimmed) return rest;
      if (trimmed.startsWith("data:")) {
        const after = trimmed.slice(5).trim();
        const end = after.indexOf("}");
        if (end === -1) return rest;
        try {
          const parsed = JSON.parse(after.slice(0, end + 1)) as Record<string, unknown>;
          dispatch(parsed);
          rest = after.slice(end + 1);
          continue;
        } catch {
          return rest;
        }
      }
      let depth = 0;
      let i = 0;
      for (; i < trimmed.length; i++) {
        const c = trimmed[i];
        if (c === "{") depth++;
        else if (c === "}") {
          depth--;
          if (depth === 0) {
            try {
              const parsed = JSON.parse(trimmed.slice(0, i + 1)) as Record<string, unknown>;
              dispatch(parsed);
              rest = trimmed.slice(i + 1);
              continue;
            } catch {
              return rest;
            }
          }
        }
      }
      return rest;
    }
    return rest;
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      buffer = tryParse(buffer);
    }
  } catch (e) {
    if ((e as Error).name !== "AbortError") {
      callbacks.setLoading(false);
      throw e;
    }
  } finally {
    reader.releaseLock();
    clearTimeout(timeoutId);
    setLoading(false);
  }
}
