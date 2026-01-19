import { Action } from "@/app/dashboard/agent-chat/chat-session-reducer";
import { nanoid } from "@/shared/utils";
import React from "react";

export async function callAgent(
  agentId: string,
  sessionId: string,
  prompt: string,
  dispatch: React.Dispatch<Action>,
  abortController?: AbortController
) {
  console.log(
    "Starting Agent call with agentId:",
    agentId,
    "sessionId:",
    sessionId,
    "prompt:",
    prompt
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
    }
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
        console.log("Agent request cancelled");
        break;
      }

      const { done, value } = await reader.read();
      if (done) {
        console.log("Stream complete");
        break;
      }

      let chunk = decoder.decode(value);
      console.log("Raw chunk received:", chunk);

      try {
        const parsedChunk = JSON.parse(chunk);
        console.log("Parsed chunk:", parsedChunk);
        dispatchEventToState(
          parsedChunk,
          dispatch,
          aiMessageId,
          accMessage,
          retrievalCalls
        );
      } catch (e) {
        console.log(
          "Failed to parse as single JSON, trying multi-chunk parsing..."
        );
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
                console.log("Parsed multi-chunk:", parsedChunk);

                dispatchEventToState(
                  parsedChunk,
                  dispatch,
                  aiMessageId,
                  accMessage,
                  retrievalCalls
                );

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
      console.log("Agent request aborted");
      throw error;
    }
    console.error("Error in streaming response:", error);
    throw error;
  } finally {
    if (reader) {
      reader.releaseLock();
    }
  }
}

function dispatchEventToState(
  parsedChunk: Record<string, any>,
  dispatch: React.Dispatch<Action>,
  aiMessageId: string,
  accMessage: { content: string },
  retrievalCalls: any[]
) {
  try {
    console.log("Processing event:", parsedChunk.event, parsedChunk);

    // Only handle essential events to isolate the issue
    if (parsedChunk.event === "on_chat_model_start") {
      // Message already created upfront (before stream processing), so just log this event
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

      // Handle tool calls if available (new schema) or retrieval calls (legacy)
      console.log(
        "Chain end event - checking for tool calls:",
        parsedChunk
      );
      console.log("Chain end event keys:", Object.keys(parsedChunk));
      
      // Check multiple possible locations for toolCalls (new schema)
      const toolCallsData = 
        parsedChunk.toolCalls ||  // Direct property
        parsedChunk.data?.toolCalls ||  // Nested in data
        parsedChunk.tool_calls ||  // Snake case variant
        parsedChunk.data?.tool_calls ||  // Snake case in data
        null;

      // Check for legacy retrieval_calls
      const retrievalCallsData = 
        parsedChunk.retrieval_calls ||
        parsedChunk.data?.retrieval_calls ||
        null;

      if (toolCallsData && Array.isArray(toolCallsData)) {
        try {
          console.log("Tool calls found (new schema):", toolCallsData);

          dispatch({
            type: "EDIT_MESSAGE",
            payload: {
              id: aiMessageId,
              toolCalls: toolCallsData,
            },
          });

          console.log("Tool calls dispatched to state");
          console.log("Tool calls count:", toolCallsData.length);
        } catch (error) {
          console.error("Error processing tool calls:", error);
        }
      } else if (retrievalCallsData && Array.isArray(retrievalCallsData)) {
        try {
          console.log("Retrieval calls found (legacy):", retrievalCallsData);

          dispatch({
            type: "EDIT_MESSAGE",
            payload: {
              id: aiMessageId,
              retrievalCalls: retrievalCallsData,
            },
          });

          console.log("Retrieval calls dispatched to state");
          console.log("Retrieval calls count:", retrievalCallsData.length);
        } catch (error) {
          console.error("Error processing retrieval calls:", error);
        }
      } else {
        console.log("No tool calls or retrieval calls found in chain end event");
        console.log("Available keys in parsedChunk:", Object.keys(parsedChunk));
      }
    } else if (parsedChunk.event === "on_tool_start") {
      try {
        console.log("Tool start event data:", parsedChunk);
        const toolMessage = parsedChunk.data || "Tool starting...";
        console.log("Setting current tool:", toolMessage);

        dispatch({
          type: "SET_CURRENT_TOOL",
          payload: toolMessage,
        });

        // Use a safer notification approach
        console.log("🔧 Tool started:", toolMessage);
        // You could also dispatch a custom notification action here if needed
        // dispatch({ type: "ADD_NOTIFICATION", payload: { message: toolMessage, type: "info" } });
      } catch (error) {
        console.error("Error handling tool start:", error, parsedChunk);
      }
    } else if (parsedChunk.event === "on_tool_end") {
      try {
        console.log("Tool end event data:", parsedChunk);
        console.log("Clearing current tool");

        dispatch({
          type: "SET_CURRENT_TOOL",
          payload: "",
        });

        console.log("✅ Tool completed successfully");
      } catch (error) {
        console.error("Error handling tool end:", error, parsedChunk);
      }
    } else {
      console.log("Unhandled event:", parsedChunk.event);
    }
  } catch (error) {
    console.error("Error in dispatchEventToState:", error, parsedChunk);
  }
}
