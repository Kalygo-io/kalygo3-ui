import { NextRequest } from "next/server";
import WebSocket from "ws";

const ELEVENLABS_WS_URL = "wss://api.elevenlabs.io/v1/text-to-speech";
const DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";

// Minimum characters to buffer before starting TTS
const MIN_BUFFER_SIZE = 80;
// Force-flush the TTS buffer when it exceeds this size, even without a boundary
const MAX_BUFFER_SIZE = 250;

interface StreamEvent {
  type: "text" | "audio" | "text_done" | "audio_done" | "error";
  data?: unknown;
  event?: string;
  // Tool event fields
  toolCalls?: unknown[];
  retrieval_calls?: unknown[];
  // Allow any additional fields from the agent API
  [key: string]: unknown;
}

/**
 * Unified concierge streaming endpoint that orchestrates both
 * agent text streaming and ElevenLabs audio streaming in parallel
 */
export async function POST(request: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const completionApiUrl = process.env.NEXT_PUBLIC_COMPLETION_API_URL;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ELEVENLABS_API_KEY not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!completionApiUrl) {
    return new Response(
      JSON.stringify({ error: "COMPLETION_API_URL not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const body = await request.json();
  const { agentId, sessionId, prompt, voiceId = DEFAULT_VOICE_ID } = body;

  if (!agentId || !sessionId || !prompt) {
    return new Response(
      JSON.stringify({ error: "agentId, sessionId, and prompt are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Get cookies from the request to forward to the agent API
  const cookies = request.headers.get("cookie") || "";

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Helper to send SSE event
  const sendEvent = async (event: StreamEvent) => {
    const sseData = `data: ${JSON.stringify(event)}\n\n`;
    await writer.write(encoder.encode(sseData));
  };

  // Start the orchestration in the background
  (async () => {
    let ws: WebSocket | null = null;
    let textBuffer = "";
    let fullText = "";
    let wsReady = false;
    let wsQueue: string[] = [];
    let textStreamComplete = false;
    let sentFinalChunk = false;

    try {
      // Step 1: Call the agent API
      const agentResponse = await fetch(
        `${completionApiUrl}/api/agents/${encodeURIComponent(agentId)}/completion`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: cookies,
          },
          body: JSON.stringify({
            sessionId,
            prompt,
          }),
        }
      );

      if (!agentResponse.ok) {
        const errorText = await agentResponse.text();
        await sendEvent({
          type: "error",
          data: `Agent API error: ${agentResponse.status} - ${errorText}`,
        });
        await writer.close();
        return;
      }

      const reader = agentResponse.body?.getReader();
      if (!reader) {
        await sendEvent({ type: "error", data: "No response body from agent" });
        await writer.close();
        return;
      }

      const decoder = new TextDecoder();

      // Function to initialize WebSocket when we have enough text
      const initWebSocket = () => {
        if (ws) return;

        console.log("Initializing ElevenLabs WebSocket...");
        const wsUrl = `${ELEVENLABS_WS_URL}/${voiceId}/stream-input?model_id=${DEFAULT_MODEL_ID}&output_format=mp3_44100_128`;

        ws = new WebSocket(wsUrl, {
          headers: {
            "xi-api-key": apiKey,
          },
        });

        ws.on("open", () => {
          console.log("ElevenLabs WebSocket connected");
          wsReady = true;

          // Send initial configuration
          ws!.send(
            JSON.stringify({
              text: " ",
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
              },
              generation_config: {
                chunk_length_schedule: [50, 90, 130, 170], // Lower for faster first audio
              },
            })
          );

          // Send any queued text
          for (const text of wsQueue) {
            sendTextToWs(text, false);
          }
          wsQueue = [];

          // If text stream already complete, send final chunk
          if (textStreamComplete && !sentFinalChunk) {
            sendFinalChunk();
          }
        });

        ws.on("message", async (data: Buffer) => {
          try {
            const message = JSON.parse(data.toString());

            if (message.audio) {
              await sendEvent({ type: "audio", data: message.audio });
            }

            if (message.isFinal) {
              console.log("ElevenLabs stream complete");
              await sendEvent({ type: "audio_done" });
            }
          } catch (e) {
            console.warn("Error parsing WebSocket message:", e);
          }
        });

        ws.on("error", async (error) => {
          console.error("ElevenLabs WebSocket error:", error);
          await sendEvent({ type: "error", data: "TTS WebSocket error" });
        });

        ws.on("close", async () => {
          console.log("ElevenLabs WebSocket closed");
          wsReady = false;
        });
      };

      // Function to send text to WebSocket
      const sendTextToWs = (text: string, isLast: boolean) => {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
          if (!isLast) wsQueue.push(text);
          return;
        }

        const message: any = {
          text: text + " ",
          try_trigger_generation: true,
        };

        if (isLast) {
          message.flush = true;
        }

        console.log(`Sending to TTS: "${text.substring(0, 50)}..." (last: ${isLast})`);
        ws.send(JSON.stringify(message));

        if (isLast) {
          // Send close signal after a short delay
          setTimeout(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ text: "" }));
            }
          }, 100);
        }
      };

      // Function to send final chunk
      const sendFinalChunk = () => {
        if (sentFinalChunk) return;
        sentFinalChunk = true;

        // Send any remaining buffer
        if (textBuffer.trim()) {
          sendTextToWs(textBuffer, true);
          textBuffer = "";
        } else if (ws && ws.readyState === WebSocket.OPEN) {
          // Just send flush signal
          ws.send(JSON.stringify({ text: " ", flush: true }));
          setTimeout(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ text: "" }));
            }
          }, 100);
        }
      };

      // Process agent stream
      let jsonBuffer = "";
      
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log("Agent stream complete");
          textStreamComplete = true;
          await sendEvent({ type: "text_done" });

          // Send final text to TTS
          if (wsReady) {
            sendFinalChunk();
          } else if (!ws && fullText.trim().length > 0) {
            // Short response that never hit MIN_BUFFER_SIZE — still init the WS.
            // The "open" handler already checks textStreamComplete and calls
            // sendFinalChunk(), so the remaining textBuffer will be flushed.
            initWebSocket();
          }
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        jsonBuffer += chunk;

        // Parse JSON objects from the buffer
        let idx = 0;
        let braceCount = 0;
        let inString = false;
        let escapeNext = false;
        let objectStart = -1;

        while (idx < jsonBuffer.length) {
          const char = jsonBuffer[idx];

          if (escapeNext) {
            escapeNext = false;
          } else if (char === "\\") {
            escapeNext = true;
          } else if (char === '"' && !escapeNext) {
            inString = !inString;
          } else if (!inString) {
            if (char === "{") {
              if (braceCount === 0) objectStart = idx;
              braceCount++;
            } else if (char === "}") {
              braceCount--;
              if (braceCount === 0 && objectStart !== -1) {
                const jsonStr = jsonBuffer.substring(objectStart, idx + 1);
                try {
                  const parsed = JSON.parse(jsonStr);
                  
                  // Log ALL events to understand the data flow
                  console.log(`[Concierge Server] Event: ${parsed.event}`, JSON.stringify(parsed).substring(0, 500));
                  
                  // Handle different event types
                  if (parsed.event === "on_chat_model_stream" && parsed.data) {
                    const textChunk = parsed.data;
                    fullText += textChunk;
                    textBuffer += textChunk;

                    // Send text to client
                    await sendEvent({
                      type: "text",
                      data: textChunk,
                      event: parsed.event,
                    });

                    // Initialize WebSocket when we have enough text
                    if (!ws && fullText.length >= MIN_BUFFER_SIZE) {
                      initWebSocket();
                    }

                    // Send buffered text to TTS at natural boundaries
                    if (wsReady && textBuffer.length >= MIN_BUFFER_SIZE) {
                      // Match sentences ending with punctuation, or lines ending
                      // with newlines (handles bullet lists, code, etc.)
                      const boundary = textBuffer.match(
                        /[^.!?;\n]+[.!?;]+\s*|[^\n]+\n+/g
                      );
                      if (boundary && boundary.length > 0) {
                        const completeText = boundary.join("");
                        sendTextToWs(completeText, false);
                        textBuffer = textBuffer.substring(completeText.length);
                      } else if (textBuffer.length >= MAX_BUFFER_SIZE) {
                        // No natural boundary found but buffer is large — flush
                        // at the last space to avoid splitting words
                        const lastSpace = textBuffer.lastIndexOf(" ");
                        const splitAt =
                          lastSpace > MIN_BUFFER_SIZE ? lastSpace + 1 : textBuffer.length;
                        sendTextToWs(textBuffer.substring(0, splitAt), false);
                        textBuffer = textBuffer.substring(splitAt);
                      }
                    }
                  } else if (parsed.event === "on_tool_start" || parsed.event === "on_tool_end") {
                    // Forward the ENTIRE parsed object as-is to preserve all fields
                    // This ensures we don't lose any data in translation
                    console.log(`[Concierge Server] Tool event: ${parsed.event}`, JSON.stringify(parsed).substring(0, 1000));
                    
                    // Send the full parsed object, spread all fields
                    await sendEvent({
                      type: "text",
                      event: parsed.event,
                      ...parsed, // Spread all fields from the original event
                    });
                  } else if (parsed.event === "on_chain_end") {
                    // Forward chain end with ALL data including toolCalls
                    // The toolCalls array contains the actual vector search results
                    console.log("[Concierge Server] Chain end - toolCalls:", parsed.toolCalls ? "present" : "not present");
                    console.log("[Concierge Server] Chain end - data.toolCalls:", parsed.data?.toolCalls ? "present" : "not present");
                    
                    await sendEvent({
                      type: "text",
                      event: parsed.event,
                      data: parsed.data,
                      // Include toolCalls - check multiple locations
                      toolCalls: parsed.toolCalls || parsed.data?.toolCalls || parsed.tool_calls || parsed.data?.tool_calls,
                      // Include retrieval_calls for legacy support
                      retrieval_calls: parsed.retrieval_calls || parsed.data?.retrieval_calls,
                    });
                  } else if (parsed.event) {
                    // Forward other events to client
                    await sendEvent({
                      type: "text",
                      data: parsed.data,
                      event: parsed.event,
                    });
                  }
                } catch (e) {
                  // JSON parse error, continue
                }
                jsonBuffer = jsonBuffer.substring(idx + 1);
                idx = -1;
                objectStart = -1;
              }
            }
          }
          idx++;
        }
      }

      // Wait for the ElevenLabs WebSocket to finish (connect → process → close).
      // We must keep the SSE writer open until all audio chunks have been sent.
      let waitCount = 0;
      const wsInstance = ws as WebSocket | null;
      while (
        wsInstance &&
        wsInstance.readyState !== WebSocket.CLOSED &&
        waitCount < 300 // 30 s safety timeout
      ) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        waitCount++;
      }

      // Force-close WebSocket if it's still alive after the timeout
      if (wsInstance && wsInstance.readyState !== WebSocket.CLOSED) {
        wsInstance.close();
      }
    } catch (error) {
      console.error("Concierge stream error:", error);
      await sendEvent({
        type: "error",
        data: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
