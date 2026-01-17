"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  agentsService,
  Agent,
  AgentConfig,
  AgentConfigData,
  KnowledgeBase,
} from "@/services/agentsService";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";
import {
  ArrowLeftIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  vectorStoresService,
  Index,
  Namespace,
} from "@/services/vectorStoresService";
import { AddKnowledgeBaseModal } from "../agents/create/add-knowledge-base-modal";
import { KnowledgeBaseChip } from "../agents/create/knowledge-base-chip";

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
        setKnowledgeBases(data.config.data?.knowledgeBases || []);
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

    if (knowledgeBases.length === 0) {
      errorToast("At least one knowledge base is required");
      return;
    }

    try {
      setSaving(true);
      
      const configData: AgentConfigData = {
        systemPrompt: systemPrompt.trim(),
        knowledgeBases: knowledgeBases,
      };

      const updateData = {
        name: name.trim(),
        config: {
          schema: "agent_config",
          version: configVersion,
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
      setKnowledgeBases((prev) => {
        const isDuplicate = prev.some(
          (existing) =>
            existing.provider === kb.provider &&
            existing.index === kb.index &&
            existing.namespace === kb.namespace
        );

        if (isDuplicate) {
          errorToast("This knowledge base is already added");
          return prev;
        }

        successToast(`Knowledge base "${kb.index} / ${kb.namespace}" added`);
        return [...prev, kb];
      });
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Knowledge Bases * (at least 1 required)
              </label>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-3 bg-gray-900 border border-gray-700 rounded-lg">
                  {knowledgeBases.length === 0 ? (
                    <p className="text-gray-500 text-sm py-1">
                      No knowledge bases added
                    </p>
                  ) : (
                    knowledgeBases.map((kb, index) => (
                      <div key={index} className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 border border-blue-500/40 rounded-full text-sm text-blue-200 hover:bg-blue-600/30 transition-colors">
                        <button
                          type="button"
                          onClick={() => handleEditKnowledgeBase(index)}
                          className="font-medium cursor-pointer"
                        >
                          {kb.index && kb.namespace
                            ? `${kb.index} / ${kb.namespace}`
                            : kb.provider}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveKnowledgeBase(index);
                          }}
                          className="hover:bg-blue-500/40 rounded-full p-0.5 transition-colors flex-shrink-0"
                          aria-label="Remove knowledge base"
                        >
                          <XMarkIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingKnowledgeBaseIndex(null);
                    setShowKnowledgeBaseModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Knowledge Base
                </button>
                <p className="text-gray-400 text-xs">
                  One or more knowledge base bindings used by the agent.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

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
