"use client";

import { memo } from "react";
import { Message } from "@/ts/types/Message";
import { cn } from "@/shared/utils";
import { BiUser } from "react-icons/bi";
import { GiArtificialIntelligence } from "react-icons/gi";
import { ChatMarkdown } from "@/components/shared/markdown/chat-markdown";
import { Separator } from "@/components/shared/separator";

interface SwarmChatMessageProps {
  index: number;
  message: Message;
}

function AgentLabel({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-700/60 px-2 py-0.5 text-xs font-medium text-gray-300">
      <GiArtificialIntelligence className="h-3.5 w-3.5" />
      {name}
    </span>
  );
}

export const SwarmChatMessage = memo(function SwarmChatMessage({ message }: SwarmChatMessageProps) {
  const isHuman = message.role === "human";
  const agentName = message.agentName;

  return (
    <div key={message.id} className="mb-6">
      <div
        className={cn(
          "group relative rounded-xl border p-6 transition-all",
          isHuman
            ? "bg-white/10 border-white/20"
            : "bg-gray-800/50 border-gray-700/50",
          message.error && "border-red-500/50 bg-red-900/10"
        )}
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full border-2",
              isHuman
                ? "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400/30 text-white"
                : "bg-gradient-to-br from-purple-500 to-purple-600 border-purple-400/30 text-white",
              message.error && "border-red-500/50 from-red-500 to-red-600"
            )}
          >
            {isHuman ? (
              <BiUser className="text-lg" />
            ) : (
              <GiArtificialIntelligence className="text-lg" />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            {!isHuman && agentName && <AgentLabel name={agentName} />}
            <div className={cn("prose prose-invert max-w-none", message.error && "text-red-400")}>
              <ChatMarkdown content={message.content || (message.error?.message ?? "")} />
            </div>
          </div>
        </div>
      </div>
      <Separator className="my-6 bg-gradient-to-r from-transparent via-gray-600/30 to-transparent" />
    </div>
  );
});
