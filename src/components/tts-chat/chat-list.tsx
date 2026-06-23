import { ChatList } from "@/components/shared/chat/chat-list";
import { Message } from "@/ts/types/Message";

export interface TtsChatListProps {
  isCompletionLoading: boolean;
  messages: Message[];
  currentTool: string;
}

export function TtsChatList({
  isCompletionLoading,
  messages,
  currentTool,
}: TtsChatListProps) {
  return (
    <ChatList
      isCompletionLoading={isCompletionLoading}
      messages={messages}
      currentTool={currentTool}
      accent="purple"
      maxWidth="2xl"
      enableToolApproval={false}
    />
  );
}
