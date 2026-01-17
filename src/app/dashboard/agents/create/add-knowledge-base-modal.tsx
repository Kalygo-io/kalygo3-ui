"use client";

import { useState, useEffect } from "react";
import { KnowledgeBase } from "@/services/agentsService";
import {
  vectorStoresService,
  Index,
  Namespace,
} from "@/services/vectorStoresService";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";

interface AddKnowledgeBaseModalProps {
  onClose: () => void;
  onAdd: (kb: KnowledgeBase) => void;
  initialKnowledgeBase?: KnowledgeBase;
}

export function AddKnowledgeBaseModal({
  onClose,
  onAdd,
  initialKnowledgeBase,
}: AddKnowledgeBaseModalProps) {
  const [provider, setProvider] = useState<string>(
    initialKnowledgeBase?.provider || "pinecone"
  );
  const [indexes, setIndexes] = useState<Index[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<string>(
    initialKnowledgeBase?.index || ""
  );
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState<string>(
    initialKnowledgeBase?.namespace || ""
  );
  const [description, setDescription] = useState<string>(
    initialKnowledgeBase?.description || ""
  );
  const [loadingIndexes, setLoadingIndexes] = useState(false);
  const [loadingNamespaces, setLoadingNamespaces] = useState(false);

  useEffect(() => {
    if (provider === "pinecone") {
      loadIndexes();
    }
  }, [provider]);

  useEffect(() => {
    if (provider === "pinecone" && selectedIndex) {
      loadNamespaces(selectedIndex);
    } else {
      setNamespaces([]);
      if (!selectedIndex) {
        setSelectedNamespace("");
      }
    }
  }, [selectedIndex, provider]);

  const loadIndexes = async () => {
    try {
      setLoadingIndexes(true);
      const data = await vectorStoresService.listIndexes();
      setIndexes(data);
    } catch (error: any) {
      errorToast(error.message || "Failed to load indexes");
    } finally {
      setLoadingIndexes(false);
    }
  };

  const loadNamespaces = async (indexName: string) => {
    try {
      setLoadingNamespaces(true);
      const data = await vectorStoresService.listNamespaces(indexName);
      setNamespaces(data);
    } catch (error: any) {
      errorToast(error.message || "Failed to load namespaces");
    } finally {
      setLoadingNamespaces(false);
    }
  };

  // Load namespaces when editing and index is already selected
  useEffect(() => {
    if (initialKnowledgeBase?.index && provider === "pinecone" && selectedIndex === initialKnowledgeBase.index && namespaces.length === 0) {
      loadNamespaces(initialKnowledgeBase.index);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKnowledgeBase?.index, provider, selectedIndex]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling

    if (provider === "pinecone") {
      if (!selectedIndex) {
        errorToast("Please select an index");
        return;
      }
      if (!selectedNamespace) {
        errorToast("Please select a namespace");
        return;
      }

      const knowledgeBase: KnowledgeBase = {
        provider: "pinecone",
        index: selectedIndex,
        namespace: selectedNamespace,
        ...(description.trim() && { description: description.trim() }),
      };

      console.log("Modal: About to call onAdd with:", knowledgeBase);

      // Call the callback to add the knowledge base to parent state
      onAdd(knowledgeBase);

      console.log("Modal: onAdd callback called");

      // Reset form state for next time
      setSelectedIndex("");
      setSelectedNamespace("");
      setDescription("");
    } else {
      errorToast("Unsupported provider");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-semibold text-white mb-4">
          {initialKnowledgeBase
            ? "Edit Knowledge Base"
            : "Add Knowledge Base to Agent"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Provider *
            </label>
            <select
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value);
                setSelectedIndex("");
                setSelectedNamespace("");
                setDescription("");
              }}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pinecone">Pinecone</option>
            </select>
            <p className="text-gray-400 text-xs mt-2">
              Select the knowledge base provider.
            </p>
          </div>

          {/* Pinecone-specific fields */}
          {provider === "pinecone" && (
            <>
              {/* Index Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Index *
                </label>
                {loadingIndexes ? (
                  <div className="text-gray-400 text-sm py-2">
                    Loading indexes...
                  </div>
                ) : (
                  <select
                    value={selectedIndex}
                    onChange={(e) => {
                      setSelectedIndex(e.target.value);
                      setSelectedNamespace("");
                    }}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select an index</option>
                    {indexes.map((index) => (
                      <option key={index.name} value={index.name}>
                        {index.name}
                      </option>
                    ))}
                  </select>
                )}
                {indexes.length === 0 && !loadingIndexes && (
                  <p className="text-gray-400 text-xs mt-2">
                    No indexes available. Create one in Vector Stores first.
                  </p>
                )}
              </div>

              {/* Namespace Selection */}
              {selectedIndex && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Namespace *
                  </label>
                  {loadingNamespaces ? (
                    <div className="text-gray-400 text-sm py-2">
                      Loading namespaces...
                    </div>
                  ) : (
                    <select
                      value={selectedNamespace}
                      onChange={(e) => setSelectedNamespace(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select a namespace</option>
                      {namespaces.map((ns) => (
                        <option key={ns.namespace} value={ns.namespace || ""}>
                          {ns.namespace || "(default)"}
                          {ns.vector_count !== undefined &&
                            ` (${ns.vector_count.toLocaleString()} vectors)`}
                        </option>
                      ))}
                    </select>
                  )}
                  {namespaces.length === 0 && !loadingNamespaces && (
                    <p className="text-gray-400 text-xs mt-2">
                      No namespaces available for this index.
                    </p>
                  )}
                </div>
              )}

              {/* Description Field */}
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
                  Optional: Provide a description of what this knowledge base contains.
                </p>
              </div>
            </>
          )}

          {/* Action Buttons */}
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
              disabled={
                provider === "pinecone" &&
                (!selectedIndex || !selectedNamespace)
              }
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {initialKnowledgeBase ? "Update Knowledge Base" : "Add Knowledge Base"}
            </button>
          </div>
          {/* Debug info - remove in production */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 p-2 bg-gray-900 rounded text-xs text-gray-400">
              <div>Provider: {provider}</div>
              <div>Index: {selectedIndex || "none"}</div>
              <div>Namespace: {selectedNamespace || "none"}</div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
