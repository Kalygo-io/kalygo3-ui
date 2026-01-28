"use client";

import {
  ChatContext,
  ChatDispatchContext,
} from "@/app/dashboard/concierge-chat/chat-session-context";
import { ChatList } from "@/components/agent-chat/chat-list";
import { ChatPanel } from "@/components/shared/chat/chat-panel";
import { EmptyScreen } from "@/components/shared/chat/empty-screen";
import { PromptForm } from "@/components/concierge-chat/prompt-form";
import { useScrollAnchor } from "@/shared/hooks/use-scroll-anchor";
import { cn } from "@/shared/utils";
import { useContext, useEffect, useState, useCallback, useRef } from "react";
import { ContextualAside } from "@/components/agent-chat/contextual-aside";
import { Agent } from "@/services/agentsService";
import {
  ChevronDownIcon,
  SpeakerWaveIcon,
  StopIcon,
} from "@heroicons/react/24/outline";

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
  const chatState = useContext(ChatContext);
  const dispatch = useContext(ChatDispatchContext);
  const {
    messagesRef,
    scrollRef,
    scrollToBottom,
    visibilityRef,
    isAtBottom,
  } = useScrollAnchor();
  const audioRef = useRef<HTMLAudioElement>(null);

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

  // Handle audio events
  const handleAudioEnded = () => {
    dispatch?.({ type: "SET_AUDIO_PLAYING", payload: false });
  };

  const handleAudioPlay = () => {
    dispatch?.({ type: "SET_AUDIO_PLAYING", payload: true });
  };

  const handleAudioPause = () => {
    dispatch?.({ type: "SET_AUDIO_PLAYING", payload: false });
  };

  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    dispatch?.({ type: "SET_AUDIO_PLAYING", payload: false });
  };

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
      <button
        onClick={handleScrollToBottom}
        className={cn(
          "fixed bottom-6 z-40 p-2 rounded-full bg-gray-700/90 hover:bg-gray-600/90 border border-white/20 hover:border-white/30 transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm",
          "text-gray-300 hover:text-white",
          "right-4 sm:right-6",
          "opacity-100 translate-y-0 scale-100"
        )}
        title="Scroll to bottom"
      >
        <ChevronDownIcon className="w-4 h-4" />
      </button>

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
                      Your AI assistant with voice responses
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
          {/* Audio Player - above the input */}
          {(chatState.audioUrl || chatState.ttsLoading) && (
            <div className="max-w-3xl mx-auto mb-4">
              <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <SpeakerWaveIcon
                    className={cn(
                      "h-5 w-5 flex-shrink-0",
                      chatState.ttsLoading
                        ? "text-purple-400 animate-pulse"
                        : chatState.audioPlaying
                        ? "text-purple-400"
                        : "text-gray-400"
                    )}
                  />
                  {chatState.ttsLoading ? (
                    <div className="flex-1 flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
                      <span className="text-sm text-gray-400">
                        Generating voice...
                      </span>
                    </div>
                  ) : chatState.audioUrl ? (
                    <div className="flex-1 flex items-center gap-3">
                      <audio
                        ref={audioRef}
                        controls
                        autoPlay
                        className="flex-1 h-10"
                        onEnded={handleAudioEnded}
                        onPlay={handleAudioPlay}
                        onPause={handleAudioPause}
                        src={chatState.audioUrl}
                      />
                      {chatState.audioPlaying && (
                        <button
                          onClick={handleStopAudio}
                          className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                          title="Stop audio"
                        >
                          <StopIcon className="h-4 w-4 text-white" />
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {/* Chat input */}
          <div className="max-w-3xl mx-auto">
            <PromptForm
              sessionId={chatState.sessionId}
              input={input}
              setInput={setInput}
              audioRef={audioRef}
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
