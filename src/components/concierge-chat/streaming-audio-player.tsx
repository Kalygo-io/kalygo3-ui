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

// Minimum buffered seconds before starting playback
const MIN_BUFFERED_SECONDS = 2;

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
  const [bufferedSeconds, setBufferedSeconds] = useState(0);
  const totalBytesRef = useRef(0);
  const isAppendingRef = useRef(false);
  const hasTriggeredPlayRef = useRef(false);
  const isBufferReadyRef = useRef(false);
  const playCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const processQueueTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const streamIdRef = useRef(0); // Track which stream we're on to prevent stale callbacks

  // Get buffered info
  const getBufferedInfo = useCallback(() => {
    const sourceBuffer = sourceBufferRef.current;
    if (!sourceBuffer || sourceBuffer.buffered.length === 0) {
      return { start: 0, end: 0, duration: 0 };
    }
    const start = sourceBuffer.buffered.start(0);
    const end = sourceBuffer.buffered.end(0);
    return { start, end, duration: end - start };
  }, []);

  // Process queued chunks - this is the core function
  const processQueue = useCallback(() => {
    const sourceBuffer = sourceBufferRef.current;
    
    // Can't process if buffer not ready or currently appending
    if (!sourceBuffer || isAppendingRef.current) {
      return;
    }

    if (sourceBuffer.updating) {
      // Buffer is busy, retry soon
      if (processQueueTimeoutRef.current) {
        clearTimeout(processQueueTimeoutRef.current);
      }
      processQueueTimeoutRef.current = setTimeout(processQueue, 10);
      return;
    }

    if (queueRef.current.length === 0) {
      return;
    }

    const chunk = queueRef.current.shift();
    if (chunk) {
      isAppendingRef.current = true;
      try {
        sourceBuffer.appendBuffer(chunk);
        console.log(`[Audio] Appended chunk: ${chunk.length} bytes. Queue remaining: ${queueRef.current.length}`);
      } catch (e) {
        console.error("[Audio] Error appending buffer:", e);
        isAppendingRef.current = false;
        // Put chunk back at front of queue
        queueRef.current.unshift(chunk);
      }
    }
  }, []);

  // Check if we should trigger play
  const checkAndTriggerPlay = useCallback(() => {
    if (hasTriggeredPlayRef.current) return;

    const audio = audioRef.current;
    const { start, end, duration } = getBufferedInfo();

    setBufferedSeconds(duration);

    if (duration >= MIN_BUFFERED_SECONDS && audio) {
      hasTriggeredPlayRef.current = true;
      
      if (playCheckIntervalRef.current) {
        clearInterval(playCheckIntervalRef.current);
        playCheckIntervalRef.current = null;
      }

      console.log(`[Audio] Buffer ready: start=${start.toFixed(3)}s, end=${end.toFixed(3)}s, duration=${duration.toFixed(2)}s`);
      
      // Seek to the start of the buffered range
      audio.currentTime = start;
      
      // Wait a moment then play
      setTimeout(() => {
        console.log(`[Audio] Playing from currentTime=${audio.currentTime}`);
        audio.play().then(() => {
          console.log(`[Audio] Playback started at currentTime=${audio.currentTime}`);
          onPlayingChange(true);
          setHasStartedPlaying(true);
        }).catch((e) => {
          console.warn("[Audio] Play failed:", e);
        });
      }, 100);
    }
  }, [getBufferedInfo, onPlayingChange]);

  // Internal reset - clears all state synchronously
  const internalReset = useCallback(() => {
    console.log("[Audio] Internal reset");

    if (playCheckIntervalRef.current) {
      clearInterval(playCheckIntervalRef.current);
      playCheckIntervalRef.current = null;
    }
    
    if (processQueueTimeoutRef.current) {
      clearTimeout(processQueueTimeoutRef.current);
      processQueueTimeoutRef.current = null;
    }

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
    hasTriggeredPlayRef.current = false;
    isBufferReadyRef.current = false;
    streamIdRef.current += 1;

    setChunkCount(0);
    setTotalBytes(0);
    setBufferedSeconds(0);
    setHasStartedPlaying(false);
  }, []);

  // Initialize MediaSource
  const initMediaSource = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || mediaSourceRef.current) return;

    console.log("[Audio] Initializing MediaSource");

    const currentStreamId = streamIdRef.current;
    const mediaSource = new MediaSource();
    mediaSourceRef.current = mediaSource;

    audio.src = URL.createObjectURL(mediaSource);

    mediaSource.addEventListener("sourceopen", () => {
      // Guard against stale callbacks from old streams
      if (streamIdRef.current !== currentStreamId) {
        console.log("[Audio] Ignoring sourceopen from old stream");
        return;
      }

      console.log("[Audio] MediaSource opened");
      try {
        const mimeType = 'audio/mpeg';
        if (MediaSource.isTypeSupported(mimeType)) {
          const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
          sourceBufferRef.current = sourceBuffer;

          sourceBuffer.addEventListener("updateend", () => {
            // Guard against stale callbacks
            if (streamIdRef.current !== currentStreamId) return;
            
            isAppendingRef.current = false;
            
            // Check buffer and maybe trigger play
            checkAndTriggerPlay();
            
            // Process next chunk
            processQueue();
          });

          sourceBuffer.addEventListener("error", (e) => {
            console.error("[Audio] SourceBuffer error:", e);
            isAppendingRef.current = false;
          });

          // Mark buffer as ready
          isBufferReadyRef.current = true;
          console.log(`[Audio] SourceBuffer ready. Queued chunks waiting: ${queueRef.current.length}`);

          // Start checking for playback readiness
          if (!playCheckIntervalRef.current) {
            playCheckIntervalRef.current = setInterval(checkAndTriggerPlay, 100);
          }

          // IMPORTANT: Process any chunks that were queued before buffer was ready
          processQueue();
        } else {
          console.error("[Audio] MP3 not supported in MediaSource");
        }
      } catch (e) {
        console.error("[Audio] Error creating SourceBuffer:", e);
      }
    });
  }, [checkAndTriggerPlay, processQueue]);

  // Add audio chunk - this is called externally
  const addAudioChunk = useCallback((base64Audio: string) => {
    try {
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Queue the chunk FIRST
      queueRef.current.push(bytes);
      
      totalBytesRef.current += bytes.length;
      setChunkCount(c => c + 1);
      setTotalBytes(totalBytesRef.current);

      console.log(`[Audio] Chunk received: ${bytes.length} bytes. Total queued: ${queueRef.current.length}`);

      // Initialize MediaSource on first chunk
      if (!mediaSourceRef.current) {
        initMediaSource();
      }

      // Try to process queue (will only work if buffer is ready)
      if (isBufferReadyRef.current) {
        processQueue();
      }
    } catch (e) {
      console.error("[Audio] Error decoding audio chunk:", e);
    }
  }, [initMediaSource, processQueue]);

  // Public reset - called when a new stream starts
  const reset = useCallback(() => {
    console.log("[Audio] Reset requested");
    internalReset();
  }, [internalReset]);

  // End the stream when streaming stops
  useEffect(() => {
    if (!isStreaming && isBufferReadyRef.current && mediaSourceRef.current) {
      const checkAndEnd = () => {
        const sourceBuffer = sourceBufferRef.current;
        const mediaSource = mediaSourceRef.current;
        
        if (!sourceBuffer || !mediaSource) return;
        
        if (queueRef.current.length === 0 && !sourceBuffer.updating && !isAppendingRef.current && mediaSource.readyState === "open") {
          try {
            console.log("[Audio] Ending MediaSource stream");
            mediaSource.endOfStream();
          } catch (e) {
            console.warn("[Audio] Error ending stream:", e);
          }
        } else {
          // Still processing, check again
          setTimeout(checkAndEnd, 100);
        }
      };
      
      setTimeout(checkAndEnd, 300);
    }
  }, [isStreaming]);

  // Expose methods via window - IMPORTANT: these are stable references
  useEffect(() => {
    (window as any).__streamingAudioPlayer = { addAudioChunk, reset };
    return () => {
      delete (window as any).__streamingAudioPlayer;
    };
  }, [addAudioChunk, reset]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playCheckIntervalRef.current) clearInterval(playCheckIntervalRef.current);
      if (processQueueTimeoutRef.current) clearTimeout(processQueueTimeoutRef.current);
      if (mediaSourceRef.current?.readyState === "open") {
        try { mediaSourceRef.current.endOfStream(); } catch (e) {}
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
                <span>Buffering... {bufferedSeconds.toFixed(1)}s / {MIN_BUFFERED_SECONDS}s</span>
              </div>
            )}
            <audio
              ref={audioRef}
              controls
              className="w-full h-10"
              onPlay={() => onPlayingChange(true)}
              onPause={() => onPlayingChange(false)}
              onEnded={() => onPlayingChange(false)}
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
