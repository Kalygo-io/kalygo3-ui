"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { agentsService, Agent, getAgentModelConfig, TOOL_TYPE_METADATA } from "@/services/agentsService";
import { errorToast } from "@/shared/toasts/errorToast";
import { ArrowRightIcon, PlusIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";

export function AgentsContainer() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleViewDetails = (agentId: string) => {
    router.push(`/dashboard/agent?agent_id=${encodeURIComponent(agentId)}`);
  };

  const handleCreate = () => {
    router.push("/dashboard/agents/create");
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
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-semibold text-white">Agents</h1>
        <button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Create Agent
        </button>
      </div>

      {agents.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-12 text-center">
          <p className="text-gray-400 text-lg mb-4">No agents found</p>
          <p className="text-gray-500 text-sm mb-6">
            You don&apos;t have any agents yet. Create one to get started.
          </p>
          <button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 inline-flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Create Agent
          </button>
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

const TOOL_DISPLAY_LIMIT = 4;

function AgentCard({
  agent,
  onViewDetails,
}: {
  agent: Agent;
  onViewDetails: () => void;
}) {
  const modelConfig = getAgentModelConfig(agent);
  const isOwner = agent.is_owner !== false;
  const tools = agent.config?.data?.tools ?? [];
  const visibleTools = tools.slice(0, TOOL_DISPLAY_LIMIT);
  const hiddenCount = tools.length - visibleTools.length;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 transition-all duration-200 hover:shadow-lg hover:border-gray-600/50 flex flex-col">
      <div className="flex-1 mb-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-semibold text-white">{agent.name}</h3>
          {!isOwner && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-600/20 text-indigo-300 border border-indigo-500/40">
              Shared
            </span>
          )}
        </div>
        {agent.description && (
          <p className="text-sm text-gray-400 mb-4">{agent.description}</p>
        )}
        <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
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

        {/* Tools section */}
        <div className="border-t border-gray-700/50 pt-3">
          <div className="flex items-center gap-1.5 mb-2">
            <WrenchScrewdriverIcon className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-xs text-gray-500 font-medium">
              {tools.length === 0
                ? "No tools"
                : `${tools.length} tool${tools.length !== 1 ? "s" : ""}`}
            </span>
          </div>
          {tools.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {visibleTools.map((tool, i) => {
                const meta = TOOL_TYPE_METADATA[tool.type];
                return (
                  <span
                    key={i}
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-900/60 ${meta.borderClass} ${meta.iconClass}`}
                  >
                    {meta.label}
                  </span>
                );
              })}
              {hiddenCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-gray-600/50 text-gray-400 bg-gray-900/60">
                  +{hiddenCount} more
                </span>
              )}
            </div>
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
