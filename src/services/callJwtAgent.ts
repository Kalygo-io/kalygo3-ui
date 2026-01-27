import { Action } from "@/app/dashboard/jwt-agent/chat-session-reducer";
import { nanoid } from "@/shared/utils";
import React from "react";

export async function callJwtAgent(
  sessionId: string,
  prompt: string,
  dispatch: React.Dispatch<Action>,
  abortController?: AbortController
) {
  console.log(
    "Starting JWT Agent call with sessionId:",
    sessionId,
    "prompt:",
    prompt
  );

  const resp = await fetch(
    `${process.env.NEXT_PUBLIC_AI_API_URL}/api/jwt-agent/completion`,
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

  // debugger;

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

  console.log("Starting to read stream...");

  try {
    while (true) {
      // Check for cancellation before reading
      if (abortController?.signal.aborted) {
        console.log("Ai School RAG request cancelled");
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
      console.log("Agentic RAG request aborted");
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
    if (parsedChunk.event === "on_chain_start") {
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          id: aiMessageId,
          content: "",
          role: "ai",
          error: null,
        },
      });
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

      // Handle retrieval calls if available
      console.log(
        "Chain end event - checking for retrieval calls:",
        parsedChunk
      );
      console.log("Chain end event keys:", Object.keys(parsedChunk));
      if (parsedChunk.retrieval_calls) {
        try {
          console.log("Retrieval calls found:", parsedChunk.retrieval_calls);
          const retrievalCallsData = Array.isArray(parsedChunk.retrieval_calls)
            ? parsedChunk.retrieval_calls
            : [];

          console.log("Processed retrieval calls data:", retrievalCallsData);

          dispatch({
            type: "EDIT_MESSAGE",
            payload: {
              id: aiMessageId,
              retrievalCalls: retrievalCallsData,
            },
          });

          console.log("Retrieval calls dispatched to state");
          console.log(
            "Message should now have retrievalCalls:",
            retrievalCallsData
          );
          console.log("Retrieval calls count:", retrievalCallsData.length);
        } catch (error) {
          console.error("Error processing retrieval calls:", error);
        }
      } else {
        console.log("No retrieval calls found in chain end event");
        console.log("Available keys in parsedChunk:", Object.keys(parsedChunk));
      }
    } else if (parsedChunk.event === "completion") {
      const finalContent = parsedChunk.data.output || accMessage.content;
      // debugger;

      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          id: aiMessageId,
          content: finalContent,
          role: "ai",
          error: null,
        },
      });
      // dispatch({
      //   type: "EDIT_MESSAGE",
      //   payload: {
      //     id: aiMessageId,
      //     content: finalContent,
      //   },
      // });

      // // Handle retrieval calls if available
      // console.log(
      //   "Chain end event - checking for retrieval calls:",
      //   parsedChunk
      // );
      // console.log("Chain end event keys:", Object.keys(parsedChunk));
      // if (parsedChunk.retrieval_calls) {
      //   try {
      //     console.log("Retrieval calls found:", parsedChunk.retrieval_calls);
      //     const retrievalCallsData = Array.isArray(parsedChunk.retrieval_calls)
      //       ? parsedChunk.retrieval_calls
      //       : [];

      //     console.log("Processed retrieval calls data:", retrievalCallsData);

      //     dispatch({
      //       type: "EDIT_MESSAGE",
      //       payload: {
      //         id: aiMessageId,
      //         retrievalCalls: retrievalCallsData,
      //       },
      //     });

      //     console.log("Retrieval calls dispatched to state");
      //     console.log(
      //       "Message should now have retrievalCalls:",
      //       retrievalCallsData
      //     );
      //     console.log("Retrieval calls count:", retrievalCallsData.length);
      //   } catch (error) {
      //     console.error("Error processing retrieval calls:", error);
      //   }
      // } else {
      //   console.log("No retrieval calls found in chain end event");
      //   console.log("Available keys in parsedChunk:", Object.keys(parsedChunk));
      // }
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
    } else if (parsedChunk.event === "on_chat_model_start") {
      console.log("Chat model started");
    } else if (parsedChunk.event === "error") {
      try {
        console.log("Error event received:", parsedChunk);
        
        const errorData = parsedChunk.data || {};
        const errorDetails = {
          error: errorData.error || "Unknown error",
          message: errorData.message || "An error occurred",
          timestamp: Date.now(),
          stack: errorData.stack,
        };

        console.error("❌ Agent error:", errorDetails);

        // Update the AI message with error details
        dispatch({
          type: "EDIT_MESSAGE",
          payload: {
            id: aiMessageId,
            error: errorDetails,
            content: accMessage.content || "Error occurred while processing your request.",
          },
        });

        // Clear any active tool
        dispatch({
          type: "SET_CURRENT_TOOL",
          payload: "",
        });

        console.log("Error dispatched to state");
      } catch (error) {
        console.error("Error handling error event:", error, parsedChunk);
      }
    } else {
      console.log("Unhandled event:", parsedChunk.event);
    }
  } catch (error) {
    console.error("Error in dispatchEventToState:", error, parsedChunk);
  }
}
