"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  vectorStoresService,
  Index,
  Namespace,
  CreateNamespaceRequest,
} from "@/services/vectorStoresService";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";
import {
  PlusIcon,
  ArrowLeftIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

export function IndexDetailsContainer({
  indexName,
}: {
  indexName: string;
}) {
  const router = useRouter();
  const [index, setIndex] = useState<Index | null>(null);
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingNamespaces, setLoadingNamespaces] = useState(true);
  const [showCreateNamespaceForm, setShowCreateNamespaceForm] = useState(false);

  useEffect(() => {
    loadIndexDetails();
    loadNamespaces();
  }, [indexName]);

  const loadIndexDetails = async () => {
    try {
      setLoading(true);
      const indexes = await vectorStoresService.listIndexes();
      const foundIndex = indexes.find((idx) => idx.name === indexName);
      if (foundIndex) {
        setIndex(foundIndex);
      } else {
        errorToast("Index not found");
        router.push("/dashboard/vector-stores");
      }
    } catch (error: any) {
      errorToast(error.message || "Failed to load index details");
    } finally {
      setLoading(false);
    }
  };

  const loadNamespaces = async () => {
    try {
      setLoadingNamespaces(true);
      const data = await vectorStoresService.listNamespaces(indexName);
      setNamespaces(data);
    } catch (error: any) {
      errorToast(
        error.message || `Failed to load namespaces for ${indexName}`
      );
    } finally {
      setLoadingNamespaces(false);
    }
  };

  const handleCreateNamespace = async (data: CreateNamespaceRequest) => {
    try {
      await vectorStoresService.createNamespace(indexName, data);
      successToast("Namespace created successfully");
      setShowCreateNamespaceForm(false);
      await loadNamespaces();
    } catch (error: any) {
      errorToast(error.message || "Failed to create namespace");
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Loading index details...</div>
      </div>
    );
  }

  if (!index) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard/vector-stores")}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <h1 className="text-4xl font-semibold text-white">{index.name}</h1>
        </div>
        <button
          onClick={() => setShowCreateNamespaceForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Create Namespace
        </button>
      </div>

      {/* Create Namespace Form Modal */}
      {showCreateNamespaceForm && (
        <CreateNamespaceForm
          indexName={indexName}
          onClose={() => setShowCreateNamespaceForm(false)}
          onSubmit={handleCreateNamespace}
        />
      )}

      {/* Index Details Card */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        <h2 className="text-2xl font-semibold text-white mb-6">
          Index Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-400">Name</label>
            <p className="text-white text-lg mt-1">{index.name}</p>
          </div>
          {index.dimension && (
            <div>
              <label className="text-sm font-medium text-gray-400">
                Dimension
              </label>
              <p className="text-white text-lg mt-1">{index.dimension}</p>
            </div>
          )}
          {index.metric && (
            <div>
              <label className="text-sm font-medium text-gray-400">Metric</label>
              <p className="text-white text-lg mt-1 capitalize">
                {index.metric}
              </p>
            </div>
          )}
          {index.pods && (
            <div>
              <label className="text-sm font-medium text-gray-400">Pods</label>
              <p className="text-white text-lg mt-1">{index.pods}</p>
            </div>
          )}
          {index.replicas && (
            <div>
              <label className="text-sm font-medium text-gray-400">
                Replicas
              </label>
              <p className="text-white text-lg mt-1">{index.replicas}</p>
            </div>
          )}
          {index.pod_type && (
            <div>
              <label className="text-sm font-medium text-gray-400">
                Pod Type
              </label>
              <p className="text-white text-lg mt-1">{index.pod_type}</p>
            </div>
          )}
        </div>
      </div>

      {/* Namespaces Section */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        <h2 className="text-2xl font-semibold text-white mb-6">Namespaces</h2>

        {loadingNamespaces ? (
          <div className="text-gray-400 text-sm py-4">
            Loading namespaces...
          </div>
        ) : namespaces.length === 0 ? (
          <div className="text-gray-400 text-sm py-4">
            No namespaces found. Create one to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {namespaces.map((namespace) => (
              <div
                key={namespace.namespace}
                className="bg-gray-900/50 border border-gray-700/30 rounded-lg p-4"
              >
                <div className="text-white font-medium mb-2">
                  {namespace.namespace || "(default)"}
                </div>
                {namespace.vector_count !== undefined && (
                  <div className="text-sm text-gray-400">
                    {namespace.vector_count.toLocaleString()} vectors
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Placeholder for future data ingestion section */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        <h2 className="text-2xl font-semibold text-white mb-4">
          Data Ingestion
        </h2>
        <p className="text-gray-400">
          Data ingestion features will be added here in a future update.
        </p>
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

