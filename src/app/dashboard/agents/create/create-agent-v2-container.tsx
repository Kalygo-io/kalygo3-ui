"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  agentsService,
  CreateAgentRequest,
  ToolV2,
  AgentConfigDataV2,
} from "@/services/agentsService";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CircleStackIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { AddToolModal } from "../../agent/add-tool-modal";

export function CreateAgentV2Container() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [tools, setTools] = useState<ToolV2[]>([]);
  const [showAddToolModal, setShowAddToolModal] = useState(false);
  const [editingToolIndex, setEditingToolIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      errorToast("Agent name is required");
      return;
    }

    if (!systemPrompt.trim()) {
      errorToast("System prompt is required");
      return;
    }

    try {
      setSubmitting(true);
      
      const configData: AgentConfigDataV2 = {
        systemPrompt: systemPrompt.trim(),
        tools: tools.length > 0 ? tools : undefined,
      };
      
      const data: CreateAgentRequest = {
        name: name.trim(),
        config: {
          schema: "agent_config",
          version: 2,
          data: configData,
        },
      };
      
      const agent = await agentsService.createAgent(data);
      successToast("Agent created successfully");
      router.push(`/dashboard/agent?agent_id=${encodeURIComponent(agent.id)}`);
    } catch (error: any) {
      errorToast(error.message || "Failed to create agent");
    } finally {
      setSubmitting(false);
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

  const handleCancel = () => {
    router.push("/dashboard/agents");
  };

  const editingTool = editingToolIndex !== null ? tools[editingToolIndex] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleCancel}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-4xl font-semibold text-white">Create Agent</h1>
          <p className="text-sm text-blue-400 mt-1">Agent Config v2</p>
        </div>
      </div>

      {/* Create Form */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Agent Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Agent Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Agent"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-gray-400 text-xs mt-2">
              Choose a descriptive name for your agent.
            </p>
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              System Prompt *
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Enter the system prompt that defines your agent's behavior and personality..."
              rows={6}
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                <PlusIcon className="h-4 w-4" />
                Add Tool
              </button>
            </div>

            {tools.length === 0 ? (
              <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-6 text-center">
                <p className="text-gray-400 text-sm mb-4">
                  No tools added yet. Tools extend your agent&apos;s capabilities.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingToolIndex(null);
                    setShowAddToolModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Your First Tool
                </button>
              </div>
            ) : (
              <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg overflow-hidden">
                <div className="divide-y divide-gray-700/50">
                  {tools.map((tool, index) => {
                    // Render dbRead tools
                    if (tool.type === "dbRead") {
                      const formatTableName = (name: string) =>
                        name.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

                      const toolDisplayName = tool.name || `query_${tool.table}`;

                      return (
                        <div
                          key={index}
                          className="p-4 hover:bg-gray-800/30 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-600/20 text-green-300 border border-green-500/40">
                                  <CircleStackIcon className="h-3 w-3" />
                                  Database Query
                                </span>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-gray-300">
                                  <span className="font-medium">Table:</span>{" "}
                                  <span className="text-white">{formatTableName(tool.table)}</span>{" "}
                                  <code className="text-xs text-green-400 bg-green-900/20 px-1.5 py-0.5 rounded ml-1">
                                    {toolDisplayName}
                                  </code>
                                </p>
                                <p className="text-xs text-gray-500">
                                  Credential ID: {tool.credentialId}
                                </p>
                                {tool.description && (
                                  <p className="text-sm text-gray-400">
                                    {tool.description}
                                  </p>
                                )}
                                {tool.columns && tool.columns.length > 0 && (
                                  <p className="text-xs text-gray-500">
                                    Columns: {tool.columns.join(", ")}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500">
                                  Max: {tool.maxLimit || 100} rows
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                type="button"
                                onClick={() => handleEditTool(index)}
                                className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-600/20 rounded-lg transition-colors duration-200"
                                title="Edit tool"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveTool(index)}
                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-600/20 rounded-lg transition-colors duration-200"
                                title="Remove tool"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Render dbWrite tools
                    if (tool.type === "dbWrite") {
                      const formatTableName = (name: string) =>
                        name.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

                      const toolDisplayName = tool.name || `insert_${tool.table}`;

                      return (
                        <div
                          key={index}
                          className="p-4 hover:bg-gray-800/30 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-600/20 text-orange-300 border border-orange-500/40">
                                  <PencilSquareIcon className="h-3 w-3" />
                                  Database Write
                                </span>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-gray-300">
                                  <span className="font-medium">Table:</span>{" "}
                                  <span className="text-white">{formatTableName(tool.table)}</span>{" "}
                                  <code className="text-xs text-orange-400 bg-orange-900/20 px-1.5 py-0.5 rounded ml-1">
                                    {toolDisplayName}
                                  </code>
                                </p>
                                <p className="text-xs text-gray-500">
                                  Credential ID: {tool.credentialId}
                                </p>
                                {tool.description && (
                                  <p className="text-sm text-gray-400">
                                    {tool.description}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500">
                                  Columns: {tool.columns.join(", ")}
                                </p>
                                {tool.requiredColumns && tool.requiredColumns.length > 0 && (
                                  <p className="text-xs text-orange-400/80">
                                    Required: {tool.requiredColumns.join(", ")}
                                  </p>
                                )}
                                {tool.injectAccountId && (
                                  <p className="text-xs text-orange-400">
                                    + Auto-inject account_id
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                type="button"
                                onClick={() => handleEditTool(index)}
                                className="p-1.5 text-gray-400 hover:text-orange-400 hover:bg-orange-600/20 rounded-lg transition-colors duration-200"
                                title="Edit tool"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveTool(index)}
                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-600/20 rounded-lg transition-colors duration-200"
                                title="Remove tool"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    // Render vector search tools
                    if (tool.type === "vectorSearch" || tool.type === "vectorSearchWithReranking") {
                      const isReranking = tool.type === "vectorSearchWithReranking";
                      
                      return (
                        <div
                          key={index}
                          className="p-4 hover:bg-gray-800/30 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  isReranking
                                    ? "bg-blue-600/20 text-blue-300 border border-blue-500/40"
                                    : "bg-purple-600/20 text-purple-300 border border-purple-500/40"
                                }`}>
                                  {isReranking ? "Vector Search + Rerank" : "Vector Search"}
                                </span>
                                <span className="text-sm font-medium text-white capitalize">
                                  {tool.provider}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-gray-300">
                                  <span className="font-medium">Index:</span> {tool.index}
                                </p>
                                <p className="text-sm text-gray-300">
                                  <span className="font-medium">Namespace:</span> {tool.namespace}
                                </p>
                                {tool.description && (
                                  <p className="text-sm text-gray-400">
                                    {tool.description}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500">
                                  {isReranking ? (
                                    <>K: {tool.topK || 20}, N: {tool.topN || 5}</>
                                  ) : (
                                    <>Top K: {tool.topK || 10}</>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                type="button"
                                onClick={() => handleEditTool(index)}
                                className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-600/20 rounded-lg transition-colors duration-200"
                                title="Edit tool"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveTool(index)}
                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-600/20 rounded-lg transition-colors duration-200"
                                title="Remove tool"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            )}
            <p className="text-gray-400 text-xs mt-2">
              Tools extend the agent&apos;s capabilities. Add vector search tools for knowledge base retrieval or database query tools for structured data access.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {submitting ? "Creating..." : "Create Agent"}
            </button>
          </div>
        </form>
      </div>

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
