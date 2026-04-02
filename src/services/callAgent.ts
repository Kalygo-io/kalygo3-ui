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
      // Remove the data URL prefix to get raw base64
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
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
  let accMessage = {
    content: "",
  };
  let retrievalCalls: any[] = [];

  // Accumulate tool calls from stream events
  let accumulatedToolCalls: any[] = [];
  let currentToolCall: any = null;

  // Create the AI message immediately so EDIT_MESSAGE never races ADD_MESSAGE
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

      // stream: true handles multi-byte characters that span chunk boundaries
      let chunk = decoder.decode(value, { stream: true });

      try {
        const parsedChunk = JSON.parse(chunk);
        const result = dispatchEventToState(
          parsedChunk,
          dispatch,
          aiMessageId,
          accMessage,
          retrievalCalls,
          accumulatedToolCalls,
          currentToolCall,
        );
        // Update currentToolCall reference if returned
        if (result?.currentToolCall !== undefined) {
          currentToolCall = result.currentToolCall;
        }
        if (result?.accumulatedToolCalls) {
          accumulatedToolCalls = result.accumulatedToolCalls;
        }
      } catch (e) {
        // Chunk contains multiple concatenated JSON objects — parse them one by one
        let multiChunkAcc = "";
        let idx = 0;
        let braceCount = 0;
        let inString = false;
        let escapeNext = false;

        while (idx < chunk.length) {
          const char = chunk[idx];

          if (escapeNext) {
            multiChunkAcc += char;
            escapeNext = false;
          } else if (char === "\\") {
            multiChunkAcc += char;
            escapeNext = true;
          } else if (char === '"' && !escapeNext) {
            multiChunkAcc += char;
            inString = !inString;
          } else if (!inString) {
            if (char === "{") {
              braceCount++;
            } else if (char === "}") {
              braceCount--;
            }
            multiChunkAcc += char;

            // Try to parse when we have a complete JSON object
            if (braceCount === 0 && multiChunkAcc.trim()) {
              try {
                const parsedChunk = JSON.parse(multiChunkAcc.trim());
                const result = dispatchEventToState(
                  parsedChunk,
                  dispatch,
                  aiMessageId,
                  accMessage,
                  retrievalCalls,
                  accumulatedToolCalls,
                  currentToolCall,
                );
                // Update currentToolCall reference if returned
                if (result?.currentToolCall !== undefined) {
                  currentToolCall = result.currentToolCall;
                }
                if (result?.accumulatedToolCalls) {
                  accumulatedToolCalls = result.accumulatedToolCalls;
                }

                // Move to next character after the parsed JSON
                chunk = chunk.substring(idx + 1);
                idx = 0;
                multiChunkAcc = "";
                braceCount = 0;
                continue;
              } catch (parseError) {
                // Continue accumulating if this isn't valid JSON yet
              }
            }
          } else {
            multiChunkAcc += char;
          }

          idx++;
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

function dispatchEventToState(
  parsedChunk: Record<string, any>,
  dispatch: React.Dispatch<Action>,
  aiMessageId: string,
  accMessage: { content: string },
  retrievalCalls: any[],
  accumulatedToolCalls: any[],
  currentToolCall: any,
): { currentToolCall: any; accumulatedToolCalls: any[] } | void {
  try {
    // Only handle essential events to isolate the issue
    if (parsedChunk.event === "on_chat_model_start") {
      // Message already created upfront before stream processing
    } else if (parsedChunk.event === "on_chat_model_stream") {
      accMessage.content += extractTextContent(parsedChunk.data);
      dispatch({
        type: "EDIT_MESSAGE",
        payload: {
          id: aiMessageId,
          content: accMessage.content,
        },
      });
    } else if (parsedChunk.event === "on_chain_end") {
      const finalContent = extractTextContent(parsedChunk.data) || accMessage.content;
      dispatch({
        type: "EDIT_MESSAGE",
        payload: {
          id: aiMessageId,
          content: finalContent,
        },
      });

      // Check multiple possible locations for toolCalls (new schema)
      const toolCallsData =
        parsedChunk.toolCalls || // Direct property
        parsedChunk.data?.toolCalls || // Nested in data
        parsedChunk.tool_calls || // Snake case variant
        parsedChunk.data?.tool_calls || // Snake case in data
        null;

      // Check for legacy retrieval_calls
      const retrievalCallsData =
        parsedChunk.retrieval_calls ||
        parsedChunk.data?.retrieval_calls ||
        null;

      if (toolCallsData && Array.isArray(toolCallsData)) {
        try {
          dispatch({
            type: "EDIT_MESSAGE",
            payload: { id: aiMessageId, toolCalls: toolCallsData },
          });
        } catch (error) {
          console.error("[callAgent] Error processing tool calls:", error);
        }
      } else if (accumulatedToolCalls.length > 0) {
        try {
          dispatch({
            type: "EDIT_MESSAGE",
            payload: { id: aiMessageId, toolCalls: accumulatedToolCalls },
          });
        } catch (error) {
          console.error("[callAgent] Error processing accumulated tool calls:", error);
        }
      } else if (retrievalCallsData && Array.isArray(retrievalCallsData)) {
        try {
          dispatch({
            type: "EDIT_MESSAGE",
            payload: { id: aiMessageId, retrievalCalls: retrievalCallsData },
          });
        } catch (error) {
          console.error("[callAgent] Error processing retrieval calls:", error);
        }
      }
    } else if (parsedChunk.event === "on_tool_start") {
      try {
        const toolName =
          parsedChunk.name ||
          parsedChunk.tool_name ||
          parsedChunk.data?.name ||
          parsedChunk.data?.tool_name ||
          (typeof parsedChunk.data === "string" ? parsedChunk.data : null) ||
          "unknown_tool";

        const toolInput =
          parsedChunk.input ||
          parsedChunk.tool_input ||
          parsedChunk.data?.input ||
          parsedChunk.data?.tool_input ||
          parsedChunk.data?.query ||
          {};

        // Get tool type from event data (backend provides this)
        const toolType =
          parsedChunk.toolType ||
          parsedChunk.tool_type ||
          parsedChunk.data?.toolType ||
          parsedChunk.data?.tool_type ||
          "unknown"; // Default fallback only if backend doesn't provide

        const newToolCall = {
          toolType: toolType,
          toolName: toolName,
          input:
            typeof toolInput === "object" ? toolInput : { query: toolInput },
          output: null,
          startTime: Date.now(),
        };

        dispatch({ type: "SET_CURRENT_TOOL", payload: toolName });

        return {
          currentToolCall: newToolCall,
          accumulatedToolCalls: accumulatedToolCalls,
        };
      } catch (error) {
        console.error("[callAgent] Error handling tool start:", error);
      }
    } else if (parsedChunk.event === "on_tool_end") {
      try {
        const toolOutput =
          parsedChunk.output ||
          parsedChunk.tool_output ||
          parsedChunk.data?.output ||
          parsedChunk.data?.tool_output ||
          parsedChunk.data?.results ||
          parsedChunk.data ||
          {};

        if (currentToolCall) {
          const completedToolCall = {
            ...currentToolCall,
            output:
              typeof toolOutput === "object"
                ? toolOutput
                : { result: toolOutput },
            endTime: Date.now(),
          };

          const updatedToolCalls = [...accumulatedToolCalls, completedToolCall];

          dispatch({
            type: "EDIT_MESSAGE",
            payload: { id: aiMessageId, toolCalls: updatedToolCalls },
          });
          dispatch({ type: "SET_CURRENT_TOOL", payload: "" });

          return {
            currentToolCall: null,
            accumulatedToolCalls: updatedToolCalls,
          };
        } else {
          const toolName =
            parsedChunk.name ||
            parsedChunk.tool_name ||
            parsedChunk.data?.name ||
            "unknown_tool";

          // Get tool type from event data (backend provides this)
          const toolType =
            parsedChunk.toolType ||
            parsedChunk.tool_type ||
            parsedChunk.data?.toolType ||
            parsedChunk.data?.tool_type ||
            "unknown"; // Default fallback only if backend doesn't provide

          const newCompletedToolCall = {
            toolType: toolType,
            toolName: toolName,
            input: {},
            output:
              typeof toolOutput === "object"
                ? toolOutput
                : { result: toolOutput },
            endTime: Date.now(),
          };

          const updatedToolCalls = [
            ...accumulatedToolCalls,
            newCompletedToolCall,
          ];

          dispatch({
            type: "EDIT_MESSAGE",
            payload: { id: aiMessageId, toolCalls: updatedToolCalls },
          });
          dispatch({ type: "SET_CURRENT_TOOL", payload: "" });

          return {
            currentToolCall: null,
            accumulatedToolCalls: updatedToolCalls,
          };
        }
      } catch (error) {
        console.error("[callAgent] Error handling tool end:", error);
      }
    } else if (parsedChunk.event === "error") {
      try {
        const errorData = parsedChunk.data || {};
        const errorDetails = {
          error: errorData.error || "Unknown error",
          message: errorData.message || "An error occurred",
          timestamp: Date.now(),
          stack: errorData.stack,
        };

        console.error("[callAgent] Agent error:", errorDetails);

        dispatch({
          type: "EDIT_MESSAGE",
          payload: {
            id: aiMessageId,
            error: errorDetails,
            content:
              accMessage.content ||
              "Error occurred while processing your request.",
          },
        });
        dispatch({ type: "SET_CURRENT_TOOL", payload: "" });
      } catch (error) {
        console.error("[callAgent] Error handling error event:", error);
      }
    } else if (parsedChunk.event === "tool_approval_required") {
      try {
        const { approval_id, tool_type, preview } = parsedChunk.data || {};

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
      } catch (error) {
        console.error("[callAgent] Error handling tool_approval_required:", error);
      }
    }
  } catch (error) {
    console.error("Error in dispatchEventToState:", error, parsedChunk);
  }
}
