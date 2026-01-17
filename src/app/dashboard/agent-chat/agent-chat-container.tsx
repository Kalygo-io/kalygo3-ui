"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { agentsService, Agent } from "@/services/agentsService";
import { errorToast } from "@/shared/toasts/errorToast";
import {
  ChatBubbleLeftRightIcon,
  ArrowRightIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { AgentChatInterface } from "./agent-chat-interface";

export function AgentChatContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(
    searchParams.get("agent_id")
  );

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await agentsService.listAgents();
      setAgents(data);
    } catch (error: any) {
      errorToast(error.message || "Failed to load agents");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    const url = new URL(window.location.href);
    url.searchParams.set("agent_id", agentId);
    window.history.replaceState({}, "", url.toString());
  };

  const handleStartChat = () => {
    if (selectedAgentId) {
      // Update URL to include agent_id - this will trigger the chat interface
      const url = new URL(window.location.href);
      url.searchParams.set("agent_id", selectedAgentId);
      window.history.replaceState({}, "", url.toString());
      setSelectedAgentId(selectedAgentId);
    }
  };

  // If agent is selected via URL param, show chat interface
  const agentIdFromUrl = searchParams.get("agent_id");
  useEffect(() => {
    if (agentIdFromUrl && agentIdFromUrl !== selectedAgentId) {
      setSelectedAgentId(agentIdFromUrl);
    }
  }, [agentIdFromUrl, selectedAgentId]);

  // If an agent is selected, show the chat interface
  if (selectedAgentId) {
    // Import and render the chat interface component
    // For now, we'll create a separate component for this
    return (
      <AgentChatInterface
        agentId={selectedAgentId}
        onBack={() => {
          setSelectedAgentId(null);
          const url = new URL(window.location.href);
          url.searchParams.delete("agent_id");
          window.history.replaceState({}, "", url.toString());
        }}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Agent Chat</h1>
          </div>
          <p className="text-gray-400">
            Select an agent to start a conversation
          </p>
        </div>

        {/* Agent Selection */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-400">Loading agents...</div>
          </div>
        ) : agents.length === 0 ? (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 text-center">
            <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-1">No agents found</p>
            <p className="text-gray-500 text-sm mb-4">
              Create your first agent to get started
            </p>
            <button
              onClick={() => router.push("/dashboard/agents/create")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              <PlusIcon className="h-5 w-5" />
              Create Agent
            </button>
          </div>
        ) : (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Select an Agent
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => handleSelectAgent(agent.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedAgentId === agent.id
                        ? "border-blue-500 bg-blue-600/20"
                        : "border-gray-700 bg-gray-900/50 hover:border-gray-600 hover:bg-gray-900/70"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold mb-1">
                          {agent.name}
                        </h3>
                        {agent.config?.data?.systemPrompt && (
                          <p className="text-gray-400 text-sm line-clamp-2">
                            {agent.config.data.systemPrompt}
                          </p>
                        )}
                        {agent.status && (
                          <span
                            className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${
                              agent.status === "active"
                                ? "bg-green-600/20 text-green-400"
                                : "bg-gray-600/20 text-gray-400"
                            }`}
                          >
                            {agent.status}
                          </span>
                        )}
                      </div>
                      <ArrowRightIcon
                        className={`h-5 w-5 flex-shrink-0 ml-2 ${
                          selectedAgentId === agent.id
                            ? "text-blue-400"
                            : "text-gray-500"
                        }`}
                      />
                    </div>
                  </button>
                ))}
              </div>
              {selectedAgentId && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleStartChat}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    Start Chat
                    <ArrowRightIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
