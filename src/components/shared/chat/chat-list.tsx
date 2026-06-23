import { ChatMessage } from "@/components/shared/chat/chat-message";
import { ToolApprovalCard } from "@/components/agent-chat/tool-approval-card";
import { ToolStatus } from "@/components/shared/chat/tool-status";
import { Message } from "@/ts/types/Message";
import { cn } from "@/shared/utils";
import { ChatAccent } from "@/components/shared/chat/accent";

export interface ChatListProps {
  isCompletionLoading: boolean;
  messages: Message[];
  currentTool: string;
  accent?: ChatAccent;
  /** Tailwind max-width token used for the centered column (e.g. "7xl", "2xl"). */
  maxWidth?: string;
  /** When true (agent), render ToolApprovalCard for role "tool_approval". */
  enableToolApproval?: boolean;
}

export function ChatList({
  isCompletionLoading,
  messages,
  currentTool,
  accent = "blue",
  maxWidth = "7xl",
  enableToolApproval = true,
}: ChatListProps) {
  if (!messages.length) {
    return null;
  }

  // tts uses the "label" tool-status variant (centered 🔧 line); agent uses
  // the "plain" right-aligned variant.
  const toolStatusVariant = accent === "purple" ? "label" : "plain";

  // agent only shows the tool status while loading AND a tool is active; tts
  // shows it whenever a tool is active.
  const showToolStatus =
    accent === "purple" ? !!currentTool : isCompletionLoading && !!currentTool;

  // Full literal class strings so Tailwind's JIT picks them up.
  const maxWidthClass =
    maxWidth === "2xl"
      ? "max-w-2xl"
      : maxWidth === "7xl"
        ? "max-w-7xl"
        : `max-w-${maxWidth}`;

  return (
    <div className={cn("relative mx-auto px-4", maxWidthClass)}>
      {messages.map((message: Message, index: number) => {
        if (
          enableToolApproval &&
          message.role === "tool_approval" &&
          message.toolApproval
        ) {
          return (
            <ToolApprovalCard
              key={message.id}
              toolApproval={message.toolApproval}
            />
          );
        }
        return (
          <ChatMessage
            key={message.id}
            index={index}
            message={message}
            accent={accent}
          />
        );
      })}

      {isCompletionLoading && (
        <div className="flex flex-col items-center justify-center">
          <svg
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
            className="size-5 animate-spin text-text_default_color"
          >
            <path d="M12 3v3m6.366-.366-2.12 2.12M21 12h-3m.366 6.366-2.12-2.12M12 21v-3m-6.366.366 2.12-2.12M3 12h3m-.366-6.366 2.12 2.12"></path>
          </svg>

          {showToolStatus && (
            <ToolStatus
              currentTool={currentTool}
              accent={accent}
              variant={toolStatusVariant}
            />
          )}
        </div>
      )}
    </div>
  );
}
