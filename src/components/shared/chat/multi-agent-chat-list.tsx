import { ChatMessage } from "@/components/shared/chat/multi-agent-chat-message";
import { Message } from "@/ts/types/Message";

export interface P {
  isCompletionLoading: boolean;
  messages: Message[];
}

export function ChatList(P: P) {
  if (!P.messages.length) {
    return null;
  }

  return (
    <div className="relative mx-auto max-w-2xl px-4">
      {P.messages.map((message: Message, index: number) => {
        return <ChatMessage key={message.id} index={index} message={message} />;
      })}

      {P.isCompletionLoading && (
        <div className="flex justify-center">
          <svg
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
            className="size-5 animate-spin stroke-white"
          >
            <path d="M12 3v3m6.366-.366-2.12 2.12M21 12h-3m.366 6.366-2.12-2.12M12 21v-3m-6.366.366 2.12-2.12M3 12h3m-.366-6.366 2.12 2.12"></path>
          </svg>
        </div>
      )}
    </div>
  );
}
