"use client";

import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { VectorSearchTool, VectorSearchWithRerankingTool, ToolV2 } from "@/services/agentsService";
import { vectorStoresService, Index, Namespace } from "@/services/vectorStoresService";
import { errorToast } from "@/shared/toasts/errorToast";

interface AddVectorSearchToolModalProps {
  onClose: () => void;
  onAdd: (tool: ToolV2) => void;
  initialTool?: ToolV2;
}

export function AddVectorSearchToolModal({
  onClose,
  onAdd,
  initialTool,
}: AddVectorSearchToolModalProps) {
  const [toolType, setToolType] = useState<"vectorSearch" | "vectorSearchWithReranking">("vectorSearch");
  const [provider] = useState<"pinecone">("pinecone"); // Only pinecone for now
  const [selectedIndex, setSelectedIndex] = useState("");
  const [selectedNamespace, setSelectedNamespace] = useState("");
  const [description, setDescription] = useState("");
  const [topK, setTopK] = useState(10);
  const [topN, setTopN] = useState(5);
  const [loading, setLoading] = useState(true);
  
  // Data fetching state
  const [indices, setIndices] = useState<Index[]>([]);
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [loadingNamespaces, setLoadingNamespaces] = useState(false);

  const isEditing = !!initialTool;

  useEffect(() => {
    if (initialTool) {
      // Only handle vector search tool types in this modal
      if (initialTool.type === "vectorSearch" || initialTool.type === "vectorSearchWithReranking") {
        setToolType(initialTool.type);
        setSelectedIndex(initialTool.index);
        setSelectedNamespace(initialTool.namespace);
        setDescription(initialTool.description || "");
        
        if (initialTool.type === "vectorSearch") {
          setTopK(initialTool.topK || 10);
        } else if (initialTool.type === "vectorSearchWithReranking") {
          setTopK(initialTool.topK || 20);
          setTopN(initialTool.topN || 5);
        }
      }
    }
  }, [initialTool]);

  useEffect(() => {
    loadIndices();
  }, []);

  useEffect(() => {
    if (selectedIndex) {
      loadNamespaces(selectedIndex);
    } else {
      setNamespaces([]);
      setSelectedNamespace("");
    }
  }, [selectedIndex]);

  const loadIndices = async () => {
    try {
      setLoading(true);
      const data = await vectorStoresService.listIndexes();
      setIndices(data);
    } catch (error: any) {
      errorToast(error.message || "Failed to load indices");
    } finally {
      setLoading(false);
    }
  };

  const loadNamespaces = async (indexName: string) => {
    try {
      setLoadingNamespaces(true);
      const data = await vectorStoresService.listNamespaces(indexName);
      setNamespaces(data);
    } catch (error: any) {
      errorToast(error.message || "Failed to load namespaces");
      setNamespaces([]);
    } finally {
      setLoadingNamespaces(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedIndex) {
      errorToast("Please select an index");
      return;
    }

    if (!selectedNamespace) {
      errorToast("Please select a namespace");
      return;
    }

    let tool: ToolV2;

    if (toolType === "vectorSearch") {
      tool = {
        type: "vectorSearch",
        provider,
        index: selectedIndex,
        namespace: selectedNamespace,
        description: description.trim() || undefined,
        topK,
      };
    } else {
      tool = {
        type: "vectorSearchWithReranking",
        provider,
        index: selectedIndex,
        namespace: selectedNamespace,
        description: description.trim() || undefined,
        topK,
        topN,
      };
    }

    onAdd(tool);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-semibold text-white">
            {isEditing ? "Edit Tool" : "Add Tool"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tool Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tool Type *
            </label>
            <select
              value={toolType}
              onChange={(e) => {
                const newType = e.target.value as "vectorSearch" | "vectorSearchWithReranking";
                setToolType(newType);
                // Adjust default values based on tool type
                if (newType === "vectorSearchWithReranking") {
                  setTopK(20);
                  setTopN(5);
                } else {
                  setTopK(10);
                }
              }}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isEditing}
            >
              <option value="vectorSearch">Vector Search</option>
              <option value="vectorSearchWithReranking">Vector Search with Reranking</option>
            </select>
            <p className="text-gray-400 text-xs mt-2">
              {toolType === "vectorSearch" 
                ? "Standard vector search for semantic retrieval."
                : "Vector search with re-ranking for improved relevance. Retrieves more candidates and re-ranks them."}
            </p>
            {isEditing && (
              <p className="text-gray-400 text-xs mt-1">
                Tool type cannot be changed when editing.
              </p>
            )}
          </div>

          {/* Provider (Read-only for now) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Provider *
            </label>
            <input
              type="text"
              value="Pinecone"
              disabled
              className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-400 cursor-not-allowed"
            />
            <p className="text-gray-400 text-xs mt-2">
              Currently only Pinecone vector database is supported.
            </p>
          </div>

          {/* Index Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Index *
            </label>
            {loading ? (
              <div className="text-gray-400 text-sm">Loading indices...</div>
            ) : (
              <select
                value={selectedIndex}
                onChange={(e) => setSelectedIndex(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isEditing}
              >
                <option value="">Select an index...</option>
                {indices.map((index) => (
                  <option key={index.name} value={index.name}>
                    {index.name} ({index.dimension} dimensions, {index.metric})
                  </option>
                ))}
              </select>
            )}
            {isEditing && (
              <p className="text-gray-400 text-xs mt-2">
                Index cannot be changed when editing.
              </p>
            )}
          </div>

          {/* Namespace Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Namespace *
            </label>
            {loadingNamespaces ? (
              <div className="text-gray-400 text-sm">Loading namespaces...</div>
            ) : (
              <select
                value={selectedNamespace}
                onChange={(e) => setSelectedNamespace(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={!selectedIndex || loadingNamespaces || isEditing}
              >
                <option value="">
                  {selectedIndex
                    ? "Select a namespace..."
                    : "Select an index first..."}
                </option>
                {namespaces.map((ns) => (
                  <option key={ns.namespace} value={ns.namespace}>
                    {ns.namespace} ({ns.vector_count || 0} vectors)
                  </option>
                ))}
              </select>
            )}
            {isEditing && (
              <p className="text-gray-400 text-xs mt-2">
                Namespace cannot be changed when editing.
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this knowledge base contains..."
              rows={3}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-gray-400 text-xs mt-2">
              Help the LLM decide when to use this tool by describing the knowledge base contents.
            </p>
          </div>

          {/* Top K */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {toolType === "vectorSearchWithReranking" ? "Top K Candidates" : "Top K Results"}
            </label>
            <input
              type="number"
              value={topK}
              onChange={(e) => setTopK(Math.max(1, Math.min(100, parseInt(e.target.value) || (toolType === "vectorSearchWithReranking" ? 20 : 10))))}
              min="1"
              max="100"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-gray-400 text-xs mt-2">
              {toolType === "vectorSearchWithReranking"
                ? "Number of initial candidates to retrieve before re-ranking (1-100). Default is 20."
                : "Number of top results to return from vector search (1-100). Default is 10."}
            </p>
          </div>

          {/* Top N (only for reranking) */}
          {toolType === "vectorSearchWithReranking" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Top N Final Results
              </label>
              <input
                type="number"
                value={topN}
                onChange={(e) => setTopN(Math.max(1, Math.min(50, parseInt(e.target.value) || 5)))}
                min="1"
                max="50"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-gray-400 text-xs mt-2">
                Number of final results to return after re-ranking (1-50). Default is 5.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {isEditing ? "Update Tool" : "Add Tool"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
