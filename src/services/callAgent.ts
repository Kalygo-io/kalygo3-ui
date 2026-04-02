import { Action } from "@/app/dashboard/agent-chat/chat-session-reducer";
import { nanoid } from "@/shared/utils";
import React from "react";

// PDF attachment options
export interface PdfAttachment {
  file: File;
  useVision?: boolean; // false = text extraction (default), true = vision mode
}

// Helper to convert File to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
}

/**
 * Extracts a plain string from the various shapes that `data` can arrive in
 * depending on the LLM provider:
 *   - OpenAI / legacy: plain string
 *   - Anthropic: content-blocks array [{ type: "text", text: "...", index: 0 }]
 */
function extractTextContent(data: unknown): string {
  if (typeof data === "string") return data;
  if (Array.isArray(data)) {
    return data
      .filter((block: any) => block?.type === "text")
      .map((block: any) => block?.text ?? "")
      .join("");
  }
  return "";
}

/**
 * Scans `buffer` for the next complete, top-level JSON object ({...}).
 * Returns the parsed value and the remaining unprocessed string, or null if
 * no complete object is available yet (caller should wait for more data).
 *
 * This handles the case where a single JSON object spans multiple TCP reads,
 * which would otherwise silently drop large payloads (e.g. on_chain_end with
 * full vector-search results).
 */
