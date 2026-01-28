"use client";

import {
  ChatContext,
  ChatDispatchContext,
} from "@/app/dashboard/concierge-chat/chat-session-context";
import { ChatList } from "@/components/agent-chat/chat-list";
import { EmptyScreen } from "@/components/shared/chat/empty-screen";
import { PromptForm } from "@/components/concierge-chat/prompt-form";
import { StreamingAudioPlayer } from "@/components/concierge-chat/streaming-audio-player";
import { useScrollAnchor } from "@/shared/hooks/use-scroll-anchor";
import { cn } from "@/shared/utils";
import { useContext, useEffect, useState, useCallback, useRef } from "react";
import { ContextualAside } from "@/components/agent-chat/contextual-aside";
import { Agent } from "@/services/agentsService";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

export interface ChatProps extends React.ComponentProps<"div"> {
  agent?: Agent | null;
  isDrawerOpen?: boolean;
  setIsDrawerOpen?: (open: boolean) => void;
}

export function Chat({
  id,
  className,
  agent,
  isDrawerOpen = false,
  setIsDrawerOpen,
}: ChatProps) {
  const [input, setInput] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAudioStreaming, setIsAudioStreaming] = useState(false);
  const chatState = useContext(ChatContext);
  const dispatch = useContext(ChatDispatchContext);
  const {
    messagesRef,
    scrollRef,
    scrollToBottom,
    visibilityRef,
    isAtBottom,
  } = useScrollAnchor();

  // Ref to the streaming audio player
  const audioPlayerRef = useRef<{
    addAudioChunk: (base64Audio: string) => void;
    reset: () => void;
  } | null>(null);

  // Check scroll position and update button visibility
  const checkScrollPosition = useCallback(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const hasScrollableContent = scrollHeight > clientHeight;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

      setShowScrollButton(hasScrollableContent && !isNearBottom);
    }
  }, [scrollRef]);

  // Check if we need to show the scroll button
  useEffect(() => {
    const handleScroll = () => {
      checkScrollPosition();
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll);
      checkScrollPosition();
      return () => scrollElement.removeEventListener("scroll", handleScroll);
    }
  }, [scrollRef, checkScrollPosition]);

  // Also check when messages change to catch new content
  useEffect(() => {
    const timer = setTimeout(checkScrollPosition, 100);
    return () => clearTimeout(timer);
  }, [chatState?.messages, checkScrollPosition]);

  // Auto-scroll to bottom when messages are streaming and user is at bottom
  useEffect(() => {
    if (
      chatState.messages.length > 0 &&
      (isAtBottom || chatState.completionLoading)
    ) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [
    chatState.messages,
    chatState.completionLoading,
    isAtBottom,
    scrollToBottom,
  ]);

  // Queue for audio chunks that arrive before player is ready
  const audioChunkQueueRef = useRef<string[]>([]);

  // Handle audio chunk from streaming TTS
  const handleAudioChunk = useCallback((base64Audio: string) => {
    const player = (window as any).__streamingAudioPlayer;
    if (player?.addAudioChunk) {
      // Process any queued chunks first
      while (audioChunkQueueRef.current.length > 0) {
        const queuedChunk = audioChunkQueueRef.current.shift();
        if (queuedChunk) player.addAudioChunk(queuedChunk);
      }
      player.addAudioChunk(base64Audio);
    } else {
      // Player not ready, queue the chunk
      audioChunkQueueRef.current.push(base64Audio);
    }
  }, []);

  // Handle TTS stream start - called BEFORE any audio chunks arrive
  const handleAudioStart = useCallback(() => {
    console.log("Audio streaming started");
    
    // Clear the queue FIRST
    audioChunkQueueRef.current = [];
    
    // Reset the player SYNCHRONOUSLY before any chunks arrive
    const player = (window as any).__streamingAudioPlayer;
    if (player?.reset) {
      player.reset();
    }
    
    // NOW set streaming state (this will cause player to render if not already)
    setIsAudioStreaming(true);
  }, []);

  // Handle TTS stream end
  const handleAudioEnd = useCallback(() => {
    console.log("Audio streaming ended");
    // Process any remaining queued chunks
    const player = (window as any).__streamingAudioPlayer;
    if (player?.addAudioChunk) {
      while (audioChunkQueueRef.current.length > 0) {
        const queuedChunk = audioChunkQueueRef.current.shift();
        if (queuedChunk) player.addAudioChunk(queuedChunk);
      }
    }
    setIsAudioStreaming(false);
  }, []);

  // Process queued chunks when player becomes available
  // This polls while streaming is active to handle timing issues
  useEffect(() => {
    if (!isAudioStreaming) return;
    
    let attempts = 0;
    const maxAttempts = 100; // 5 seconds max
    
    const checkInterval = setInterval(() => {
      attempts++;
      
      const player = (window as any).__streamingAudioPlayer;
      if (player?.addAudioChunk && audioChunkQueueRef.current.length > 0) {
        console.log(`[Chat] Processing ${audioChunkQueueRef.current.length} queued audio chunks`);
        while (audioChunkQueueRef.current.length > 0) {
          const queuedChunk = audioChunkQueueRef.current.shift();
          if (queuedChunk) player.addAudioChunk(queuedChunk);
        }
      }
      
      // Stop polling if we've waited long enough and queue is empty
      if (attempts > maxAttempts || (player && audioChunkQueueRef.current.length === 0)) {
        clearInterval(checkInterval);
      }
    }, 50);
    
    return () => clearInterval(checkInterval);
  }, [isAudioStreaming]);

  // Handle stop button in audio player
  const handleAudioStop = useCallback(() => {
    setIsAudioStreaming(false);
    dispatch?.({ type: "SET_AUDIO_PLAYING", payload: false });
    // Also abort the main request if still running
    dispatch?.({ type: "ABORT_CURRENT_REQUEST" });
  }, [dispatch]);

  // Early return check AFTER all hooks
  if (!dispatch) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-400">
          Chat context is not available. Please refresh the page.
        </div>
      </div>
    );
  }

  const handleScrollToBottom = () => {
    scrollToBottom();
  };

  return (
    <>
      {/* Floating Scroll to Bottom Button */}
      {showScrollButton && (
        <button
          onClick={handleScrollToBottom}
          className={cn(
            "fixed bottom-6 z-40 p-2 rounded-full bg-gray-700/90 hover:bg-gray-600/90 border border-white/20 hover:border-white/30 transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm",
            "text-gray-300 hover:text-white",
            "right-4 sm:right-6"
          )}
          title="Scroll to bottom"
        >
          <ChevronDownIcon className="w-4 h-4" />
        </button>
      )}

      <div className="h-full overflow-hidden flex flex-col">
        {/* Messages area */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8 custom-scrollbar"
          ref={scrollRef}
        >
          <div
            className={cn("pb-[280px] chat-messages-fade", className)}
            ref={messagesRef}
          >
            {chatState.messages.length ? (
              <ChatList
                messages={chatState.messages}
                isCompletionLoading={chatState.completionLoading}
                // @ts-ignore
                currentTool={chatState.currentTool}
              />
            ) : (
              <EmptyScreen
                content={
                  <>
                    <h1 className="text-center text-5xl leading-[1.5] font-semibold leading-12 text-ellipsis overflow-hidden text-text_default_color p-1">
                      Concierge Chat 🎙️
                    </h1>
                    <p className="text-center text-gray-400 mt-2">
                      Your AI assistant with streaming voice responses
                    </p>
                  </>
                }
              />
            )}
            {/* Visibility anchor for auto-scroll */}
            <div ref={visibilityRef} className="h-px" />
          </div>
        </div>

        {/* Fixed bottom panel with audio player and input */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-72 bg-gradient-to-t from-black via-black to-transparent pt-8 pb-4 px-4 sm:px-6 lg:px-8">
          {/* Streaming Audio Player - above the input */}
          <div className="max-w-3xl mx-auto mb-4">
            <StreamingAudioPlayer
              isStreaming={isAudioStreaming || chatState.ttsLoading}
              isPlaying={chatState.audioPlaying}
              onPlayingChange={(playing) =>
                dispatch({ type: "SET_AUDIO_PLAYING", payload: playing })
              }
              onStop={handleAudioStop}
            />
          </div>

          {/* Chat input */}
          <div className="max-w-3xl mx-auto">
            <PromptForm
              sessionId={chatState.sessionId}
              input={input}
              setInput={setInput}
              onAudioChunk={handleAudioChunk}
              onAudioStart={handleAudioStart}
              onAudioEnd={handleAudioEnd}
            />
          </div>
        </div>
      </div>

      <ContextualAside
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen?.(false)}
        agent={agent}
      />
    </>
  );
}
