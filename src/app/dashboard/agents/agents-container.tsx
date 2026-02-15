"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { agentsService, Agent, getAgentVersion, getAgentModelConfig } from "@/services/agentsService";
import { errorToast } from "@/shared/toasts/errorToast";
import { ArrowRightIcon, PlusIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

export function AgentsContainer() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setShowCreateMenu(false);
    if (showCreateMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showCreateMenu]);

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

  const handleViewDetails = (agentId: string) => {
    router.push(`/dashboard/agent?agent_id=${encodeURIComponent(agentId)}`);
  };

  const handleCreateV1 = () => {
    router.push("/dashboard/agents/create");
  };

  const handleCreateV2 = () => {
    router.push("/dashboard/agents/create-v2");
  };

  const handleCreateV3 = () => {
    router.push("/dashboard/agents/create-v3");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Loading agents...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-semibold text-white">Agents</h1>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowCreateMenu(!showCreateMenu);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Create Agent
            <ChevronDownIcon className="h-4 w-4" />
          </button>
          {showCreateMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-10">
              <button
                onClick={handleCreateV1}
                className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors text-white"
              >
                <div className="font-medium">Create Agent v1</div>
                <div className="text-xs text-gray-400 mt-1">Legacy schema with knowledge bases</div>
              </button>
              <button
                onClick={handleCreateV2}
                className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors text-white border-t border-gray-700"
              >
                <div className="font-medium">Create Agent v2</div>
                <div className="text-xs text-gray-400 mt-1">Enhanced tools (default model)</div>
              </button>
              <button
                onClick={handleCreateV3}
                className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors text-white border-t border-gray-700"
              >
                <div className="font-medium flex items-center gap-2">
                  Create Agent v3
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-600/20 text-blue-300 border border-blue-500/40">
                    Recommended
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-1">Model selection + enhanced tools</div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Agents List */}
      {agents.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-12 text-center">
          <p className="text-gray-400 text-lg mb-4">No agents found</p>
          <p className="text-gray-500 text-sm mb-6">
            You don&apos;t have any agents yet. Create one to get started.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={handleCreateV1}
              className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 inline-flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Create Agent v1
            </button>
            <button
              onClick={handleCreateV2}
              className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 inline-flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Create Agent v2
            </button>
            <button
              onClick={handleCreateV3}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 inline-flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Create Agent v3
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onViewDetails={() => handleViewDetails(agent.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AgentCard({
  agent,
  onViewDetails,
}: {
  agent: Agent;
  onViewDetails: () => void;
}) {
  const version = getAgentVersion(agent);
  const modelConfig = getAgentModelConfig(agent);
  const isV3 = version === 3;
  const isModern = version >= 2;
  const isOwner = agent.is_owner !== false;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 transition-all duration-200 hover:shadow-lg hover:border-gray-600/50 flex flex-col">
      <div className="flex-1 mb-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-semibold text-white">{agent.name}</h3>
          <div className="flex items-center gap-2">
            {!isOwner && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-600/20 text-indigo-300 border border-indigo-500/40">
                Shared
              </span>
            )}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                isV3
                  ? "bg-green-600/20 text-green-300 border border-green-500/40"
                  : isModern
                  ? "bg-blue-600/20 text-blue-300 border border-blue-500/40"
                  : "bg-gray-700/50 text-gray-400 border border-gray-600/40"
              }`}
            >
              v{version}
            </span>
          </div>
        </div>
        {agent.description && (
          <p className="text-sm text-gray-400 mb-4">{agent.description}</p>
        )}
        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
          <span className="px-2 py-1 bg-gray-700/50 rounded capitalize">
            {modelConfig.provider}: {modelConfig.model}
          </span>
          {agent.status && (
            <span className="px-2 py-1 bg-gray-700/50 rounded">
              Status: {agent.status}
            </span>
          )}
          {agent.created_at && (
            <span className="px-2 py-1 bg-gray-700/50 rounded">
              Created: {new Date(agent.created_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onViewDetails}
        className="mt-auto w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
      >
        View Details
        <ArrowRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
