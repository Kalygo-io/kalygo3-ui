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

  console.log("Starting to read stream...");

  try {
    while (true) {
      // Check for cancellation before reading
      if (abortController?.signal.aborted) {
        console.log("Request aborted, stopping stream read");
        reader.cancel();
        break;
      }

      const { done, value } = await reader.read();

      if (done) {
        console.log("Stream done");
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const parsedChunk = JSON.parse(line);

          if (parsedChunk.type === "content") {
            accMessage.content += parsedChunk.content || "";
            dispatch({
              type: "EDIT_MESSAGE",
              payload: {
                id: aiMessageId,
                content: accMessage.content,
                role: "ai",
              },
            });
          } else if (parsedChunk.type === "retrieval_call") {
            retrievalCalls.push(parsedChunk);
            dispatch({
              type: "SET_CURRENT_TOOL",
              payload: parsedChunk.tool || "",
            });
            dispatch({
              type: "EDIT_MESSAGE",
              payload: {
                id: aiMessageId,
                retrievalCalls: retrievalCalls,
              },
            });
          } else if (parsedChunk.type === "error") {
            throw parsedChunk.error || "Unknown error";
          }
        } catch (parseError) {
          // If JSON parsing fails, it might be a partial chunk
          // Try to extract content if it looks like a content chunk
          if (line.includes('"type":"content"')) {
            try {
              const contentMatch = line.match(/"content":"([^"]*)"/);
              if (contentMatch) {
                accMessage.content += contentMatch[1] || "";
                dispatch({
                  type: "EDIT_MESSAGE",
                  payload: {
                    id: aiMessageId,
                    content: accMessage.content,
                    role: "ai",
                  },
                });
              }
            } catch (e) {
              // Ignore parsing errors for partial chunks
            }
          }
        }
      }
    }

    // Finalize the message
    if (accMessage.content) {
      dispatch({
        type: "EDIT_MESSAGE",
        payload: {
          id: aiMessageId,
          content: accMessage.content,
          role: "ai",
          retrievalCalls: retrievalCalls.length > 0 ? retrievalCalls : undefined,
        },
      });
    } else {
      // If no content was received, add an empty AI message
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          id: aiMessageId,
          content: "",
          role: "ai",
          retrievalCalls: retrievalCalls.length > 0 ? retrievalCalls : undefined,
        },
      });
    }

    dispatch({
      type: "SET_CURRENT_TOOL",
      payload: "",
    });
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.log("Request was aborted");
      throw error;
    }
    console.error("Error reading stream:", error);
    dispatch({
      type: "EDIT_MESSAGE",
      payload: {
        id: aiMessageId,
        error: error.message || error,
        role: "ai",
      },
    });
    throw error;
  }
}
