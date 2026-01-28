/**
 * Streaming TTS service that connects to the TTS streaming endpoint
 * and plays audio chunks as they arrive
 */

export interface StreamingTTSOptions {
  onAudioChunk?: (base64Audio: string) => void;
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
  onError?: (error: string) => void;
}

export class StreamingTTSController {
  private abortController: AbortController | null = null;
  private options: StreamingTTSOptions;

  constructor(options: StreamingTTSOptions = {}) {
    this.options = options;
  }

  /**
   * Start streaming TTS for the given text
   */
  async stream(text: string): Promise<void> {
    // Abort any existing stream
    this.abort();

    this.abortController = new AbortController();
    this.options.onStreamStart?.();

    try {
      const response = await fetch("/api/tts-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "TTS stream failed");
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
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // Process SSE events
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "audio" && data.audio) {
                this.options.onAudioChunk?.(data.audio);
              } else if (data.type === "done") {
                console.log("TTS stream complete");
              } else if (data.type === "error") {
                this.options.onError?.(data.error);
              }
            } catch (e) {
              console.warn("Error parsing SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          console.log("TTS stream aborted");
          return;
        }
        this.options.onError?.(error.message);
      }
      throw error;
    } finally {
      this.options.onStreamEnd?.();
      this.abortController = null;
    }
  }

  /**
   * Abort the current stream
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}

/**
 * Helper to create a streaming TTS controller
 */
export function createStreamingTTS(options: StreamingTTSOptions = {}): StreamingTTSController {
  return new StreamingTTSController(options);
}
