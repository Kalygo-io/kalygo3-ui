import { cn } from "@/shared/utils";
import { Message } from "@/ts/types/Message";
import { BiUser } from "react-icons/bi";
import { GiArtificialIntelligence } from "react-icons/gi";
import {
  CheckIcon,
  ClipboardDocumentIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

import { Separator } from "@/components/shared/separator";
import { memo, useState } from "react";
import { ChatMarkdown } from "@/components/shared/markdown/chat-markdown";
import { ToolCallsDrawer } from "@/components/shared/chat/tool-calls-drawer";
import { ErrorDetailsDrawer } from "@/components/shared/chat/error-details-drawer";
import { useCopyToClipboard } from "@/shared/hooks/use-copy-to-clipboard";
import { ChatAccent, getAccentClasses } from "@/components/shared/chat/accent";

interface ChatMessageProps {
  index: number;
  message: Message;
  accent?: ChatAccent;
}

// Simple message actions component for Message type
function MessageActions({ message }: { message: Message }) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });

  const onCopy = () => {
    if (isCopied) return;
    copyToClipboard(message.content);
  };

  return (
    <div className="flex items-center justify-end transition-all duration-200 group-hover:opacity-100 opacity-0 group-hover:translate-x-0 translate-x-2">
      <button
        className="relative p-2 rounded-lg bg-gray-800/80 hover:bg-gray-700/80 border border-gray-600/50 hover:border-gray-500/50 transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-sm shadow-lg hover:shadow-xl"
        onClick={onCopy}
        title="Copy message"
      >
        <div className="relative">
          {isCopied ? (
            <CheckIcon
              className="h-4 w-4 text-green-400"
              style={{ color: "#4ade80" }}
            />
          ) : (
            <ClipboardDocumentIcon className="h-4 w-4 text-gray-300 hover:text-white transition-colors duration-200" />
          )}
        </div>
      </button>
    </div>
  );
}

export const ChatMessage = memo(
  function ChatMessage({ index, message, accent = "blue" }: ChatMessageProps) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isErrorDrawerOpen, setIsErrorDrawerOpen] = useState(false);
    const a = getAccentClasses(accent);
    const defaultExpandAll = accent === "purple";

    if (message.role === "ai" || message.role === "human") {
      return (
        <>
          <div key={message.id}>
            <div
              className={cn(
                "group relative mb-6 items-start p-6 rounded-xl transition-all duration-200",
                message.role === "human"
                  ? "bg-white/10 backdrop-blur-sm border border-white/20"
                  : cn("bg-gray-800/50 backdrop-blur-sm border", a.aiBorder),
                "flex hover:shadow-lg hover:scale-[1.001]",
                message.error && "border-red-500/50 bg-red-900/10"
              )}
            >
              <div
                className={cn(
                  "flex size-10 shrink-0 select-none items-center justify-center rounded-full border-2 shadow-lg transition-all duration-200",
                  message.role === "human"
                    ? "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400/30 text-white"
                    : "bg-gradient-to-br from-purple-500 to-purple-600 border-purple-400/30 text-white",
                  `${
                    message.error &&
                    "border-red-500/50 bg-gradient-to-br from-red-500 to-red-600"
                  }`
                )}
              >
                {message.role === "human" ? (
                  <BiUser className="text-lg" />
                ) : (
                  <GiArtificialIntelligence className="text-lg" />
                )}
              </div>
              <div
                className={cn(
                  `px-4 space-y-3 overflow-hidden`,
                  "ml-4 flex-1",
                  message.error && "text-red-400"
                )}
              >
                <ChatMarkdown content={message.content} />

                {/* Error Button */}
                {message.error && (
                  <div className="mt-4">
                    <button
                      onClick={() => setIsErrorDrawerOpen(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-900/20 hover:bg-red-900/30 border border-red-700/50 rounded-lg transition-colors text-white"
                    >
                      <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />
                      <span className="text-sm font-medium text-red-400">
                        View Error Details
                      </span>
                    </button>
                  </div>
                )}

                {/* Tool Calls Button for AI messages */}
                {message.role === "ai" &&
                  !message.error &&
                  ((message.toolCalls && message.toolCalls.length > 0) ||
                    (message.retrievalCalls &&
                      message.retrievalCalls.length > 0)) && (
                    <div className="mt-4">
                      <button
                        onClick={() => setIsDrawerOpen(true)}
                        className={cn(
                          "flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-white",
                          a.toolButtonBg
                        )}
                      >
                        <DocumentTextIcon
                          className={cn("w-4 h-4", a.toolButtonIcon)}
                        />
                        <span className="text-sm font-medium">
                          Tool Calls & References (
                          {(message.toolCalls?.length || 0) +
                            (message.retrievalCalls?.length || 0)})
                        </span>
                      </button>
                    </div>
                  )}
              </div>
              {/* MessageActions positioned on the right side */}
              <div className="flex-shrink-0 ml-2">
                <MessageActions message={message} />
              </div>
            </div>
            <Separator className={cn("my-6", a.separator)} />
          </div>

          {/* Tool Calls Drawer */}
          <ToolCallsDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            toolCalls={message.toolCalls || []}
            retrievalCalls={message.retrievalCalls || []}
            accent={accent}
            defaultExpandAll={defaultExpandAll}
          />

          {/* Error Details Drawer */}
          {message.error && (
            <ErrorDetailsDrawer
              isOpen={isErrorDrawerOpen}
              onClose={() => setIsErrorDrawerOpen(false)}
              error={message.error}
              accent={accent}
            />
          )}
        </>
      );
    } else {
      return <div key={index}>UNSUPPORTED MESSAGE</div>;
    }
  },
  (prevProps, nextProps) => {
    return prevProps.message === nextProps.message;
  }
);
