import { ChatMessage } from "@/components/shared/chat/chat-message";
import { Message } from "@/ts/types/Message";

interface TtsChatMessageProps {
  index: number;
  message: Message;
}

export function TtsChatMessage({ index, message }: TtsChatMessageProps) {
  return <ChatMessage index={index} message={message} accent="purple" />;
}
