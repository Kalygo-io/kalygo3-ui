"use client";

import { useState, useEffect } from "react";
import { XMarkIcon, CircleStackIcon, MagnifyingGlassIcon, TableCellsIcon, KeyIcon } from "@heroicons/react/24/outline";
import { ToolV2, DbReadTool } from "@/services/agentsService";
import { vectorStoresService, Index, Namespace } from "@/services/vectorStoresService";
import { credentialService, Credential, CredentialType, formatServiceName } from "@/services/credentialService";
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
  const [selectedCredentialId, setSelectedCredentialId] = useState<number | "">("");
  const [tableName, setTableName] = useState("");
  const [toolName, setToolName] = useState("");
  const [columns, setColumns] = useState("");
  const [maxLimit, setMaxLimit] = useState(100);
  
  // Shared state
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Data fetching state
  const [indices, setIndices] = useState<Index[]>([]);
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [loadingNamespaces, setLoadingNamespaces] = useState(false);
  const [dbCredentials, setDbCredentials] = useState<Credential[]>([]);
  const [loadingCredentials, setLoadingCredentials] = useState(false);

  const isEditing = !!initialTool;

  // Initialize from existing tool
  useEffect(() => {
    if (initialTool) {
      setDescription(initialTool.description || "");
      
      if (initialTool.type === "dbRead") {
        setToolCategory("dbRead");
        setSelectedCredentialId(initialTool.credentialId);
        setTableName(initialTool.table);
        setToolName(initialTool.name || "");
        setColumns(initialTool.columns?.join(", ") || "");
        setMaxLimit(initialTool.maxLimit || 100);
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
    loadDbCredentials();
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

  const loadDbCredentials = async () => {
    try {
      setLoadingCredentials(true);
      const allCredentials = await credentialService.listCredentials();
      // Filter to only db_connection type credentials
      const dbCreds = allCredentials.filter(
        (c) => c.credential_type === CredentialType.DB_CONNECTION || c.credential_type === "db_connection"
      );
      setDbCredentials(dbCreds);
    } catch (error: any) {
      console.error("Failed to load credentials:", error);
      // Don't show error toast as credentials might just not be set up yet
    } finally {
      setLoadingCredentials(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let tool: ToolV2;

    if (toolCategory === "dbRead") {
      // DB Read tool validation
      if (!selectedCredentialId) {
        errorToast("Please select a database credential");
        return;
      }

      if (!tableName.trim()) {
        errorToast("Please enter a table name");
        return;
      }

      // Validate tool name format if provided
      if (toolName.trim() && !/^[a-z_][a-z0-9_]*$/.test(toolName.trim())) {
        errorToast("Tool name must be lowercase with underscores only (e.g., query_users)");
        return;
      }

      // Parse columns
      const columnsArray = columns.trim()
        ? columns.split(",").map((c) => c.trim()).filter((c) => c.length > 0)
        : undefined;

      const dbTool: DbReadTool = {
        type: "dbRead",
        credentialId: selectedCredentialId as number,
        table: tableName.trim(),
      };

      if (toolName.trim()) {
        dbTool.name = toolName.trim();
      }
      if (description.trim()) {
        dbTool.description = description.trim();
      }
      if (columnsArray && columnsArray.length > 0) {
        dbTool.columns = columnsArray;
      }
      if (maxLimit !== 100) {
        dbTool.maxLimit = maxLimit;
      }

      tool = dbTool;
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

  const selectedCredential = dbCredentials.find((c) => c.id === selectedCredentialId);

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
                    Read structured data from external DB
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
              {/* Credential Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Database Credential *
                </label>
                {loadingCredentials ? (
                  <div className="text-gray-400 text-sm">Loading credentials...</div>
                ) : dbCredentials.length === 0 ? (
                  <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <KeyIcon className="h-5 w-5 text-yellow-400 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-300">
                          No Database Credentials Found
                        </h4>
                        <p className="text-xs text-yellow-400/80 mt-1">
                          You need to create a credential with type &quot;Database Connection&quot; first.
                          Go to Credentials → Add Credential → Select &quot;Database Connection&quot; type.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <select
                    value={selectedCredentialId}
                    onChange={(e) => setSelectedCredentialId(e.target.value ? parseInt(e.target.value) : "")}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                    disabled={isEditing}
                  >
                    <option value="">Select a credential...</option>
                    {dbCredentials.map((cred) => (
                      <option key={cred.id} value={cred.id}>
                        {formatServiceName(cred.service_name)}
                        {cred.credential_metadata?.label ? ` - ${cred.credential_metadata.label}` : ""}
                        {cred.credential_metadata?.environment ? ` (${cred.credential_metadata.environment})` : ""}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-gray-400 text-xs mt-2">
                  Select a stored credential containing the database connection string.
                </p>
                {isEditing && (
                  <p className="text-gray-400 text-xs mt-1">
                    Credential cannot be changed when editing.
                  </p>
                )}
              </div>

              {/* Selected Credential Info */}
              {selectedCredential && (
                <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CircleStackIcon className="h-5 w-5 text-green-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-white">
                        {formatServiceName(selectedCredential.service_name)}
                      </h4>
                      {selectedCredential.credential_metadata?.label && (
                        <p className="text-xs text-gray-300 mt-1">
                          {selectedCredential.credential_metadata.label}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Credential ID: {selectedCredential.id}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Table Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Database Table *
                </label>
                <input
                  type="text"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="e.g., users, orders, products"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={isEditing}
                  required
                />
                <p className="text-gray-400 text-xs mt-2">
                  The database table the agent can query.
                </p>
              </div>

              {/* Tool Name (optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tool Name
                </label>
                <input
                  type="text"
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
                  placeholder={tableName ? `query_${tableName.toLowerCase()}` : "e.g., query_users"}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                />
                <p className="text-gray-400 text-xs mt-2">
                  Optional custom name for the tool. Must be lowercase with underscores only.
                  Defaults to &quot;query_{"{table}"}&quot;.
                </p>
              </div>

              {/* Columns (optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Allowed Columns
                </label>
                <input
                  type="text"
                  value={columns}
                  onChange={(e) => setColumns(e.target.value)}
                  placeholder="e.g., id, name, email, created_at"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                />
                <p className="text-gray-400 text-xs mt-2">
                  Comma-separated list of columns the agent can query and see.
                  Leave empty to allow all non-sensitive columns.
                </p>
              </div>

              {/* Max Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Maximum Rows
                </label>
                <input
                  type="number"
                  value={maxLimit}
                  onChange={(e) => setMaxLimit(Math.max(1, Math.min(1000, parseInt(e.target.value) || 100)))}
                  min="1"
                  max="1000"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-gray-400 text-xs mt-2">
                  Maximum rows the agent can request per query (1-1000). Default is 100.
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
                ? "Describe what data this table contains and what queries are useful..."
                : "Describe what this knowledge base contains..."}
              rows={3}
              className={`w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${
                toolCategory === "dbRead" ? "focus:ring-green-500" : "focus:ring-blue-500"
              } resize-none`}
            />
            <p className="text-gray-400 text-xs mt-2">
              Help the LLM decide when and how to use this tool.
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
              disabled={toolCategory === "dbRead" && dbCredentials.length === 0}
              className={`flex-1 font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-white disabled:opacity-50 disabled:cursor-not-allowed ${
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
