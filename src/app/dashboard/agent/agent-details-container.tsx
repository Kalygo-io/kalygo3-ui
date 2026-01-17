"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { agentsService, Agent } from "@/services/agentsService";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";
import { ArrowLeftIcon, TrashIcon } from "@heroicons/react/24/outline";

export function AgentDetailsContainer({ agentId }: { agentId?: string }) {
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!agentId) {
      errorToast("Agent ID is required");
      router.push("/dashboard/agents");
      return;
    }

    loadAgent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  const loadAgent = async () => {
    if (!agentId) return;

    try {
      setLoading(true);
      const data = await agentsService.getAgent(agentId);
      setAgent(data);
    } catch (error: any) {
      errorToast(error.message || "Failed to load agent");
      router.push("/dashboard/agents");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!agentId || !agent) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${agent.name}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      await agentsService.deleteAgent(agentId);
      successToast(`Agent "${agent.name}" deleted successfully`);
      router.push("/dashboard/agents");
    } catch (error: any) {
      errorToast(error.message || "Failed to delete agent");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Loading agent details...</div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Agent not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard/agents")}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-400" />
          </button>
          <h1 className="text-4xl font-semibold text-white">{agent.name}</h1>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Delete agent"
        >
          <TrashIcon className="h-5 w-5" />
          <span className="text-sm font-medium">
            {deleting ? "Deleting..." : "Delete"}
          </span>
        </button>
      </div>

      {/* Agent Details */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-400">
                  Agent ID
                </label>
                <p className="text-white mt-1">{agent.id}</p>
              </div>
              {agent.status && (
                <div>
                  <label className="text-sm font-medium text-gray-400">
                    Status
                  </label>
                  <p className="text-white mt-1">{agent.status}</p>
                </div>
              )}
              {agent.created_at && (
                <div>
                  <label className="text-sm font-medium text-gray-400">
                    Created At
                  </label>
                  <p className="text-white mt-1">
                    {new Date(agent.created_at).toLocaleString()}
                  </p>
                </div>
              )}
              {agent.updated_at && (
                <div>
                  <label className="text-sm font-medium text-gray-400">
                    Updated At
                  </label>
                  <p className="text-white mt-1">
                    {new Date(agent.updated_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* System Prompt */}
          {(agent.systemPrompt || agent.description) && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                System Prompt
              </h2>
              <p className="text-gray-300">{agent.systemPrompt || agent.description}</p>
            </div>
          )}

          {/* Additional Properties */}
          {Object.keys(agent).some(
            (key) =>
              !["id", "name", "systemPrompt", "description", "created_at", "updated_at", "status", "owner_id"].includes(
                key
              )
          ) && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                Additional Details
              </h2>
              <div className="bg-gray-900/50 rounded-lg p-4">
                <pre className="text-sm text-gray-300 overflow-x-auto">
                  {JSON.stringify(
                    Object.fromEntries(
                      Object.entries(agent).filter(
                        ([key]) =>
                          !["id", "name", "systemPrompt", "description", "created_at", "updated_at", "status", "owner_id"].includes(
                            key
                          )
                      )
                    ),
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
