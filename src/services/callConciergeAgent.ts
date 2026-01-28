import { Action } from "@/app/dashboard/concierge-chat/chat-session-reducer";
import { nanoid } from "@/shared/utils";
import React from "react";

export interface ConciergeResult {
  finalContent: string;
  aiMessageId: string;
}

export async function callConciergeAgent(
  agentId: string,
  sessionId: string,
  prompt: string,
  dispatch: React.Dispatch<Action>,
  abortController?: AbortController,
): Promise<ConciergeResult> {
  console.log(
    "Starting Concierge Agent call with agentId:",
    agentId,
    "sessionId:",
    sessionId,
    "prompt:",
    prompt,
  );

  const resp = await fetch(
    `${process.env.NEXT_PUBLIC_AI_API_URL}/api/agents/${encodeURIComponent(agentId)}/completion`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId: sessionId,
        prompt: prompt,
      }),
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
  const decoder = new TextDecoder();

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

  console.log("Starting to read stream...");

  try {
    while (true) {
      // Check for cancellation before reading
      if (abortController?.signal.aborted) {
        console.log("Concierge request cancelled");
        break;
      }

      const { done, value } = await reader.read();
      if (done) {
        console.log("Stream complete");
        break;
      }

      let chunk = decoder.decode(value);

      try {
        const parsedChunk = JSON.parse(chunk);
        console.log("Parsed chunk:", parsedChunk);
        const result = dispatchEventToState(
          parsedChunk,
          dispatch,
          aiMessageId,
          accMessage,
          retrievalCalls,
          accumulatedToolCalls,
          currentToolCall,
        );
        if (result?.currentToolCall !== undefined) {
          currentToolCall = result.currentToolCall;
        }
        if (result?.accumulatedToolCalls) {
          accumulatedToolCalls = result.accumulatedToolCalls;
        }
      } catch (e) {
        // Multi-chunk parsing (same as callAgent)
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

            if (braceCount === 0 && multiChunkAcc.trim()) {
              try {
                const parsedChunk = JSON.parse(multiChunkAcc.trim());
                console.log("Parsed multi-chunk:", parsedChunk);

                const result = dispatchEventToState(
                  parsedChunk,
                  dispatch,
                  aiMessageId,
                  accMessage,
                  retrievalCalls,
                  accumulatedToolCalls,
                  currentToolCall,
                );
                if (result?.currentToolCall !== undefined) {
                  currentToolCall = result.currentToolCall;
                }
                if (result?.accumulatedToolCalls) {
                  accumulatedToolCalls = result.accumulatedToolCalls;
                }

                chunk = chunk.substring(idx + 1);
                idx = 0;
                multiChunkAcc = "";
                braceCount = 0;
                continue;
              } catch (parseError) {
                // Continue accumulating
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
      console.log("Concierge request aborted");
      throw error;
    }
    console.error("Error in streaming response:", error);
    throw error;
  } finally {
    if (reader) {
      reader.releaseLock();
    }
  }

  // Return the final content for TTS processing
  return {
    finalContent: accMessage.content,
    aiMessageId,
  };
}

/**
 * Fetch audio from TTS API
 */
export async function fetchTTS(
  text: string,
  dispatch: React.Dispatch<Action>,
  abortController?: AbortController,
): Promise<string> {
  console.log("Starting TTS request for text:", text.substring(0, 100) + "...");

  // Set TTS loading state
  dispatch({ type: "SET_TTS_LOADING", payload: true });
  if (abortController) {
    dispatch({ type: "SET_TTS_REQUEST", payload: abortController });
  }

  try {
    const response = await fetch("/api/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
      signal: abortController?.signal,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to generate speech");
    }

    // Get the audio blob from the streamed response
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    // Update state with audio URL
    dispatch({ type: "SET_AUDIO_URL", payload: audioUrl });
    dispatch({ type: "SET_TTS_LOADING", payload: false });
    dispatch({ type: "SET_TTS_REQUEST", payload: null });

    return audioUrl;
  } catch (error) {
    dispatch({ type: "SET_TTS_LOADING", payload: false });
    dispatch({ type: "SET_TTS_REQUEST", payload: null });
    
    if (error instanceof Error && error.name === "AbortError") {
      console.log("TTS request aborted");
      throw error;
    }
    
    console.error("TTS error:", error);
    throw error;
  }
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
    if (parsedChunk.event === "on_chat_model_start") {
      console.log("Chat model started");
    } else if (parsedChunk.event === "on_chat_model_stream") {
      accMessage.content += parsedChunk.data || "";
      dispatch({
        type: "EDIT_MESSAGE",
        payload: {
          id: aiMessageId,
          content: accMessage.content,
        },
      });
    } else if (parsedChunk.event === "on_chain_end") {
      const finalContent = parsedChunk.data || accMessage.content;
      dispatch({
        type: "EDIT_MESSAGE",
        payload: {
          id: aiMessageId,
          content: finalContent,
        },
      });

      // Handle tool calls
      const toolCallsData =
        parsedChunk.toolCalls ||
        parsedChunk.data?.toolCalls ||
        parsedChunk.tool_calls ||
        parsedChunk.data?.tool_calls ||
        null;

      const retrievalCallsData =
        parsedChunk.retrieval_calls ||
        parsedChunk.data?.retrieval_calls ||
        null;

      if (toolCallsData && Array.isArray(toolCallsData)) {
        dispatch({
          type: "EDIT_MESSAGE",
          payload: {
            id: aiMessageId,
            toolCalls: toolCallsData,
          },
        });
      } else if (accumulatedToolCalls.length > 0) {
        dispatch({
          type: "EDIT_MESSAGE",
          payload: {
            id: aiMessageId,
            toolCalls: accumulatedToolCalls,
          },
        });
      } else if (retrievalCallsData && Array.isArray(retrievalCallsData)) {
        dispatch({
          type: "EDIT_MESSAGE",
          payload: {
            id: aiMessageId,
            retrievalCalls: retrievalCallsData,
          },
        });
      }
    } else if (parsedChunk.event === "on_tool_start") {
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

      const toolType =
        parsedChunk.toolType ||
        parsedChunk.tool_type ||
        parsedChunk.data?.toolType ||
        parsedChunk.data?.tool_type ||
        "unknown";

      const newToolCall = {
        toolType: toolType,
        toolName: toolName,
        input: typeof toolInput === "object" ? toolInput : { query: toolInput },
        output: null,
        startTime: Date.now(),
      };

      dispatch({
        type: "SET_CURRENT_TOOL",
        payload: toolName,
      });

      return {
        currentToolCall: newToolCall,
        accumulatedToolCalls: accumulatedToolCalls,
      };
    } else if (parsedChunk.event === "on_tool_end") {
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
            typeof toolOutput === "object" ? toolOutput : { result: toolOutput },
          endTime: Date.now(),
        };

        const updatedToolCalls = [...accumulatedToolCalls, completedToolCall];

        dispatch({
          type: "EDIT_MESSAGE",
          payload: {
            id: aiMessageId,
            toolCalls: updatedToolCalls,
          },
        });

        dispatch({
          type: "SET_CURRENT_TOOL",
          payload: "",
        });

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

        const toolType =
          parsedChunk.toolType ||
          parsedChunk.tool_type ||
          parsedChunk.data?.toolType ||
          parsedChunk.data?.tool_type ||
          "unknown";

        const newCompletedToolCall = {
          toolType: toolType,
          toolName: toolName,
          input: {},
          output:
            typeof toolOutput === "object" ? toolOutput : { result: toolOutput },
          endTime: Date.now(),
        };

        const updatedToolCalls = [...accumulatedToolCalls, newCompletedToolCall];

        dispatch({
          type: "EDIT_MESSAGE",
          payload: {
            id: aiMessageId,
            toolCalls: updatedToolCalls,
          },
        });

        dispatch({
          type: "SET_CURRENT_TOOL",
          payload: "",
        });

        return {
          currentToolCall: null,
          accumulatedToolCalls: updatedToolCalls,
        };
      }
    } else if (parsedChunk.event === "error") {
      const errorData = parsedChunk.data || {};
      const errorDetails = {
        error: errorData.error || "Unknown error",
        message: errorData.message || "An error occurred",
        timestamp: Date.now(),
        stack: errorData.stack,
      };

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

      dispatch({
        type: "SET_CURRENT_TOOL",
        payload: "",
      });
    }
  } catch (error) {
    console.error("Error in dispatchEventToState:", error, parsedChunk);
  }
}
