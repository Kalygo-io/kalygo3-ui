"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  agentsService,
  Agent,
  AgentConfigV2,
  AgentConfigDataV2,
  VectorSearchTool,
  VectorSearchWithRerankingTool,
  DbReadTool,
  DbWriteTool,
  ToolV2,
} from "@/services/agentsService";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";
import {
  ArrowLeftIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  PencilIcon,
  LinkIcon,
  CircleStackIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { AddToolModal } from "./add-tool-modal";

export function AgentDetailsV2({ agentId }: { agentId?: string }) {
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [tools, setTools] = useState<ToolV2[]>([]);
  const [showAddToolModal, setShowAddToolModal] = useState(false);
  const [editingToolIndex, setEditingToolIndex] = useState<number | null>(null);

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
      
      // Extract V2 config data
      if (data.config && data.config.version === 2) {
        const v2Config = data.config as AgentConfigV2;
        setName(data.name || "");
        setSystemPrompt(v2Config.data.systemPrompt || "");
        setTools(v2Config.data.tools || []);
      } else {
        errorToast("Agent is not using V2 schema");
        router.push("/dashboard/agents");
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

    try {
      setSaving(true);
      
      const configData: AgentConfigDataV2 = {
        systemPrompt: systemPrompt.trim(),
        tools: tools.length > 0 ? tools : undefined,
      };

      const updateData = {
        name: name.trim(),
        config: {
          schema: "agent_config" as const,
          version: 2 as const,
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

  const handleAddTool = (tool: ToolV2) => {
    if (editingToolIndex !== null) {
      // Update existing tool
      setTools((prev) => {
        const updated = [...prev];
        updated[editingToolIndex] = tool;
        return updated;
      });
      setEditingToolIndex(null);
      successToast("Tool updated successfully");
    } else {
      // Add new tool
      // Check for duplicates based on tool type
      let isDuplicate = false;
      
      if (tool.type === "dbRead") {
        // For dbRead, check if same credentialId + table already exists
        isDuplicate = tools.some(
          (existing) =>
            existing.type === "dbRead" &&
            existing.credentialId === tool.credentialId &&
            existing.table === tool.table
        );
      } else if (tool.type === "dbWrite") {
        // For dbWrite, check if same credentialId + table already exists
        isDuplicate = tools.some(
          (existing) =>
            existing.type === "dbWrite" &&
            existing.credentialId === tool.credentialId &&
            existing.table === tool.table
        );
      } else {
        // For vector search tools, check type, provider, index, and namespace
        isDuplicate = tools.some(
          (existing) =>
            existing.type === tool.type &&
            "provider" in existing && "provider" in tool &&
            existing.provider === tool.provider &&
            "index" in existing && "index" in tool &&
            existing.index === tool.index &&
            "namespace" in existing && "namespace" in tool &&
            existing.namespace === tool.namespace
        );
      }

      if (isDuplicate) {
        errorToast("This tool is already added");
        return;
      }

      setTools((prev) => [...prev, tool]);
      successToast("Tool added successfully");
    }
    setShowAddToolModal(false);
  };

  const handleRemoveTool = (index: number) => {
    setTools(tools.filter((_, i) => i !== index));
    successToast("Tool removed successfully");
  };

  const handleEditTool = (index: number) => {
    setEditingToolIndex(index);
    setShowAddToolModal(true);
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

  const editingTool = editingToolIndex !== null 
    ? tools[editingToolIndex] 
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
          <div>
            <h1 className="text-4xl font-semibold text-white">{agent.name}</h1>
            <p className="text-sm text-blue-400 mt-1">Agent Config v2</p>
          </div>
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
              Agent Configuration
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
                The system prompt that defines the agent&apos;s behavior and personality.
              </p>
            </div>

            {/* Tools */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-300">
                  Tools
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setEditingToolIndex(null);
                    setShowAddToolModal(true);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Tool
                </button>
              </div>

              {tools.length === 0 ? (
                <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-8 text-center">
                  <p className="text-gray-400 text-sm mb-4">
                    No tools added yet
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingToolIndex(null);
                      setShowAddToolModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Your First Tool
                  </button>
                </div>
              ) : (
                <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-800/50 border-b border-gray-700/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Target
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Settings
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700/50">
                        {tools.map((tool, index) => {
                          // Render dbRead tools
                          if (tool.type === "dbRead") {
                            const formatTableName = (name: string) =>
                              name.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

                            const toolDisplayName = tool.name || `query_${tool.table}`;

                            return (
                              <tr
                                key={index}
                                className="hover:bg-gray-800/30 transition-colors"
                              >
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-600/20 text-green-300 border border-green-500/40">
                                    <CircleStackIcon className="h-3 w-3" />
                                    Database Query
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="space-y-1">
                                    <span className="text-sm text-white font-medium block">
                                      {formatTableName(tool.table)}
                                    </span>
                                    <code className="text-xs text-green-400 bg-green-900/20 px-1.5 py-0.5 rounded">
                                      {toolDisplayName}
                                    </code>
                                    <div className="text-xs text-gray-500">
                                      Credential ID: {tool.credentialId}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="space-y-1">
                                    <span className="text-sm text-gray-300 block">
                                      {tool.description || (
                                        <span className="text-gray-500 italic">
                                          No description
                                        </span>
                                      )}
                                    </span>
                                    {tool.columns && tool.columns.length > 0 && (
                                      <div className="text-xs text-gray-500">
                                        Columns: {tool.columns.join(", ")}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-xs text-gray-500">
                                    Max: {tool.maxLimit || 100} rows
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleEditTool(index)}
                                      className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-600/20 rounded-lg transition-colors duration-200"
                                      title="Edit tool"
                                      aria-label="Edit tool"
                                    >
                                      <PencilIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveTool(index)}
                                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-600/20 rounded-lg transition-colors duration-200"
                                      title="Remove tool"
                                      aria-label="Remove tool"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          // Render dbWrite tools
                          if (tool.type === "dbWrite") {
                            const formatTableName = (name: string) =>
                              name.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

                            const toolDisplayName = tool.name || `insert_${tool.table}`;

                            return (
                              <tr
                                key={index}
                                className="hover:bg-gray-800/30 transition-colors"
                              >
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-600/20 text-orange-300 border border-orange-500/40">
                                    <PencilSquareIcon className="h-3 w-3" />
                                    Database Write
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="space-y-1">
                                    <span className="text-sm text-white font-medium block">
                                      {formatTableName(tool.table)}
                                    </span>
                                    <code className="text-xs text-orange-400 bg-orange-900/20 px-1.5 py-0.5 rounded">
                                      {toolDisplayName}
                                    </code>
                                    <div className="text-xs text-gray-500">
                                      Credential ID: {tool.credentialId}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="space-y-1">
                                    <span className="text-sm text-gray-300 block">
                                      {tool.description || (
                                        <span className="text-gray-500 italic">
                                          No description
                                        </span>
                                      )}
                                    </span>
                                    <div className="text-xs text-gray-500">
                                      Columns: {tool.columns.join(", ")}
                                    </div>
                                    {tool.requiredColumns && tool.requiredColumns.length > 0 && (
                                      <div className="text-xs text-orange-400/80">
                                        Required: {tool.requiredColumns.join(", ")}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="space-y-1">
                                    <div className="text-xs text-gray-500">
                                      {tool.columns.length} columns
                                    </div>
                                    {tool.injectAccountId && (
                                      <div className="text-xs text-orange-400">
                                        + account_id
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleEditTool(index)}
                                      className="p-1.5 text-gray-400 hover:text-orange-400 hover:bg-orange-600/20 rounded-lg transition-colors duration-200"
                                      title="Edit tool"
                                      aria-label="Edit tool"
                                    >
                                      <PencilIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveTool(index)}
                                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-600/20 rounded-lg transition-colors duration-200"
                                      title="Remove tool"
                                      aria-label="Remove tool"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }
                          
                          // Render vector search tools
                          if (tool.type === "vectorSearch" || tool.type === "vectorSearchWithReranking") {
                            const canNavigate = tool.provider === "pinecone" && tool.index;
                            const isReranking = tool.type === "vectorSearchWithReranking";

                            return (
                              <tr
                                key={index}
                                className="hover:bg-gray-800/30 transition-colors"
                              >
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    isReranking
                                      ? "bg-blue-600/20 text-blue-300 border border-blue-500/40"
                                      : "bg-purple-600/20 text-purple-300 border border-purple-500/40"
                                  }`}>
                                    {isReranking ? "Vector Search + Rerank" : "Vector Search"}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="space-y-1">
                                    <span className="text-sm text-white font-medium capitalize block">
                                      {tool.provider}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {tool.index} / {tool.namespace}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-sm text-gray-300 block">
                                    {tool.description || (
                                      <span className="text-gray-500 italic">
                                        No description
                                      </span>
                                    )}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-xs text-gray-500">
                                    {isReranking ? (
                                      <>K: {tool.topK || 20}, N: {tool.topN || 5}</>
                                    ) : (
                                      <>Top K: {tool.topK || 10}</>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {canNavigate && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          router.push(
                                            `/dashboard/vector-stores?indexName=${encodeURIComponent(tool.index)}`
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
                                      onClick={() => handleEditTool(index)}
                                      className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-600/20 rounded-lg transition-colors duration-200"
                                      title="Edit tool"
                                      aria-label="Edit tool"
                                    >
                                      <PencilIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveTool(index)}
                                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-600/20 rounded-lg transition-colors duration-200"
                                      title="Remove tool"
                                      aria-label="Remove tool"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }
                          return null;
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <p className="text-gray-400 text-xs mt-2">
                Tools extend the agent&apos;s capabilities. Add vector search tools for knowledge base retrieval or database query tools for structured data access.
              </p>
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

      {/* Add/Edit Tool Modal */}
      {showAddToolModal && (
        <AddToolModal
          onClose={() => {
            setShowAddToolModal(false);
            setEditingToolIndex(null);
          }}
          onAdd={handleAddTool}
          initialTool={editingTool || undefined}
        />
      )}
    </div>
  );
}
