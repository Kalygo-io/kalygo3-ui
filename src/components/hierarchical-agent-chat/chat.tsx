"use client";

import { useContext, useState, useEffect } from "react";
import { SwarmChatContext, SwarmChatDispatchContext } from "@/app/dashboard/hierarchical-agent-chat/chat-session-context";
import { Agent } from "@/services/agentsService";
import { SwarmChatList } from "./chat-list";
import { SwarmPromptForm } from "./prompt-form";
import { EmptyScreen } from "@/components/shared/chat/empty-screen";
import { useScrollAnchor } from "@/shared/hooks/use-scroll-anchor";
import { cn } from "@/shared/utils";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { v4 as uuid } from "uuid";

export interface HierarchicalAgentChatProps {
  swarmAgents: Agent[];
  loadingAgents: boolean;
  allAgents: Agent[];
}

export function HierarchicalAgentChat({ swarmAgents, loadingAgents }: HierarchicalAgentChatProps) {
  const state = useContext(SwarmChatContext);
  const dispatch = useContext(SwarmChatDispatchContext);
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const { messagesRef, scrollRef, scrollToBottom } = useScrollAnchor();

  useEffect(() => {
    const t = setTimeout(() => scrollToBottom(), 100);
    return () => clearTimeout(t);
  }, [state.messages, state.currentStreamingAgent, scrollToBottom]);

  const selectedAgent = swarmAgents.find((a) => String(a.id) === state.agentId);
  const canSend = Boolean(state.agentId && state.sessionId && !state.completionLoading);

  const handleSelectAgent = (agent: Agent) => {
    if (!dispatch) return;
    dispatch({ type: "SET_AGENT_ID", payload: String(agent.id) });
    dispatch({ type: "SET_SESSION_ID", payload: uuid() });
    dispatch({ type: "SET_MESSAGES", payload: [] });
    setShowAgentDropdown(false);
  };

  const handleNewChat = () => {
    if (!dispatch) return;
    dispatch({ type: "SET_SESSION_ID", payload: uuid() });
    dispatch({ type: "SET_MESSAGES", payload: [] });
  };

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8 lg:py-6">
      {/* Top bar: agent selector + new chat */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAgentDropdown(!showAgentDropdown)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
              "bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
            )}
          >
            {selectedAgent ? selectedAgent.name : "Select swarm agent"}
            <ChevronDownIcon className="h-4 w-4" />
          </button>
          {showAgentDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowAgentDropdown(false)} />
              <div className="absolute left-0 top-full z-20 mt-1 max-h-60 w-72 overflow-auto rounded-lg border border-gray-600 bg-gray-800 py-1 shadow-xl">
                {loadingAgents ? (
                  <div className="px-4 py-3 text-sm text-gray-400">Loading agents...</div>
                ) : swarmAgents.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-400">No hierarchical swarm agents. Create an agent with multiAgentArchitecture: hierarchicalSwarm.</div>
                ) : (
                  swarmAgents.map((agent) => (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => handleSelectAgent(agent)}
                      className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-700"
                    >
                      {agent.name}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
        {state.messages.length > 0 && (
          <button
            type="button"
            onClick={handleNewChat}
            className="rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            New chat
          </button>
        )}
        {state.currentStreamingAgent && (
          <span className="rounded-full bg-emerald-900/40 px-3 py-1 text-xs font-medium text-emerald-300">
            {state.currentStreamingAgent} is typing...
          </span>
        )}
      </div>

      <div className="w-full overflow-auto pl-0" ref={scrollRef}>
        <div className={cn("pb-[200px] chat-messages-fade")} ref={messagesRef}>
          {state.messages.length > 0 ? (
            <SwarmChatList
              messages={state.messages}
              isCompletionLoading={state.completionLoading}
              currentStreamingAgent={state.currentStreamingAgent}
            />
          ) : (
            <EmptyScreen
              content={
                <>
                  <h1 className="text-center text-5xl font-semibold leading-12 text-ellipsis overflow-hidden text-text_default_color p-1">
                    Hierarchical Agent Chat
                  </h1>
                  <p className="text-center text-gray-400 mt-4 max-w-md mx-auto">
                    Select a swarm agent above to start. The director will coordinate worker agents and you’ll see who is responding.
                  </p>
                </>
              }
            />
          )}
        </div>
        {state.agentId && (
          <div className="fixed inset-x-0 bottom-0 z-10 mx-auto lg:max-w-[calc(100%-18rem)]">
            <div className="mx-8 border-t border-gray-700 bg-black/95 px-4 py-2 shadow-lg rounded-t-xl">
              <SwarmPromptForm />
              <p className="text-center text-xs text-gray-500 mt-2">Made with ❤️ in Miami 🌴</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
