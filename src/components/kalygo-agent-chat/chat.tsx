"use client";

import {
  ChatContext,
  ChatDispatchContext,
} from "@/app/dashboard/agent-chat/chat-session-context";
import { ChatList } from "@/components/kalygo-agent-chat/chat-list";
import { ChatPanel } from "@/components/shared/chat/chat-panel";
import { EmptyScreen } from "@/components/shared/chat/empty-screen";
import { PromptForm } from "@/components/kalygo-agent-chat/prompt-form";
import { useScrollAnchor } from "@/shared/hooks/use-scroll-anchor";
import { cn } from "@/shared/utils";
import { useContext, useEffect, useState } from "react";
import { ContextualAside } from "./contextual-aside";
import {
  InformationCircleIcon,
  ChevronDownIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { clearSessionMessages } from "@/services/clearSessionMessages";
import { errorToast, successToast } from "@/shared/toasts";

export interface ChatProps extends React.ComponentProps<"div"> {}

export function Chat({ id, className }: ChatProps) {
  const [input, setInput] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const chatState = useContext(ChatContext);
  const dispatch = useContext(ChatDispatchContext);
  const { messagesRef, scrollRef, scrollToBottom } = useScrollAnchor();

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  // Check scroll position and update button visibility
  const checkScrollPosition = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const hasScrollableContent = scrollHeight > clientHeight;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

      setShowScrollButton(hasScrollableContent && !isNearBottom);
    }
  };

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
  }, [scrollRef]);

  // Also check when messages change to catch new content
  useEffect(() => {
    const timer = setTimeout(checkScrollPosition, 100);
    return () => clearTimeout(timer);
  }, [chatState?.messages]);

  const handleScrollToBottom = () => {
    scrollToBottom();
  };

  const handleResetChat = async () => {
    if (!chatState.sessionId) {
      errorToast("No active session to reset");
      return;
    }

    if (!dispatch) {
      errorToast("Chat context not available");
      return;
    }

    if (isResetting) return;

    // Confirm with user
    if (
      !confirm(
        "Are you sure you want to clear all messages in this chat session? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsResetting(true);
    try {
      // Clear messages from API
      await clearSessionMessages(chatState.sessionId);

      // Clear messages from UI state
      dispatch({ type: "SET_MESSAGES", payload: [] });

      successToast("Chat session cleared successfully");
    } catch (error) {
      console.error("Error clearing session messages:", error);
      errorToast(
        `Failed to clear chat session: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      {/* Action Buttons - Fixed positioned in top-right of viewport */}
      <div className="fixed top-20 right-4 z-40 flex items-center space-x-2">
        {/* Reset Chat Button */}
        {chatState.messages.length > 0 && (
          <button
            onClick={handleResetChat}
            disabled={isResetting}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-gray-600 transition-colors text-white shadow-lg"
            title="Reset chat session"
          >
            <ArrowPathIcon
              className={cn(
                "w-4 h-4 text-red-400",
                isResetting && "animate-spin"
              )}
            />
          </button>
        )}

        {/* Toggle Button */}
        <button
          onClick={toggleDrawer}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600 transition-colors text-white shadow-lg"
        >
          <InformationCircleIcon className="w-4 h-4 text-blue-400" />
        </button>
      </div>

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

      <div className="px-4 py-10 sm:px-6 lg:px-8 lg:py-6">
        <div
          className="group w-full overflow-auto pl-0 peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px] scrollbar-hidden"
          ref={scrollRef}
        >
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
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
}
