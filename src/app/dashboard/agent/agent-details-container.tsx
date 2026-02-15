"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  agentsService,
  Agent,
  AgentConfig,
  AgentConfigData,
  AgentConfigDataV1,
  KnowledgeBase,
  getAgentVersion,
  AgentConfigV1,
  UpdateAgentRequest,
} from "@/services/agentsService";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";
import { AgentDetailsV2 } from "./agent-details-v2";
import { AgentDetailsV3 } from "./agent-details-v3";
import {
  ArrowLeftIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  PencilIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import {
  vectorStoresService,
  Index,
  Namespace,
} from "@/services/vectorStoresService";
import { AddKnowledgeBaseModal } from "../agents/create/add-knowledge-base-modal";
import { KnowledgeBaseChip } from "../agents/create/knowledge-base-chip";
import { AgentSharingPanel } from "@/components/agent-sharing/agent-sharing-panel";

export function AgentDetailsContainer({ agentId }: { agentId?: string }) {
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [configVersion, setConfigVersion] = useState<number>(1);
  const [showKnowledgeBaseModal, setShowKnowledgeBaseModal] = useState(false);
  const [editingKnowledgeBaseIndex, setEditingKnowledgeBaseIndex] = useState<number | null>(null);

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
      
      // Extract config data
      if (data.config) {
        setName(data.name || "");
        setSystemPrompt(data.config.data?.systemPrompt || "");
        setKnowledgeBases((data.config as AgentConfigV1).data?.knowledgeBases || []);
        setConfigVersion(data.config.version || 1);
      } else {
        // Fallback for older format
        setName(data.name || "");
        setSystemPrompt(data.systemPrompt || data.description || "");
        setKnowledgeBases([]);
        setConfigVersion(1);
      }
    } catch (error: any) {
      errorToast(error.message || "Failed to load agent");
      router.push("/dashboard/agents");
    } finally {
      setLoading(false);
    }
  };

  // Route to appropriate component based on agent version
  if (agent) {
    const version = getAgentVersion(agent);
    if (version === 3) {
      return <AgentDetailsV3 agentId={agentId} />;
    }
    if (version === 2) {
      return <AgentDetailsV2 agentId={agentId} />;
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentId) return;

    if (!name.trim()) {
      errorToast("Agent name is required");
      return;
    }

    if (!systemPrompt.trim()) {
      errorToast("System prompt is required");
      return;
    }

    try {
      setSaving(true);
      
      const configData: AgentConfigDataV1 = {
        systemPrompt: systemPrompt.trim(),
        knowledgeBases: knowledgeBases,
      };

      const updateData: UpdateAgentRequest = {
        name: name.trim(),
        config: {
          schema: "agent_config" as const,
          version: 1 as const,
          data: configData,
        },
      };

      const updatedAgent = await agentsService.updateAgent(agentId, updateData);
      setAgent(updatedAgent);
      successToast("Agent updated successfully");
    } catch (error: any) {
      errorToast(error.message || "Failed to update agent");
    } finally {
      setSaving(false);
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

  const handleAddKnowledgeBase = (kb: KnowledgeBase) => {
    if (editingKnowledgeBaseIndex !== null) {
      // Update existing knowledge base
      setKnowledgeBases((prev) => {
        const updated = [...prev];
        updated[editingKnowledgeBaseIndex] = kb;
        return updated;
      });
      setEditingKnowledgeBaseIndex(null);
    } else {
      // Add new knowledge base
      // Check for duplicates before updating state
      const isDuplicate = knowledgeBases.some(
        (existing) =>
          existing.provider === kb.provider &&
          existing.index === kb.index &&
          existing.namespace === kb.namespace
      );

      if (isDuplicate) {
        errorToast("This knowledge base is already added");
        return;
      }

      // Use functional update to ensure we have the latest state
      setKnowledgeBases((prev) => {
        return [...prev, kb];
      });

      // Show success toast after state update
      successToast(`Knowledge base "${kb.index} / ${kb.namespace}" added`);
    }
    setShowKnowledgeBaseModal(false);
  };

  const handleRemoveKnowledgeBase = (index: number) => {
    setKnowledgeBases(knowledgeBases.filter((_, i) => i !== index));
  };

  const handleEditKnowledgeBase = (index: number) => {
    setEditingKnowledgeBaseIndex(index);
    setShowKnowledgeBaseModal(true);
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

  const editingKnowledgeBase = editingKnowledgeBaseIndex !== null 
    ? knowledgeBases[editingKnowledgeBaseIndex] 
    : null;

  // Ownership: default to true for backwards compat
  const isOwner = agent.owned !== false;

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
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-semibold text-white">{agent.name}</h1>
            {!isOwner && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-600/20 text-indigo-300 border border-indigo-500/40">
                Shared with you
              </span>
            )}
          </div>
        </div>
        {isOwner && (
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
        )}
      </div>

      {/* Basic Information */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
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

      {/* Agent Config Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              Agent Config v{configVersion}
            </h2>
          </div>

          <div className="space-y-6">
            {/* Agent Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Agent Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* System Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                System Prompt *
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Enter the system prompt for this agent..."
                rows={6}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
              <p className="text-gray-400 text-xs mt-2">
                The system prompt that guides your agent&apos;s behavior and responses.
              </p>
            </div>

            {/* Knowledge Bases */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-300">
                  Knowledge Bases
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setEditingKnowledgeBaseIndex(null);
                    setShowKnowledgeBaseModal(true);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Knowledge Base
                </button>
              </div>

              {knowledgeBases.length === 0 ? (
                <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-8 text-center">
                  <p className="text-gray-400 text-sm mb-4">
                    No knowledge bases added yet
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingKnowledgeBaseIndex(null);
                      setShowKnowledgeBaseModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Your First Knowledge Base
                  </button>
                </div>
              ) : (
                <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-800/50 border-b border-gray-700/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Provider
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Index
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Namespace
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700/50">
                        {knowledgeBases.map((kb, index) => {
                          const canNavigate =
                            kb.provider === "pinecone" && kb.index;

                          return (
                            <tr
                              key={index}
                              className="hover:bg-gray-800/30 transition-colors"
                            >
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="text-sm text-white font-medium capitalize">
                                  {kb.provider}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="text-sm text-gray-300">
                                  {kb.index || (
                                    <span className="text-gray-500 italic">
                                      —
                                    </span>
                                  )}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="text-sm text-gray-300">
                                  {kb.namespace || (
                                    <span className="text-gray-500 italic">
                                      (default)
                                    </span>
                                  )}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-gray-300">
                                  {kb.description || (
                                    <span className="text-gray-500 italic">
                                      No description
                                    </span>
                                  )}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {canNavigate && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        router.push(
                                          `/dashboard/vector-stores?indexName=${encodeURIComponent(kb.index!)}`
                                        )
                                      }
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 text-sm font-medium rounded-lg border border-blue-500/40 transition-colors duration-200"
                                      title="View details"
                                    >
                                      <LinkIcon className="h-4 w-4" />
                                      View Details
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditKnowledgeBase(index);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-600/20 rounded-lg transition-colors duration-200"
                                    title="Edit knowledge base"
                                    aria-label="Edit knowledge base"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveKnowledgeBase(index);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-600/20 rounded-lg transition-colors duration-200"
                                    title="Remove knowledge base"
                                    aria-label="Remove knowledge base"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <p className="text-gray-400 text-xs mt-2">
                Optional: Zero or more knowledge base bindings used by the agent.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button (owners only) */}
        {isOwner && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </form>

      {/* Sharing Panel (owners only) */}
      {isOwner && agentId && (
        <AgentSharingPanel agentId={agentId} />
      )}

      {/* Add/Edit Knowledge Base Modal */}
      {showKnowledgeBaseModal && (
        <AddKnowledgeBaseModal
          onClose={() => {
            setShowKnowledgeBaseModal(false);
            setEditingKnowledgeBaseIndex(null);
          }}
          onAdd={handleAddKnowledgeBase}
          initialKnowledgeBase={editingKnowledgeBase || undefined}
        />
      )}
    </div>
  );
}
