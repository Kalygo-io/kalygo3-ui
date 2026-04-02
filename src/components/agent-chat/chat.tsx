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
import { useContext, useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { ContextualAside } from "./contextual-aside";
import { Agent } from "@/services/agentsService";

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
  const chatState = useContext(ChatContext);
  const dispatch = useContext(ChatDispatchContext);
  const { scrollRef, scrollToBottom, isAtBottom } = useScrollAnchor();

  // Track previous message count to detect when a new message is added
  const prevMessageCountRef = useRef(0);

  // Smooth-scroll to bottom whenever a new message is added (count increases).
  // This fires once per message (user send + AI reply creation), not per token.
  useEffect(() => {
    const count = chatState.messages.length;
    if (count > prevMessageCountRef.current) {
      scrollToBottom();
    }
    prevMessageCountRef.current = count;
  }, [chatState.messages.length, scrollToBottom]);

  // During streaming, keep following the content — but ONLY if the user is
  // already at the bottom. Uses instant (non-animated) scrollTop assignment
  // so rapid token updates don't queue up competing smooth animations.
  useEffect(() => {
    if (chatState.completionLoading && isAtBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    // scrollRef is a stable ref — intentionally omitted from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatState.messages, chatState.completionLoading, isAtBottom]);

  if (!dispatch) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-400">
          Chat context is not available. Please refresh the page.
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Scroll-to-bottom button — only visible when the user has scrolled up */}
      {!isAtBottom && (
        <button
          onClick={scrollToBottom}
          className={cn(
            "fixed bottom-6 right-4 sm:right-6 z-40 p-2 rounded-full",
            "bg-gray-700/90 hover:bg-gray-600/90 border border-white/20 hover:border-white/30",
            "text-gray-300 hover:text-white shadow-lg hover:shadow-xl backdrop-blur-sm",
            "transition-all duration-200"
          )}
          title="Scroll to bottom"
        >
          <ChevronDownIcon className="w-4 h-4" />
        </button>
      )}

      <div className="h-full overflow-hidden">
        <div
          className="h-full overflow-y-auto overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8 custom-scrollbar"
          ref={scrollRef}
        >
          <div className={cn("pb-[200px] chat-messages-fade", className)}>
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
                  agent && agent.name === "Cable Label Agent" ? (
                    <>
                      <h1 className="text-center text-5xl leading-[1.5] font-semibold leading-12 text-ellipsis overflow-hidden text-text_default_color p-1">
                        Cable Label Chat ➰
                      </h1>
                      <p className="text-center text-gray-400 mt-2">
                        Drop your rider in below and let the AI help generate
                        the labels (.pdf)
                      </p>
                    </>
                  ) : (
                    <>
                      <h1 className="text-center text-5xl leading-[1.5] font-semibold leading-12 text-ellipsis overflow-hidden text-text_default_color p-1">
                        Agent Chat 🧿
                      </h1>
                      <p className="text-center text-gray-400 mt-2">
                        Send message to your agent and get a response.
                      </p>
                    </>
                  )
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
        onClose={() => setIsDrawerOpen?.(false)}
        agent={agent}
      />
    </>
  );
}