function extractNextJsonObject(
  buffer: string
): { parsed: any; remaining: string } | null {
  // Find the first opening brace
  const start = buffer.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inStr = false;
  let esc = false;

  for (let i = start; i < buffer.length; i++) {
    const c = buffer[i];
    if (esc) { esc = false; continue; }
    if (c === "\\" && inStr) { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;

    if (c === "{") {
      depth++;
    } else if (c === "}") {
      if (--depth === 0) {
        const jsonStr = buffer.slice(start, i + 1);
        try {
          return { parsed: JSON.parse(jsonStr), remaining: buffer.slice(i + 1) };
        } catch {
          // Malformed JSON at this position – skip past this brace and keep scanning
          return null;
        }
      }
    }
  }

  // Incomplete JSON: keep the buffer from `start` so the prefix before the
  // opening brace (e.g. whitespace) is discarded but the partial object is kept.
  return null;
}

export async function callAgent(
  agentId: string,
  sessionId: string,
  prompt: string,
  dispatch: React.Dispatch<Action>,
  abortController?: AbortController,
  pdfAttachment?: PdfAttachment,
) {
  console.log(
    `[callAgent] agentId=${agentId} sessionId=${sessionId}${pdfAttachment ? ` pdf=${pdfAttachment.file.name}` : ""}`,
  );

  // Build request body
  const requestBody: Record<string, any> = {
    sessionId: sessionId,
    prompt: prompt,
  };

  if (pdfAttachment) {
    const pdfBase64 = await fileToBase64(pdfAttachment.file);
    requestBody.pdf = pdfBase64;
    requestBody.pdfFilename = pdfAttachment.file.name;
    requestBody.pdfUseVision = pdfAttachment.useVision ?? false;
  }

  const resp = await fetch(
    `${process.env.NEXT_PUBLIC_COMPLETION_API_URL}/api/agents/${encodeURIComponent(agentId)}/stream`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      credentials: "include",
      signal: abortController?.signal,
    },
  );

  if (!resp.ok) {
    const errorText = await resp.text();
    console.error("Response not OK:", resp.status, errorText);
    throw `Network response was not OK: ${resp.status} - ${errorText}`;
  }

  const reader = resp?.body?.getReader();
  if (!reader) {
    throw new Error("Failed to get response reader");
  }
  // stream: true preserves multi-byte UTF-8 characters that span chunk boundaries
  const decoder = new TextDecoder("utf-8", { fatal: false });

  const aiMessageId = nanoid();
  const accMessage = { content: "" };

  // Accumulated tool calls keyed by run_id while tools are pending, then
  // replaced with the formatted output when on_tool_end arrives.
  // Using an object so handleEvent can mutate it by reference.
  const pendingToolCalls: Record<string, any> = {}; // run_id -> pending entry
  let accumulatedToolCalls: any[] = [];

  // Persistent parse buffer – survives across reader.read() calls so large
  // JSON objects (e.g. on_chain_end with full results) are never dropped.
  let parseBuffer = "";

  dispatch({
    type: "ADD_MESSAGE",
    payload: {
      id: aiMessageId,
      content: "",
      role: "ai",
      error: null,
    },
  });

  try {
    while (true) {
      if (abortController?.signal.aborted) break;

      const { done, value } = await reader.read();
      if (done) break;

      parseBuffer += decoder.decode(value, { stream: true });

      // Drain all complete JSON objects from the buffer
      let extracted: ReturnType<typeof extractNextJsonObject>;
      while ((extracted = extractNextJsonObject(parseBuffer)) !== null) {
        parseBuffer = extracted.remaining;
        const result = handleEvent(
          extracted.parsed,
          dispatch,
          aiMessageId,
          accMessage,
          pendingToolCalls,
          accumulatedToolCalls,
        );
        if (result !== undefined) {
          accumulatedToolCalls = result;
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }
    console.error("[callAgent] Streaming error:", error);
    throw error;
  } finally {
    // Flush any remaining bytes held by the streaming decoder
    decoder.decode();
    if (reader) {
      reader.releaseLock();
    }
  }
}

/**
 * Processes a single parsed SSE event and updates React state via dispatch.
 * Returns the updated accumulatedToolCalls array when tool calls change,
 * or undefined otherwise.
 */
function handleEvent(
  event: Record<string, any>,
  dispatch: React.Dispatch<Action>,
  aiMessageId: string,
  accMessage: { content: string },
  pendingToolCalls: Record<string, any>,
  accumulatedToolCalls: any[],
): any[] | undefined {
  try {
    const eventType = event.event;
    const data = event.data;
    const runId: string = event.run_id ?? "";

    if (eventType === "on_chat_model_stream") {
      accMessage.content += extractTextContent(data);
      dispatch({
        type: "EDIT_MESSAGE",
        payload: { id: aiMessageId, content: accMessage.content },
      });

    } else if (eventType === "on_chain_end") {
      // Update final content
      const finalContent = extractTextContent(data) || accMessage.content;
      dispatch({
        type: "EDIT_MESSAGE",
        payload: { id: aiMessageId, content: finalContent },
      });

      // on_chain_end carries the authoritative server-formatted toolCalls list.
      // Use it to replace any accumulated state (handles edge cases where an
      // on_tool_end event was missed or formatted differently).
      const serverToolCalls: any[] | undefined = event.toolCalls;
      if (serverToolCalls && serverToolCalls.length > 0) {
        dispatch({
          type: "EDIT_MESSAGE",
          payload: { id: aiMessageId, toolCalls: serverToolCalls },
        });
        return serverToolCalls;
      }

    } else if (eventType === "on_tool_start") {
      // Show this tool as "pending" in the drawer immediately so the user
      // can see the tool name and its input parameters before results arrive.
      const toolName: string = data?.name ?? "unknown_tool";
      const toolInput: Record<string, any> = data?.input ?? {};

      const pendingEntry = {
        toolName,
        input: toolInput,
        output: null,
        _pending: true,
        _runId: runId,
      };

      pendingToolCalls[runId] = pendingEntry;
      const updated = [...accumulatedToolCalls, pendingEntry];

      dispatch({ type: "SET_CURRENT_TOOL", payload: toolName });
      dispatch({
        type: "EDIT_MESSAGE",
        payload: { id: aiMessageId, toolCalls: updated },
      });
      return updated;

    } else if (eventType === "on_tool_end") {
      dispatch({ type: "SET_CURRENT_TOOL", payload: "" });

      // data is the backend-formatted tool call object (v2 schema), or null
      // if the call was skipped (e.g. embedding error).
      const formattedCall: any | null = data ?? null;

      // Replace the matching pending entry, falling back to appending.
      let updated: any[];
      const pendingIdx = accumulatedToolCalls.findIndex(
        (tc) => tc._pending && tc._runId === runId,
      );

      if (formattedCall) {
        if (pendingIdx !== -1) {
          updated = [
            ...accumulatedToolCalls.slice(0, pendingIdx),
            formattedCall,
            ...accumulatedToolCalls.slice(pendingIdx + 1),
          ];
        } else {
          updated = [...accumulatedToolCalls, formattedCall];
        }
      } else {
        // Tool failed / was skipped — remove the pending placeholder
        updated =
          pendingIdx !== -1
            ? [
                ...accumulatedToolCalls.slice(0, pendingIdx),
                ...accumulatedToolCalls.slice(pendingIdx + 1),
              ]
            : accumulatedToolCalls;
      }

      delete pendingToolCalls[runId];

      if (updated.length > 0) {
        dispatch({
          type: "EDIT_MESSAGE",
          payload: { id: aiMessageId, toolCalls: updated },
        });
      }
      return updated;

    } else if (eventType === "error") {
      const errorData = event.data || {};
      console.error("[callAgent] Agent error:", errorData);
      dispatch({
        type: "EDIT_MESSAGE",
        payload: {
          id: aiMessageId,
          error: {
            error: errorData.error || "Unknown error",
            message: errorData.message || "An error occurred",
            timestamp: Date.now(),
            stack: errorData.stack,
          },
          content: accMessage.content || "Error occurred while processing your request.",
        },
      });
      dispatch({ type: "SET_CURRENT_TOOL", payload: "" });

    } else if (eventType === "tool_approval_required") {
      const { approval_id, tool_type, preview } = event.data || {};
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          id: `approval-${approval_id}`,
          content: "",
          role: "tool_approval",
          error: null,
          toolApproval: {
            approvalId: approval_id,
            toolType: tool_type,
            preview,
          },
        },
      });
    }
  } catch (err) {
    console.error("[callAgent] Error in handleEvent:", err, event);
  }
  return undefined;
}
