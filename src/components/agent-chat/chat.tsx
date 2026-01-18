"use client";

import {
  ChatContext,
  ChatDispatchContext,
} from "@/app/dashboard/agent-chat/chat-session-context";
import { ChatList } from "@/components/agent-chat/chat-list";
import { ChatPanel } from "@/components/shared/chat/chat-panel";
import { EmptyScreen } from "@/components/shared/chat/empty-screen";
import { PromptForm } from "@/components/agent-chat/prompt-form";
import { useScrollAnchor } from "@/shared/hooks/use-scroll-anchor";
import { cn } from "@/shared/utils";
import { useContext, useEffect, useState, useCallback } from "react";
// ContextualAside removed - can be added later if needed
// import { ContextualAside } from "./contextual-aside";
import {
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { ContextualAside } from "./contextual-aside";
import { Agent } from "@/services/agentsService";

export interface ChatProps extends React.ComponentProps<"div"> {
  agent?: Agent | null;
  isDrawerOpen?: boolean;
  setIsDrawerOpen?: (open: boolean) => void;
}

export function Chat({ id, className, agent, isDrawerOpen = false, setIsDrawerOpen }: ChatProps) {
  const [input, setInput] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const chatState = useContext(ChatContext);
  const dispatch = useContext(ChatDispatchContext);
  const { messagesRef, scrollRef, scrollToBottom, visibilityRef, isAtBottom } = useScrollAnchor();

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
    if (chatState.messages.length > 0 && (isAtBottom || chatState.completionLoading)) {
      // Small delay to ensure DOM has updated
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [chatState.messages, chatState.completionLoading, isAtBottom, scrollToBottom]);

  // Early return check AFTER all hooks
  if (!dispatch) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-400">Chat context is not available. Please refresh the page.</div>
      </div>
    );
  }

  const handleScrollToBottom = () => {
    scrollToBottom();
  };

  return (
    <>

      {/* Floating Scroll to Bottom Button - Integrated with input area */}
      <button
        onClick={handleScrollToBottom}
        className={cn(
          "fixed bottom-6 z-40 p-2 rounded-full bg-gray-700/90 hover:bg-gray-600/90 border border-white/20 hover:border-white/30 transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm",
          "text-gray-300 hover:text-white",
          // Responsive positioning - further from edge on mobile, closer on desktop
          "right-4 sm:right-6",
          // Temporarily always visible for testing
          "opacity-100 translate-y-0 scale-100"
          // showScrollButton
          //   ? "opacity-100 translate-y-0 scale-100"
          //   : "opacity-0 translate-y-2 scale-95 pointer-events-none"
        )}
        title="Scroll to bottom"
      >
        <ChevronDownIcon className="w-4 h-4" />
      </button>

      <div className="h-full overflow-hidden">
        <div className="h-full overflow-y-auto overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8 custom-scrollbar" ref={scrollRef}>
          <div
            className={cn("pb-[200px] chat-messages-fade", className)}
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
                      Agent Chat 🧿
                    </h1>
                  </>
                }
              />
            )}
            {/* Visibility anchor for auto-scroll */}
            <div ref={visibilityRef} className="h-px" />
          </div>
          <ChatPanel
            sessionId={chatState.sessionId}
            input={input}
            setInput={setInput}
            promptForm={PromptForm}
          />
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
