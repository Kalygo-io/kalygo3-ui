"use client";

import { Index, Namespace } from "@/services/vectorStoresService";

interface VectorSearchFormProps {
  vectorToolType: "vectorSearch" | "vectorSearchWithReranking";
  setVectorToolType: (v: "vectorSearch" | "vectorSearchWithReranking") => void;
  selectedIndex: string;
  setSelectedIndex: (v: string) => void;
  selectedNamespace: string;
  setSelectedNamespace: (v: string) => void;
  topK: number;
  setTopK: (v: number) => void;
  topN: number;
  setTopN: (v: number) => void;
  indices: Index[];
  namespaces: Namespace[];
  loading: boolean;
  loadingNamespaces: boolean;
  isEditing: boolean;
}

export function VectorSearchForm({
  vectorToolType,
  setVectorToolType,
  selectedIndex,
  setSelectedIndex,
  selectedNamespace,
  setSelectedNamespace,
  topK,
  setTopK,
  topN,
  setTopN,
  indices,
  namespaces,
  loading,
  loadingNamespaces,
  isEditing,
}: VectorSearchFormProps) {
  return (
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
  );
}
