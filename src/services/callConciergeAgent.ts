import { Action } from "@/app/dashboard/concierge-chat/chat-session-reducer";
import { nanoid } from "@/shared/utils";
import React from "react";

export interface ConciergeCallbacks {
  onAudioChunk?: (base64Audio: string) => void;
  onAudioStart?: () => void;
  onAudioEnd?: () => void;
}

/**
 * Call the concierge streaming endpoint that orchestrates both
 * agent text streaming and TTS audio streaming in parallel
 */
export async function callConciergeAgent(
  agentId: string,
  sessionId: string,
  prompt: string,
  dispatch: React.Dispatch<Action>,
  abortController?: AbortController,
  callbacks?: ConciergeCallbacks
): Promise<void> {
  console.log(
    "Starting Concierge call with agentId:",
    agentId,
    "sessionId:",
    sessionId
  );

  const aiMessageId = nanoid();
  let accContent = "";
  let accumulatedToolCalls: any[] = [];
  let currentToolCall: any = null;
  let audioStarted = false;

  // Create the AI message immediately
  dispatch({
    type: "ADD_MESSAGE",
    payload: {
      id: aiMessageId,
      content: "",
      role: "ai",
      error: null,
    },
  });

  dispatch({ type: "SET_COMPLETION_LOADING", payload: true });

  try {
    const response = await fetch("/api/concierge-stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agentId,
        sessionId,
        prompt,
      }),
      credentials: "include",
      signal: abortController?.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Concierge API error: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        console.log("Concierge stream complete");
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // Process SSE events
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === "text") {
              // Handle text events from agent
              if (event.event === "on_chat_model_stream" && event.data) {
                accContent += event.data;
                dispatch({
                  type: "EDIT_MESSAGE",
                  payload: {
                    id: aiMessageId,
                    content: accContent,
                  },
                });
              } else if (event.event === "on_tool_start") {
                // Extract tool information - check multiple possible locations
                // (agent API may structure data differently)
                const toolName =
                  event.name ||
                  event.tool_name ||
                  event.data?.name ||
                  event.data?.tool_name ||
                  (typeof event.data === "string" ? event.data : null) ||
                  "unknown_tool";

                const toolInput =
                  event.input ||
                  event.tool_input ||
                  event.data?.input ||
                  event.data?.tool_input ||
                  event.data?.query ||
                  {};

                const toolType =
                  event.toolType ||
                  event.tool_type ||
                  event.data?.toolType ||
                  event.data?.tool_type ||
                  "unknown";

                console.log("[Concierge] Tool start:", { toolName, toolType, toolInput });

                currentToolCall = {
                  toolType,
                  toolName,
                  input: typeof toolInput === "object" ? toolInput : { query: toolInput },
                  output: null,
                  startTime: Date.now(),
                };

                dispatch({ type: "SET_CURRENT_TOOL", payload: toolName });
              } else if (event.event === "on_tool_end") {
                const toolOutput =
                  event.output ||
                  event.data?.output ||
                  event.data ||
                  {};

                if (currentToolCall) {
                  const completedToolCall = {
                    ...currentToolCall,
                    output: typeof toolOutput === "object" ? toolOutput : { result: toolOutput },
                    endTime: Date.now(),
                  };
                  accumulatedToolCalls = [...accumulatedToolCalls, completedToolCall];
                  dispatch({
                    type: "EDIT_MESSAGE",
                    payload: {
                      id: aiMessageId,
                      toolCalls: accumulatedToolCalls,
                    },
                  });
                  currentToolCall = null;
                }
                dispatch({ type: "SET_CURRENT_TOOL", payload: "" });
              } else if (event.event === "on_chain_end") {
                // Final content
                if (event.data) {
                  dispatch({
                    type: "EDIT_MESSAGE",
                    payload: {
                      id: aiMessageId,
                      content: event.data,
                    },
                  });
                }
                if (accumulatedToolCalls.length > 0) {
                  dispatch({
                    type: "EDIT_MESSAGE",
                    payload: {
                      id: aiMessageId,
                      toolCalls: accumulatedToolCalls,
                    },
                  });
                }
              } else if (event.event === "error") {
                dispatch({
                  type: "EDIT_MESSAGE",
                  payload: {
                    id: aiMessageId,
                    error: {
                      error: event.data?.error || "Unknown error",
                      message: event.data?.message || "An error occurred",
                      timestamp: Date.now(),
                    },
                  },
                });
              }
            } else if (event.type === "audio") {
              // Handle audio chunks
              if (!audioStarted) {
                audioStarted = true;
                callbacks?.onAudioStart?.();
                dispatch({ type: "SET_TTS_LOADING", payload: true });
              }
              callbacks?.onAudioChunk?.(event.data);
            } else if (event.type === "text_done") {
              console.log("Text streaming complete");
              dispatch({ type: "SET_COMPLETION_LOADING", payload: false });
            } else if (event.type === "audio_done") {
              console.log("Audio streaming complete");
              callbacks?.onAudioEnd?.();
              dispatch({ type: "SET_TTS_LOADING", payload: false });
            } else if (event.type === "error") {
              console.error("Stream error:", event.data);
              dispatch({
                type: "EDIT_MESSAGE",
                payload: {
                  id: aiMessageId,
                  error: {
                    error: "Stream error",
                    message: event.data || "An error occurred",
                    timestamp: Date.now(),
                  },
                },
              });
            }
          } catch (e) {
            console.warn("Error parsing SSE event:", e, line);
          }
        }
      }
    }
  } catch (error) {
    dispatch({ type: "SET_COMPLETION_LOADING", payload: false });
    dispatch({ type: "SET_TTS_LOADING", payload: false });

    if (error instanceof Error && error.name === "AbortError") {
      console.log("Concierge request aborted");
      return;
    }

    console.error("Concierge error:", error);
    dispatch({
      type: "EDIT_MESSAGE",
      payload: {
        id: aiMessageId,
        error: {
          error: "Request failed",
          message: error instanceof Error ? error.message : "Unknown error",
          timestamp: Date.now(),
        },
        content: accContent || "Error occurred while processing your request.",
      },
    });
  }
}
