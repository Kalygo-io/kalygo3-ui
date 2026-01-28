"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { SpeakerWaveIcon, StopIcon } from "@heroicons/react/24/outline";
import { cn } from "@/shared/utils";

interface StreamingAudioPlayerProps {
  isStreaming: boolean;
  isPlaying: boolean;
  onPlayingChange: (playing: boolean) => void;
  onStop: () => void;
  className?: string;
}

// Minimum bytes before starting playback (~3 seconds)
const MIN_BYTES_TO_START = 48000;

export function StreamingAudioPlayer({
  isStreaming,
  isPlaying,
  onPlayingChange,
  onStop,
  className,
}: StreamingAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const queueRef = useRef<Uint8Array[]>([]);
  const [chunkCount, setChunkCount] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [isBufferReady, setIsBufferReady] = useState(false);
  const totalBytesRef = useRef(0);
  const isAppendingRef = useRef(false);
  const hasAutoPlayedRef = useRef(false);

  // Initialize MediaSource
  const initMediaSource = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || mediaSourceRef.current) return;

    console.log("Initializing MediaSource");

    const mediaSource = new MediaSource();
    mediaSourceRef.current = mediaSource;

    audio.src = URL.createObjectURL(mediaSource);

    mediaSource.addEventListener("sourceopen", () => {
      console.log("MediaSource opened");
      try {
        // Try audio/mpeg first (MP3)
        const mimeType = 'audio/mpeg';
        if (MediaSource.isTypeSupported(mimeType)) {
          const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
          sourceBufferRef.current = sourceBuffer;

          sourceBuffer.addEventListener("updateend", () => {
            isAppendingRef.current = false;
            processQueue();
          });

          sourceBuffer.addEventListener("error", (e) => {
            console.error("SourceBuffer error:", e);
          });

          setIsBufferReady(true);
          console.log("SourceBuffer ready");

          // Process any queued data
          processQueue();
        } else {
          console.error("MP3 not supported in MediaSource");
        }
      } catch (e) {
        console.error("Error creating SourceBuffer:", e);
      }
    });

    mediaSource.addEventListener("sourceended", () => {
      console.log("MediaSource ended");
    });
  }, []);

  // Process queued chunks
  const processQueue = useCallback(() => {
    const sourceBuffer = sourceBufferRef.current;
    if (!sourceBuffer || isAppendingRef.current || queueRef.current.length === 0) {
      return;
    }

    if (sourceBuffer.updating) {
      return;
    }

    const chunk = queueRef.current.shift();
    if (chunk) {
      isAppendingRef.current = true;
      try {
        sourceBuffer.appendBuffer(chunk);
      } catch (e) {
        console.error("Error appending buffer:", e);
        isAppendingRef.current = false;
        // Put chunk back if it failed
        queueRef.current.unshift(chunk);
      }
    }
  }, []);

  // Auto-play when enough data is buffered
  useEffect(() => {
    if (isBufferReady && totalBytes >= MIN_BYTES_TO_START && !hasAutoPlayedRef.current) {
      hasAutoPlayedRef.current = true;
      const audio = audioRef.current;
      if (audio) {
        console.log(`Starting playback with ${(totalBytes / 1024).toFixed(0)}KB buffered`);
        audio.play().then(() => {
          onPlayingChange(true);
          setHasStartedPlaying(true);
        }).catch((e) => {
          console.warn("Auto-play failed:", e);
        });
      }
    }
  }, [isBufferReady, totalBytes, onPlayingChange]);

  // End the stream when streaming stops
  useEffect(() => {
    if (!isStreaming && isBufferReady && mediaSourceRef.current) {
      // Wait for queue to empty, then end stream
      const checkAndEnd = () => {
        const sourceBuffer = sourceBufferRef.current;
        const mediaSource = mediaSourceRef.current;
        
        if (!sourceBuffer || !mediaSource) return;
        
        if (queueRef.current.length === 0 && !sourceBuffer.updating && mediaSource.readyState === "open") {
          try {
            mediaSource.endOfStream();
            console.log("MediaSource stream ended");
          } catch (e) {
            console.warn("Error ending stream:", e);
          }
        } else if (queueRef.current.length > 0 || sourceBuffer.updating) {
          // Still processing, check again
          setTimeout(checkAndEnd, 100);
        }
      };
      
      setTimeout(checkAndEnd, 200);
    }
  }, [isStreaming, isBufferReady]);

  // Add audio chunk
  const addAudioChunk = useCallback((base64Audio: string) => {
    try {
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      totalBytesRef.current += bytes.length;
      setChunkCount(c => c + 1);
      setTotalBytes(totalBytesRef.current);

      // Initialize MediaSource on first chunk
      if (!mediaSourceRef.current) {
        initMediaSource();
      }

      // Queue the chunk
      queueRef.current.push(bytes);
      
      // Try to process
      if (isBufferReady) {
        processQueue();
      }
    } catch (e) {
      console.error("Error decoding audio chunk:", e);
    }
  }, [initMediaSource, isBufferReady, processQueue]);

  // Reset player
  const reset = useCallback(() => {
    console.log("Resetting audio player");

    // Clean up MediaSource
    if (mediaSourceRef.current && mediaSourceRef.current.readyState === "open") {
      try {
        mediaSourceRef.current.endOfStream();
      } catch (e) {}
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      const oldSrc = audioRef.current.src;
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
      if (oldSrc) URL.revokeObjectURL(oldSrc);
    }

    mediaSourceRef.current = null;
    sourceBufferRef.current = null;
    queueRef.current = [];
    totalBytesRef.current = 0;
    isAppendingRef.current = false;
    hasAutoPlayedRef.current = false;

    setChunkCount(0);
    setTotalBytes(0);
    setHasStartedPlaying(false);
    setIsBufferReady(false);
  }, []);

  // Expose methods
  useEffect(() => {
    (window as any).__streamingAudioPlayer = { addAudioChunk, reset };
    return () => {
      delete (window as any).__streamingAudioPlayer;
    };
  }, [addAudioChunk, reset]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaSourceRef.current && mediaSourceRef.current.readyState === "open") {
        try {
          mediaSourceRef.current.endOfStream();
        } catch (e) {}
      }
    };
  }, []);

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    onPlayingChange(false);
    onStop();
  };

  const handleEnded = () => {
    onPlayingChange(false);
  };

  if (!isStreaming && chunkCount === 0) {
    return null;
  }

  const estimatedDuration = totalBytes / 16000;

  return (
    <div className={cn(
      "bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4",
      className
    )}>
      <div className="flex items-center gap-3">
        <SpeakerWaveIcon className={cn(
          "h-5 w-5 flex-shrink-0",
          isStreaming || isPlaying ? "text-purple-400 animate-pulse" : "text-gray-400"
        )} />

        <div className="flex-1 flex items-center gap-3">
          <div className="flex-1 flex flex-col gap-1">
            {isStreaming && !hasStartedPlaying && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
                <span>Buffering... {(totalBytes / 1024).toFixed(0)}KB / {(MIN_BYTES_TO_START / 1024).toFixed(0)}KB</span>
              </div>
            )}
            <audio
              ref={audioRef}
              controls
              className="w-full h-10"
              onPlay={() => onPlayingChange(true)}
              onPause={() => onPlayingChange(false)}
              onEnded={handleEnded}
            />
            {isStreaming && hasStartedPlaying && (
              <div className="text-xs text-gray-500">
                Streaming: {chunkCount} chunks • ~{estimatedDuration.toFixed(0)}s
              </div>
            )}
          </div>
          
          {(isPlaying || isStreaming) && (
            <button
              onClick={handleStop}
              className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex-shrink-0"
              title="Stop"
            >
              <StopIcon className="h-4 w-4 text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
