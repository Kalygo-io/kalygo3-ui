"use client";

import { SwarmChatMessage } from "./chat-message";
import { Message } from "@/ts/types/Message";

export interface SwarmChatListProps {
  messages: Message[];
  isCompletionLoading: boolean;
  currentStreamingAgent: string | null;
}

export function SwarmChatList({ messages, isCompletionLoading, currentStreamingAgent }: SwarmChatListProps) {
  if (!messages.length) return null;

  return (
    <div className="relative mx-auto max-w-2xl px-4">
      {messages.map((message, index) => (
        <SwarmChatMessage key={message.id} index={index} message={message} />
      ))}
      {isCompletionLoading && !currentStreamingAgent && (
        <div className="flex justify-center py-4">
          <div className="size-5 animate-spin rounded-full border-2 border-gray-500 border-t-white" />
        </div>
      )}
    </div>
  );
}
