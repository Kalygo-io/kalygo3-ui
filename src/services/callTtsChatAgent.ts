import { Action } from "@/app/dashboard/tts-chat/chat-session-reducer";
import { nanoid } from "@/shared/utils";
import React from "react";

export interface TtsChatCallbacks {
  onAudioChunk?: (base64Audio: string) => void;
  onAudioStart?: () => void;
  onAudioEnd?: () => void;
}

/**
 * Call the TTS chat streaming endpoint that orchestrates both
 * agent text streaming and TTS audio streaming in parallel
 */
export async function callTtsChatAgent(
  agentId: string,
  sessionId: string,
  prompt: string,
  dispatch: React.Dispatch<Action>,
  abortController?: AbortController,
  callbacks?: TtsChatCallbacks,
  voiceId?: string
): Promise<void> {
  console.log(
    "Starting TTS Chat call with agentId:",
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
    const response = await fetch("/api/tts-chat-stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agentId,
        sessionId,
        prompt,
        ...(voiceId ? { voiceId } : {}),
      }),
      credentials: "include",
      signal: abortController?.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TTS Chat API error: ${response.status} - ${errorText}`);
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
        console.log("TTS Chat stream complete");
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
                console.log("[TTS Chat] Tool start - raw event:", JSON.stringify(event));
                
                // Extract tool information - check ALL possible locations
                const toolName =
                  event.name ||
                  event.tool_name ||
                  event.data?.name ||
                  event.data?.tool_name ||
                  (typeof event.data === "string" ? event.data : null) ||
                  "unknown_tool";

                // For input, check various locations and also check if the entire event data is the input
                let toolInput =
                  event.input ||
                  event.tool_input ||
                  event.data?.input ||
                  event.data?.tool_input ||
                  {};
                
                // If input has a query, use it; otherwise check if data itself has query
                if (!toolInput.query && event.data?.query) {
                  toolInput = { query: event.data.query, ...toolInput };
                }

                const toolType =
                  event.toolType ||
                  event.tool_type ||
                  event.data?.toolType ||
                  event.data?.tool_type ||
                  "unknown";

                console.log("[TTS Chat] Tool start - extracted:", { toolName, toolType, toolInput });

                currentToolCall = {
                  toolType,
                  toolName,
                  input: typeof toolInput === "object" ? toolInput : { query: toolInput },
                  output: null,
                  startTime: Date.now(),
                };

                dispatch({ type: "SET_CURRENT_TOOL", payload: toolName });
              } else if (event.event === "on_tool_end") {
                console.log("[TTS Chat] Tool end - raw event:", JSON.stringify(event));
                
                // Extract tool output - check ALL possible locations
                // The agent API may return results in various structures
                let toolOutput: any = null;
                
                // Check for output/results at top level
                if (event.output) {
                  toolOutput = event.output;
                } else if (event.results) {
                  toolOutput = { results: event.results };
                } else if (event.tool_output) {
                  toolOutput = event.tool_output;
                }
                // Check in data object
                else if (event.data) {
                  if (event.data.output) {
                    toolOutput = event.data.output;
                  } else if (event.data.results) {
                    toolOutput = { results: event.data.results };
                  } else if (event.data.tool_output) {
                    toolOutput = event.data.tool_output;
                  } else if (Array.isArray(event.data)) {
                    // Data itself might be the results array
                    toolOutput = { results: event.data };
                  } else if (typeof event.data === "object") {
                    // Data might be the output object itself
                    toolOutput = event.data;
                  }
                }
                
                // Fallback
                if (!toolOutput) {
                  toolOutput = {};
                }

                console.log("[TTS Chat] Tool end - extracted output:", toolOutput);

                if (currentToolCall) {
                  const completedToolCall = {
                    ...currentToolCall,
                    output: typeof toolOutput === "object" ? toolOutput : { result: toolOutput },
                    endTime: Date.now(),
                  };
                  
                  console.log("[TTS Chat] Completed tool call:", completedToolCall);
                  
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
                console.log("[TTS Chat] Chain end - raw event:", event);
                
                // Final content
                if (event.data && typeof event.data === "string") {
                  dispatch({
                    type: "EDIT_MESSAGE",
                    payload: {
                      id: aiMessageId,
                      content: event.data,
                    },
                  });
                }
                
                // Check for toolCalls in the chain_end event - this is where vector search results come!
                const toolCallsFromChainEnd = 
                  event.toolCalls || 
                  event.tool_calls || 
                  event.data?.toolCalls ||
                  event.data?.tool_calls ||
                  null;
                
                console.log("[TTS Chat] Chain end - toolCalls found:", toolCallsFromChainEnd ? toolCallsFromChainEnd.length : 0);
                
                if (toolCallsFromChainEnd && Array.isArray(toolCallsFromChainEnd) && toolCallsFromChainEnd.length > 0) {
                  console.log("[TTS Chat] Chain end - using toolCalls from chain_end event:", toolCallsFromChainEnd);
                  dispatch({
                    type: "EDIT_MESSAGE",
                    payload: {
                      id: aiMessageId,
                      toolCalls: toolCallsFromChainEnd,
                    },
                  });
                } else if (accumulatedToolCalls.length > 0) {
                  // Fall back to accumulated tool calls from on_tool_start/on_tool_end
                  console.log("[TTS Chat] Chain end - using accumulated tool calls:", accumulatedToolCalls);
                  dispatch({
                    type: "EDIT_MESSAGE",
                    payload: {
                      id: aiMessageId,
                      toolCalls: accumulatedToolCalls,
                    },
                  });
                }
                
                // Check for legacy retrieval_calls
                const retrievalCalls = event.retrieval_calls || event.data?.retrieval_calls;
                if (retrievalCalls && Array.isArray(retrievalCalls) && retrievalCalls.length > 0) {
                  console.log("[TTS Chat] Chain end - retrieval_calls found:", retrievalCalls);
                  dispatch({
                    type: "EDIT_MESSAGE",
                    payload: {
                      id: aiMessageId,
                      retrievalCalls: retrievalCalls,
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
                console.log("[TTS Client] First audio chunk received, calling onAudioStart");
                callbacks?.onAudioStart?.();
                dispatch({ type: "SET_TTS_LOADING", payload: true });
              }
              const dataLen = typeof event.data === "string" ? event.data.length : 0;
              console.log(`[TTS Client] Audio chunk received (${dataLen} base64 chars), calling onAudioChunk`);
              callbacks?.onAudioChunk?.(event.data);
            } else if (event.type === "text_done") {
              console.log("[TTS Client] text_done received");
              dispatch({ type: "SET_COMPLETION_LOADING", payload: false });
            } else if (event.type === "audio_done") {
              console.log("[TTS Client] audio_done received, calling onAudioEnd");
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
      console.log("TTS Chat request aborted");
      return;
    }

    console.error("TTS Chat error:", error);
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
