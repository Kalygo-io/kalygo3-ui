import { ConciergeChatMessage } from "@/components/concierge-chat/chat-message";
import { ToolStatus } from "@/components/concierge-chat/tool-status";
import { Message } from "@/ts/types/Message";

export interface ConciergeChatListProps {
  isCompletionLoading: boolean;
  messages: Message[];
  currentTool: string;
}

export function ConciergeChatList({
  isCompletionLoading,
  messages,
  currentTool,
}: ConciergeChatListProps) {
  if (!messages.length) {
    return null;
  }

  return (
    <div className="relative mx-auto max-w-2xl px-4">
      {messages.map((message: Message, index: number) => {
        return <ConciergeChatMessage key={message.id} index={index} message={message} />;
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

          {currentTool && <ToolStatus currentTool={currentTool} />}
        </div>
      )}
    </div>
  );
}
