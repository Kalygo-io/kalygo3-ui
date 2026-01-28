import { NextRequest } from "next/server";

const ELEVENLABS_WS_URL = "wss://api.elevenlabs.io/v1/text-to-speech";
const DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";

/**
 * Streaming TTS endpoint that uses ElevenLabs WebSocket API
 * Accepts text and streams back audio chunks via Server-Sent Events
 */
export async function POST(request: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ELEVENLABS_API_KEY not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const body = await request.json();
  const { text, voiceId = DEFAULT_VOICE_ID, modelId = DEFAULT_MODEL_ID } = body;

  if (!text || typeof text !== "string") {
    return new Response(
      JSON.stringify({ error: "Text is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Create a TransformStream to stream the response
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Start the WebSocket connection in the background
  (async () => {
    try {
      const wsUrl = `${ELEVENLABS_WS_URL}/${voiceId}/stream-input?model_id=${modelId}&output_format=mp3_44100_128`;
      
      // Use dynamic import for WebSocket in Node.js environment
      const WebSocket = (await import("ws")).default;
      const ws = new WebSocket(wsUrl, {
        headers: {
          "xi-api-key": apiKey,
        },
      });

      let isOpen = false;
      const textChunks = splitTextIntoChunks(text);
      let chunkIndex = 0;

      ws.on("open", () => {
        console.log("ElevenLabs WebSocket connected");
        isOpen = true;

        // Send initial message with voice settings
        ws.send(
          JSON.stringify({
            text: " ",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
            generation_config: {
              chunk_length_schedule: [80, 120, 200, 260], // Lower values for faster first audio
            },
          })
        );

        // Send first text chunk
        if (chunkIndex < textChunks.length) {
          sendTextChunk(ws, textChunks[chunkIndex], chunkIndex === textChunks.length - 1);
          chunkIndex++;
        }
      });

      ws.on("message", async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());

          if (message.audio) {
            // Send audio chunk as SSE event
            const sseEvent = `data: ${JSON.stringify({ type: "audio", audio: message.audio })}\n\n`;
            await writer.write(encoder.encode(sseEvent));

            // Send next text chunk after receiving audio (pacing)
            if (isOpen && chunkIndex < textChunks.length) {
              sendTextChunk(ws, textChunks[chunkIndex], chunkIndex === textChunks.length - 1);
              chunkIndex++;
            }
          }

          if (message.isFinal) {
            console.log("ElevenLabs stream complete");
            const sseEvent = `data: ${JSON.stringify({ type: "done" })}\n\n`;
            await writer.write(encoder.encode(sseEvent));
            ws.close();
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      });

      ws.on("error", async (error) => {
        console.error("ElevenLabs WebSocket error:", error);
        const sseEvent = `data: ${JSON.stringify({ type: "error", error: "WebSocket error" })}\n\n`;
        await writer.write(encoder.encode(sseEvent));
        ws.close();
      });

      ws.on("close", async () => {
        console.log("ElevenLabs WebSocket closed");
        isOpen = false;
        await writer.close();
      });
    } catch (error) {
      console.error("TTS stream error:", error);
      const sseEvent = `data: ${JSON.stringify({ type: "error", error: "TTS stream failed" })}\n\n`;
      await writer.write(encoder.encode(sseEvent));
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

/**
 * Split text into chunks for streaming to ElevenLabs
 * Tries to split at sentence boundaries for better audio quality
 */
function splitTextIntoChunks(text: string): string[] {
  const chunks: string[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+\s*/g) || [text];
  
  let currentChunk = "";
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > 200) {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  // If we only have one chunk, return it
  if (chunks.length === 0) {
    chunks.push(text);
  }
  
  return chunks;
}

/**
 * Send a text chunk to ElevenLabs WebSocket
 */
function sendTextChunk(ws: any, text: string, isLast: boolean) {
  const message: any = {
    text: text + " ", // ElevenLabs requires trailing space
    try_trigger_generation: true,
  };

  if (isLast) {
    message.flush = true;
  }

  console.log(`Sending text chunk (${text.length} chars, last: ${isLast})`);
  ws.send(JSON.stringify(message));

  // If last chunk, also send close signal
  if (isLast) {
    setTimeout(() => {
      ws.send(JSON.stringify({ text: "" }));
    }, 100);
  }
}
