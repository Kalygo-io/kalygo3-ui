"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  agentsService,
  CreateAgentRequest,
  KnowledgeBase,
} from "@/services/agentsService";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";
import {
  ArrowLeftIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  vectorStoresService,
  Index,
  Namespace,
} from "@/services/vectorStoresService";
import { AddKnowledgeBaseModal } from "./add-knowledge-base-modal";
import { KnowledgeBaseChip } from "./knowledge-base-chip";

export function CreateAgentContainer() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [showKnowledgeBaseModal, setShowKnowledgeBaseModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Debug: Log when knowledgeBases state changes
  useEffect(() => {
    console.log("knowledgeBases state updated:", knowledgeBases);
    console.log("Number of knowledge bases:", knowledgeBases.length);
  }, [knowledgeBases]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      errorToast("Agent name is required");
      return;
    }

    try {
      setSubmitting(true);
      const data: CreateAgentRequest = {
        name: name.trim(),
        ...(description.trim() && { description: description.trim() }),
        ...(knowledgeBases.length > 0 && { knowledge_bases: knowledgeBases }),
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

  const handleAddKnowledgeBase = (kb: KnowledgeBase) => {
    console.log("handleAddKnowledgeBase called with:", kb);
    console.log("Current knowledgeBases state:", knowledgeBases);

    // Use functional update to ensure we have the latest state
    setKnowledgeBases((prev) => {
      console.log("Previous state in setKnowledgeBases:", prev);

      // Check for duplicates
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

      // Success - knowledge base added to local state (not saved to API yet)
      const displayName =
        kb.index && kb.namespace
          ? `${kb.index} / ${kb.namespace}`
          : kb.provider;
      successToast(`Knowledge base "${displayName}" added`);

      const updated = [...prev, kb];
      console.log("Updated knowledgeBases:", updated);
      return updated;
    });
    setShowKnowledgeBaseModal(false);
  };

  const handleRemoveKnowledgeBase = (index: number) => {
    setKnowledgeBases(knowledgeBases.filter((_, i) => i !== index));
  };

  const handleCancel = () => {
    router.push("/dashboard/agents");
  };

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
        <h1 className="text-4xl font-semibold text-white">Create Agent</h1>
      </div>

      {/* Create Form */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              System Prompt
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter the system prompt for this agent..."
              rows={4}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-gray-400 text-xs mt-2">
              Optional: Define the system prompt that guides your agent&apos;s
              behavior and responses.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Knowledge Bases
            </label>
            <div className="space-y-3">
              {/* Knowledge Base Pills/Tags */}
              <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-3 bg-gray-900 border border-gray-700 rounded-lg">
                {knowledgeBases.length === 0 ? (
                  <p className="text-gray-500 text-sm py-1">
                    No knowledge bases added
                  </p>
                ) : (
                  <>
                    {knowledgeBases.map((kb, index) => (
                      <KnowledgeBaseChip
                        key={`kb-${index}-${kb.provider}-${kb.index}-${kb.namespace}`}
                        knowledgeBase={kb}
                        onRemove={() => handleRemoveKnowledgeBase(index)}
                      />
                    ))}
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowKnowledgeBaseModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                <PlusIcon className="h-4 w-4" />
                Add Knowledge Base
              </button>
              <p className="text-gray-400 text-xs">
                Add knowledge bases that this agent can access for information
                retrieval.
              </p>
            </div>
          </div>

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

      {/* Add Knowledge Base Modal - rendered outside form to avoid conflicts */}
      {showKnowledgeBaseModal && (
        <AddKnowledgeBaseModal
          onClose={() => setShowKnowledgeBaseModal(false)}
          onAdd={handleAddKnowledgeBase}
        />
      )}
    </div>
  );
}
