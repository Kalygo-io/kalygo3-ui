"use client";

import { useState, useEffect } from "react";
import { XMarkIcon, CircleStackIcon, MagnifyingGlassIcon, TableCellsIcon } from "@heroicons/react/24/outline";
import { ToolV2 } from "@/services/agentsService";
import { vectorStoresService, Index, Namespace } from "@/services/vectorStoresService";
import { errorToast } from "@/shared/toasts/errorToast";

interface AddToolModalProps {
  onClose: () => void;
  onAdd: (tool: ToolV2) => void;
  initialTool?: ToolV2;
}

export function AddToolModal({
  onClose,
  onAdd,
  initialTool,
}: AddToolModalProps) {
  // Tool category selection
  const [toolCategory, setToolCategory] = useState<"vectorSearch" | "dbRead">("vectorSearch");
  
  // Vector search state
  const [vectorToolType, setVectorToolType] = useState<"vectorSearch" | "vectorSearchWithReranking">("vectorSearch");
  const [provider] = useState<"pinecone">("pinecone");
  const [selectedIndex, setSelectedIndex] = useState("");
  const [selectedNamespace, setSelectedNamespace] = useState("");
  const [topK, setTopK] = useState(10);
  const [topN, setTopN] = useState(5);
  
  // DB Read state
  const [tableName, setTableName] = useState("");
  const [dbLimit, setDbLimit] = useState(50);
  
  // Shared state
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Data fetching state
  const [indices, setIndices] = useState<Index[]>([]);
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [loadingNamespaces, setLoadingNamespaces] = useState(false);

  const isEditing = !!initialTool;

  // Initialize from existing tool
  useEffect(() => {
    if (initialTool) {
      setDescription(initialTool.description || "");
      
      if (initialTool.type === "dbRead") {
        setToolCategory("dbRead");
        setTableName(initialTool.table);
        setDbLimit(initialTool.limit || 50);
      } else {
        setToolCategory("vectorSearch");
        setVectorToolType(initialTool.type);
        setSelectedIndex(initialTool.index);
        setSelectedNamespace(initialTool.namespace);
        
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

    let tool: ToolV2;

    if (toolCategory === "dbRead") {
      // DB Read tool
      if (!tableName.trim()) {
        errorToast("Please enter a table name");
        return;
      }

      tool = {
        type: "dbRead",
        table: tableName.trim(),
        description: description.trim() || undefined,
        limit: dbLimit,
      };
    } else {
      // Vector search tools
      if (!selectedIndex) {
        errorToast("Please select an index");
        return;
      }

      if (!selectedNamespace) {
        errorToast("Please select a namespace");
        return;
      }

      if (vectorToolType === "vectorSearch") {
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
          {/* Tool Category Selection */}
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Tool Category *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setToolCategory("vectorSearch")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    toolCategory === "vectorSearch"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-700 bg-gray-900/50 hover:border-gray-600"
                  }`}
                >
                  <MagnifyingGlassIcon className={`h-8 w-8 mx-auto mb-2 ${
                    toolCategory === "vectorSearch" ? "text-blue-400" : "text-gray-500"
                  }`} />
                  <div className={`text-sm font-medium ${
                    toolCategory === "vectorSearch" ? "text-blue-300" : "text-gray-400"
                  }`}>
                    Vector Search
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Semantic retrieval from knowledge bases
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setToolCategory("dbRead")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    toolCategory === "dbRead"
                      ? "border-green-500 bg-green-500/10"
                      : "border-gray-700 bg-gray-900/50 hover:border-gray-600"
                  }`}
                >
                  <CircleStackIcon className={`h-8 w-8 mx-auto mb-2 ${
                    toolCategory === "dbRead" ? "text-green-400" : "text-gray-500"
                  }`} />
                  <div className={`text-sm font-medium ${
                    toolCategory === "dbRead" ? "text-green-300" : "text-gray-400"
                  }`}>
                    Database Query
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Read structured data from tables
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Vector Search Options */}
          {toolCategory === "vectorSearch" && (
            <>
              {/* Vector Search Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Search Type *
                </label>
                <select
                  value={vectorToolType}
                  onChange={(e) => {
                    const newType = e.target.value as "vectorSearch" | "vectorSearchWithReranking";
                    setVectorToolType(newType);
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
                  {vectorToolType === "vectorSearch" 
                    ? "Standard vector search for semantic retrieval."
                    : "Vector search with re-ranking for improved relevance."}
                </p>
              </div>

              {/* Provider (Read-only) */}
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
                      {selectedIndex ? "Select a namespace..." : "Select an index first..."}
                    </option>
                    {namespaces.map((ns) => (
                      <option key={ns.namespace} value={ns.namespace}>
                        {ns.namespace} ({ns.vector_count || 0} vectors)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Top K */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {vectorToolType === "vectorSearchWithReranking" ? "Top K Candidates" : "Top K Results"}
                </label>
                <input
                  type="number"
                  value={topK}
                  onChange={(e) => setTopK(Math.max(1, Math.min(100, parseInt(e.target.value) || 10)))}
                  min="1"
                  max="100"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-gray-400 text-xs mt-2">
                  {vectorToolType === "vectorSearchWithReranking"
                    ? "Number of initial candidates to retrieve before re-ranking (1-100). Default is 20."
                    : "Number of top results to return from vector search (1-100). Default is 10."}
                </p>
              </div>

              {/* Top N (only for reranking) */}
              {vectorToolType === "vectorSearchWithReranking" && (
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
            </>
          )}

          {/* Database Query Options */}
          {toolCategory === "dbRead" && (
            <>
              {/* Table Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Database Table *
                </label>
                <input
                  type="text"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="e.g., chat_app_sessions"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={isEditing}
                  required
                />
                <p className="text-gray-400 text-xs mt-2">
                  Enter the database table name to query. The backend will validate access permissions.
                </p>
                {isEditing && (
                  <p className="text-gray-400 text-xs mt-1">
                    Table cannot be changed when editing.
                  </p>
                )}
              </div>

              {/* Table Info Card */}
              {tableName && (
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <TableCellsIcon className="h-5 w-5 text-green-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-white">
                        Database Table
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">
                        Table: <code className="text-green-400">{tableName}</code>
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        The agent will be able to query this table to retrieve relevant data.
                        Only non-sensitive columns are returned.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Row Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Maximum Rows
                </label>
                <input
                  type="number"
                  value={dbLimit}
                  onChange={(e) => setDbLimit(Math.max(1, Math.min(100, parseInt(e.target.value) || 50)))}
                  min="1"
                  max="100"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-gray-400 text-xs mt-2">
                  Maximum number of rows to return (1-100). Default is 50.
                </p>
              </div>
            </>
          )}

          {/* Description (shared) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={toolCategory === "dbRead" 
                ? "Describe when the agent should query this table..."
                : "Describe what this knowledge base contains..."}
              rows={3}
              className={`w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${
                toolCategory === "dbRead" ? "focus:ring-green-500" : "focus:ring-blue-500"
              } resize-none`}
            />
            <p className="text-gray-400 text-xs mt-2">
              Help the LLM decide when to use this tool by describing its purpose.
            </p>
          </div>

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
              className={`flex-1 font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-white ${
                toolCategory === "dbRead"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isEditing ? "Update Tool" : "Add Tool"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
