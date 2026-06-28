"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  vectorStoresService,
  Index,
  Namespace,
  CreateIndexRequest,
  CreateNamespaceRequest,
  SharedVectorStore,
} from "@/services/vectorStoresService";
import { errorToast } from "@/shared/toasts/errorToast";
import { PageLoading } from "@/components/shared/common/page-loading";
import { successToast } from "@/shared/toasts/successToast";
import {
  PlusIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  TrashIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
export function VectorStoresContainer() {
  const router = useRouter();
  const [indexes, setIndexes] = useState<Index[]>([]);
  const [sharedStores, setSharedStores] = useState<SharedVectorStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIndexes, setExpandedIndexes] = useState<Set<string>>(
    new Set()
  );
  const [indexNamespaces, setIndexNamespaces] = useState<
    Record<string, Namespace[]>
  >({});
  const [loadingNamespaces, setLoadingNamespaces] = useState<
    Record<string, boolean>
  >({});
  const [showCreateIndexForm, setShowCreateIndexForm] = useState(false);
  const [showCreateNamespaceForm, setShowCreateNamespaceForm] = useState<
    string | null
  >(null);

  useEffect(() => {
    loadIndexes();
  }, []);

  const loadIndexes = async () => {
    setLoading(true);
    // Own indexes and shared knowledge bases load independently: a member with no
    // Pinecone credential of their own still has shared KBs to see, so a failure
    // to list own indexes must NOT discard the shared section (and vice versa).
    const [data, shared] = await Promise.all([
      vectorStoresService.listIndexes().catch((error: any) => {
        console.error("Failed to load own indexes:", error);
        return [] as Index[];
      }),
      vectorStoresService.listSharedVectorStores().catch((error: any) => {
        console.error("Failed to load shared knowledge bases:", error);
        return [] as SharedVectorStore[];
      }),
    ]);
    setIndexes(data);
    setSharedStores(shared);
    setLoading(false);
  };

  const toggleIndexExpansion = async (indexName: string) => {
    const isExpanded = expandedIndexes.has(indexName);
    const newExpanded = new Set(expandedIndexes);

    if (isExpanded) {
      newExpanded.delete(indexName);
    } else {
      newExpanded.add(indexName);
      // Load namespaces if not already loaded
      if (!indexNamespaces[indexName]) {
        await loadNamespaces(indexName);
      }
    }

    setExpandedIndexes(newExpanded);
  };

  const loadNamespaces = async (indexName: string) => {
    try {
      setLoadingNamespaces((prev) => ({ ...prev, [indexName]: true }));
      const data = await vectorStoresService.listNamespaces(indexName);
      setIndexNamespaces((prev) => ({ ...prev, [indexName]: data }));
    } catch (error: any) {
      errorToast(error.message || `Failed to load namespaces for ${indexName}`);
    } finally {
      setLoadingNamespaces((prev) => ({ ...prev, [indexName]: false }));
    }
  };

  const handleCreateIndex = async (data: CreateIndexRequest) => {
    try {
      await vectorStoresService.createIndex(data);
      successToast("Index created successfully");
      setShowCreateIndexForm(false);
      loadIndexes();
    } catch (error: any) {
      errorToast(error.message || "Failed to create index");
      throw error;
    }
  };

  const handleCreateNamespace = async (
    indexName: string,
    data: CreateNamespaceRequest
  ) => {
    try {
      await vectorStoresService.createNamespace(indexName, data);
      successToast("Namespace created successfully");
      setShowCreateNamespaceForm(null);
      // Reload namespaces for this index
      await loadNamespaces(indexName);
    } catch (error: any) {
      errorToast(error.message || "Failed to create namespace");
      throw error;
    }
  };

  if (loading) {
    return (
      <PageLoading label="Loading indexes..." />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-semibold text-white">Knowledge Bases</h1>
        <button
          onClick={() => setShowCreateIndexForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Create Index
        </button>
      </div>

      {/* Create Index Form Modal */}
      {showCreateIndexForm && (
        <CreateIndexForm
          onClose={() => setShowCreateIndexForm(false)}
          onSubmit={handleCreateIndex}
        />
      )}

      {/* Create Namespace Form Modal */}
      {showCreateNamespaceForm && (
        <CreateNamespaceForm
          indexName={showCreateNamespaceForm}
          onClose={() => setShowCreateNamespaceForm(null)}
          onSubmit={(data) =>
            handleCreateNamespace(showCreateNamespaceForm, data)
          }
        />
      )}

      {/* Indexes List */}
      {indexes.length === 0 && sharedStores.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-12 text-center">
          <p className="text-gray-400 text-lg mb-4">No indexes found</p>
          <p className="text-gray-500 text-sm mb-6">
            Get started by creating your first Pinecone index
          </p>
          <button
            onClick={() => setShowCreateIndexForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Create Index
          </button>
        </div>
      ) : indexes.length === 0 ? null : (
        <div className="space-y-4">
          {indexes.map((index) => (
            <IndexCard
              key={index.name}
              index={index}
              isExpanded={expandedIndexes.has(index.name)}
              namespaces={indexNamespaces[index.name] || []}
              loadingNamespaces={loadingNamespaces[index.name] || false}
              onToggleExpansion={() => toggleIndexExpansion(index.name)}
              onCreateNamespace={() => setShowCreateNamespaceForm(index.name)}
              onViewDetails={() =>
                router.push(
                  `/dashboard/vector-stores?indexName=${encodeURIComponent(index.name)}`
                )
              }
              onViewNamespace={(namespace) =>
                router.push(
                  `/dashboard/vector-stores?indexName=${encodeURIComponent(
                    index.name
                  )}&namespace=${encodeURIComponent(namespace)}`
                )
              }
            />
          ))}
        </div>
      )}

      {/* Shared with me */}
      {sharedStores.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-white mt-4">
            Shared with me
          </h2>
          <div className="space-y-3">
            {sharedStores.map((store) => (
              <div
                key={`${store.owner_account_id}:${store.index_name}`}
                role="button"
                tabIndex={0}
                onClick={() =>
                  router.push(
                    `/dashboard/vector-stores?indexName=${encodeURIComponent(
                      store.index_name,
                    )}&ownerAccountId=${store.owner_account_id}&canWrite=${
                      store.can_write ? 1 : 0
                    }`,
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(
                      `/dashboard/vector-stores?indexName=${encodeURIComponent(
                        store.index_name,
                      )}&ownerAccountId=${store.owner_account_id}&canWrite=${
                        store.can_write ? 1 : 0
                      }`,
                    );
                  }
                }}
                className="group cursor-pointer bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 flex items-center justify-between hover:border-blue-500/40 hover:bg-gray-800/70 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold text-white">
                    {store.index_name}
                  </h3>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full border ${
                      store.can_write
                        ? "text-green-300 border-green-500/40 bg-green-600/10"
                        : "text-gray-300 border-gray-500/40 bg-gray-600/10"
                    }`}
                  >
                    {store.can_write ? "Can edit" : "View only"}
                  </span>
                </div>
                <span className="text-blue-400 group-hover:text-blue-300 text-sm font-medium flex items-center gap-1 transition-colors">
                  View Details
                  <ArrowRightIcon className="h-4 w-4" />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IndexCard({
  index,
  isExpanded,
  namespaces,
  loadingNamespaces,
  onToggleExpansion,
  onCreateNamespace,
  onViewDetails,
  onViewNamespace,
}: {
  index: Index;
  isExpanded: boolean;
  namespaces: Namespace[];
  loadingNamespaces: boolean;
  onToggleExpansion: () => void;
  onCreateNamespace: () => void;
  onViewDetails: () => void;
  onViewNamespace: (namespace: string) => void;
}) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden">
      {/* Index Header */}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-3 flex-1 cursor-pointer hover:bg-gray-800/70 transition-colors -m-2 p-2 rounded-lg"
            onClick={onToggleExpansion}
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            )}
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white">{index.name}</h3>
              <div className="flex gap-4 mt-2 text-sm text-gray-400">
                {index.dimension && <span>Dimension: {index.dimension}</span>}
                {index.metric && <span>Metric: {index.metric}</span>}
                {index.pods && <span>Pods: {index.pods}</span>}
                {index.replicas && <span>Replicas: {index.replicas}</span>}
              </div>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2 ml-4"
          >
            View Details
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Namespaces Section */}
      {isExpanded && (
        <div className="border-t border-gray-700/50 p-6">
          {loadingNamespaces ? (
            <div className="text-gray-400 text-sm py-4">
              Loading namespaces...
            </div>
          ) : namespaces.length === 0 ? (
            <div className="text-gray-400 text-sm py-4">
              No namespaces found. Create one to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {namespaces.map((namespace) => (
                <div
                  key={namespace.namespace}
                  className="group bg-gray-900/50 border border-gray-700/30 rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="text-white font-medium">
                      {namespace.namespace || "(default)"}
                    </div>
                    {namespace.vector_count !== undefined && (
                      <div className="text-sm text-gray-400 mt-1">
                        {namespace.vector_count.toLocaleString()} vectors
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onViewNamespace(namespace.namespace)}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1 transition-colors"
                  >
                    View Details
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CreateIndexForm({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: CreateIndexRequest) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [dimension, setDimension] = useState<number>(1536);
  const [metric, setMetric] = useState<string>("cosine");
  const [pods, setPods] = useState<number>(1);
  const [replicas, setReplicas] = useState<number>(1);
  const [podType, setPodType] = useState<string>("s1.x1");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      errorToast("Index name is required");
      return;
    }

    if (dimension < 1) {
      errorToast("Dimension must be at least 1");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        name: name.trim(),
        dimension,
        metric,
        pods,
        replicas,
        pod_type: podType,
      });
      setName("");
      setDimension(1536);
      setMetric("cosine");
      setPods(1);
      setReplicas(1);
      setPodType("s1.x1");
    } catch (error) {
      // Error already handled in parent
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-semibold text-white mb-4">Create Index</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Index Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-index"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Dimension *
              </label>
              <input
                type="number"
                value={dimension}
                onChange={(e) => setDimension(parseInt(e.target.value) || 0)}
                min="1"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Metric
              </label>
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cosine">Cosine</option>
                <option value="euclidean">Euclidean</option>
                <option value="dotproduct">Dot Product</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Pods
              </label>
              <input
                type="number"
                value={pods}
                onChange={(e) => setPods(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Replicas
              </label>
              <input
                type="number"
                value={replicas}
                onChange={(e) => setReplicas(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Pod Type
              </label>
              <input
                type="text"
                value={podType}
                onChange={(e) => setPodType(e.target.value)}
                placeholder="s1.x1"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

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
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {submitting ? "Creating..." : "Create Index"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateNamespaceForm({
  indexName,
  onClose,
  onSubmit,
}: {
  indexName: string;
  onClose: () => void;
  onSubmit: (data: CreateNamespaceRequest) => Promise<void>;
}) {
  const [namespace, setNamespace] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namespace.trim()) {
      errorToast("Namespace name is required");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({ namespace: namespace.trim() });
      setNamespace("");
    } catch (error) {
      // Error already handled in parent
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-semibold text-white mb-4">
          Create Namespace
        </h2>
        <p className="text-gray-400 text-sm mb-4">
          Index: <span className="text-white font-medium">{indexName}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Namespace Name *
            </label>
            <input
              type="text"
              value={namespace}
              onChange={(e) => setNamespace(e.target.value)}
              placeholder="my-namespace"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-gray-400 text-xs mt-2">
              Namespaces are created automatically when you first upsert data to
              them. This validates the namespace name.
            </p>
          </div>

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
              disabled={submitting}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {submitting ? "Creating..." : "Create Namespace"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
