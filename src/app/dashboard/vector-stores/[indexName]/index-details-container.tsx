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
  DocumentTextIcon,
  DocumentArrowUpIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { ChooseTextFile } from "@/components/vector-stores/choose-text-file";
import { ChooseCsvFile } from "@/components/vector-stores/choose-csv-file";
import { IngestionLogs } from "@/components/vector-stores/ingestion-logs";

export function IndexDetailsContainer({ indexName }: { indexName: string }) {
  const router = useRouter();
  const [index, setIndex] = useState<Index | null>(null);
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingNamespaces, setLoadingNamespaces] = useState(true);
  const [showCreateNamespaceForm, setShowCreateNamespaceForm] = useState(false);
  const [activeIngestionTab, setActiveIngestionTab] = useState("ingest-text");
  const [selectedNamespace, setSelectedNamespace] = useState<string>("");
  const [textFiles, setTextFiles] = useState<File[] | null>(null);
  const [csvFiles, setCsvFiles] = useState<File[] | null>(null);
  const [logsRefreshTrigger, setLogsRefreshTrigger] = useState(0);

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
      // Set default namespace if available and none selected
      if (data.length > 0 && !selectedNamespace) {
        setSelectedNamespace(data[0].namespace || "");
      }
    } catch (error: any) {
      errorToast(error.message || `Failed to load namespaces for ${indexName}`);
    } finally {
      setLoadingNamespaces(false);
    }
  };

  const handleUploadSuccess = async () => {
    // Reload namespaces to get updated vector counts
    await loadNamespaces();
    // Trigger logs refresh
    setLogsRefreshTrigger((prev) => prev + 1);
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
              <label className="text-sm font-medium text-gray-400">
                Metric
              </label>
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

      {/* Data Ingestion Section */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        <h2 className="text-2xl font-semibold text-white mb-6">
          Data Ingestion
        </h2>

        {/* Namespace Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Namespace *
          </label>
          <select
            value={selectedNamespace}
            onChange={(e) => setSelectedNamespace(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loadingNamespaces || namespaces.length === 0}
          >
            {loadingNamespaces ? (
              <option>Loading namespaces...</option>
            ) : namespaces.length === 0 ? (
              <option>No namespaces available</option>
            ) : (
              <>
                <option value="">Select a namespace</option>
                {namespaces.map((ns) => (
                  <option key={ns.namespace} value={ns.namespace || ""}>
                    {ns.namespace || "(default)"}
                    {ns.vector_count !== undefined
                      ? ` (${ns.vector_count.toLocaleString()} vectors)`
                      : ""}
                  </option>
                ))}
              </>
            )}
          </select>
          {namespaces.length === 0 && (
            <p className="text-gray-400 text-xs mt-2">
              Create a namespace first to upload data.
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-700 mb-6">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveIngestionTab("ingest-text")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeIngestionTab === "ingest-text"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              disabled={!selectedNamespace}
            >
              <DocumentArrowUpIcon className="w-4 h-4" />
              Ingest Text
            </button>
            <button
              onClick={() => setActiveIngestionTab("ingest-csv")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeIngestionTab === "ingest-csv"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              disabled={!selectedNamespace}
            >
              <DocumentTextIcon className="w-4 h-4" />
              Ingest CSV
            </button>
            <button
              onClick={() => setActiveIngestionTab("logs")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeIngestionTab === "logs"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <ClipboardDocumentListIcon className="w-4 h-4" />
              Ingestion Logs
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeIngestionTab === "ingest-text" && (
          <div className="space-y-4">
            {!selectedNamespace ? (
              <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4">
                <p className="text-yellow-300 text-sm">
                  Please select a namespace above to upload text files.
                </p>
              </div>
            ) : (
              <>
                <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Ingest Text
                  </h3>
                  <p className="text-white text-sm leading-relaxed">
                    Upload .txt and .md files. These files will be processed and
                    added to the knowledge base in namespace &quot;
                    {selectedNamespace || "(default)"}&quot;.
                  </p>
                </div>
                <ChooseTextFile
                  indexName={indexName}
                  namespace={selectedNamespace}
                  files={textFiles}
                  setFiles={setTextFiles}
                  onUploadSuccess={handleUploadSuccess}
                />
              </>
            )}
          </div>
        )}

        {activeIngestionTab === "ingest-csv" && (
          <div className="space-y-4">
            {!selectedNamespace ? (
              <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4">
                <p className="text-yellow-300 text-sm">
                  Please select a namespace above to upload CSV files.
                </p>
              </div>
            ) : (
              <>
                <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Ingest CSV
                  </h3>
                  <p className="text-white text-sm leading-relaxed">
                    Upload .csv files with Q&A format (q,a columns). These files
                    will be processed and added to the knowledge base in
                    namespace &quot;{selectedNamespace || "(default)"}&quot;.
                  </p>
                </div>
                <ChooseCsvFile
                  indexName={indexName}
                  namespace={selectedNamespace}
                  files={csvFiles}
                  setFiles={setCsvFiles}
                  onUploadSuccess={handleUploadSuccess}
                />
              </>
            )}
          </div>
        )}

        {activeIngestionTab === "logs" && (
          <div>
            <IngestionLogs
              indexName={indexName}
              refreshTrigger={logsRefreshTrigger}
            />
          </div>
        )}
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
