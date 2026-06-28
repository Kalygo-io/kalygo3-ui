"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  vectorStoresService,
  Index,
  Namespace,
  NamespaceFile,
  NamespaceFilesResponse,
} from "@/services/vectorStoresService";
import { errorToast } from "@/shared/toasts/errorToast";
import { useConfirmDelete } from "@/shared/hooks/use-confirm-delete";
import { PageLoading } from "@/components/shared/common/page-loading";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  TrashIcon,
  DocumentArrowUpIcon,
  CircleStackIcon,
  CubeIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

export function NamespaceDetailsContainer({
  indexName,
  namespace,
  ownerAccountId,
  canWrite: canWriteProp,
}: {
  indexName: string;
  namespace: string;
  ownerAccountId?: number;
  canWrite?: boolean;
}) {
  const router = useRouter();
  const confirmDelete = useConfirmDelete();
  const isOwnKb = ownerAccountId == null;
  const canWrite = isOwnKb ? true : !!canWriteProp;
  const sharedQuery = isOwnKb
    ? ""
    : `&ownerAccountId=${ownerAccountId}&canWrite=${canWrite ? 1 : 0}`;
  const [index, setIndex] = useState<Index | null>(null);
  const [namespaceData, setNamespaceData] = useState<Namespace | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Per-file breakdown loads independently so the stat cards render immediately.
  const [filesData, setFilesData] = useState<NamespaceFilesResponse | null>(null);
  const [filesLoading, setFilesLoading] = useState(true);
  const [filesError, setFilesError] = useState<string | null>(null);

  const displayName = namespace || "(default)";
  const indexHref = `/dashboard/vector-stores?indexName=${encodeURIComponent(
    indexName,
  )}${sharedQuery}`;

  useEffect(() => {
    loadDetails();
    loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indexName, namespace]);

  const loadFiles = async () => {
    try {
      setFilesLoading(true);
      setFilesError(null);
      const data = await vectorStoresService.listNamespaceFiles(
        indexName,
        namespace,
        ownerAccountId,
      );
      setFilesData(data);
    } catch (error: any) {
      setFilesError(error.message || "Failed to load files");
    } finally {
      setFilesLoading(false);
    }
  };

  const loadDetails = async (showPageLoading = true) => {
    try {
      if (showPageLoading) setLoading(true);
      // listIndexes only returns the caller's own indexes; for a shared KB we
      // use the name we already have and skip the ownership lookup.
      const namespaces = await vectorStoresService.listNamespaces(
        indexName,
        ownerAccountId,
      );
      let foundIndex: Index | undefined;
      if (isOwnKb) {
        const indexes = await vectorStoresService.listIndexes();
        foundIndex = indexes.find((idx) => idx.name === indexName);
        if (!foundIndex) {
          errorToast("Index not found");
          router.push("/dashboard/vector-stores");
          return;
        }
      } else {
        foundIndex = { name: indexName };
      }
      const foundNamespace = namespaces.find(
        (ns) => (ns.namespace || "") === namespace,
      );
      if (!foundNamespace) {
        errorToast(`Namespace "${displayName}" not found`);
        router.push(indexHref);
        return;
      }
      setIndex(foundIndex);
      setNamespaceData(foundNamespace);
    } catch (error: any) {
      errorToast(error.message || "Failed to load namespace details");
    } finally {
      if (showPageLoading) setLoading(false);
    }
  };

  // Refresh all stats in place without a full page reload.
  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([loadDetails(false), loadFiles()]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteNamespace = async () => {
    await confirmDelete(
      `Are you sure you want to delete all vectors in namespace "${displayName}"? This action cannot be undone.`,
      () =>
        vectorStoresService.deleteNamespaceVectors(
          indexName,
          namespace,
          ownerAccountId,
        ),
      {
        successMessage: `Namespace "${displayName}" vectors deleted successfully`,
        errorMessage: "Failed to delete namespace vectors",
        onSuccess: () => router.push(indexHref),
      },
    );
  };

  const handleDeleteFile = async (file: NamespaceFile) => {
    await confirmDelete(
      `Delete all ${file.vector_count.toLocaleString()} vectors for "${file.filename}"? This action cannot be undone.`,
      () =>
        vectorStoresService.deleteFileVectors(
          indexName,
          namespace,
          file.filename,
          ownerAccountId,
        ),
      {
        successMessage: `Deleted vectors for "${file.filename}"`,
        errorMessage: "Failed to delete file vectors",
        // Refresh both the per-file table and the namespace stat cards in place.
        onSuccess: async () => {
          await Promise.all([loadFiles(), loadDetails(false)]);
        },
      },
    );
  };

  // Per-file delete needs a full live scan to find the matching vector ids, so
  // it's only available when the breakdown came from a complete Pinecone scan.
  const perFileDeletable =
    canWrite &&
    !!filesData &&
    filesData.source === "pinecone" &&
    !filesData.truncated;

  if (loading) {
    return <PageLoading label="Loading namespace details..." />;
  }

  if (!index || !namespaceData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(indexHref)}
            className="text-gray-400 hover:text-white transition-colors"
            title="Back to index"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <button
              onClick={() => router.push(indexHref)}
              className="text-sm text-gray-400 hover:text-blue-400 transition-colors"
            >
              {index.name}
            </button>
            <h1 className="text-4xl font-semibold text-white">{displayName}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh stats"
            className="bg-gray-700/60 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <ArrowPathIcon
              className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <button
            onClick={() =>
              router.push("/dashboard/vector-stores/data-ingestion")
            }
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <DocumentArrowUpIcon className="h-5 w-5" />
            Ingest Data
          </button>
          {canWrite && (
            <button
              onClick={handleDeleteNamespace}
              className="bg-red-600/90 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <TrashIcon className="h-5 w-5" />
              Delete Vectors
            </button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={CubeIcon}
          label="Vectors"
          value={
            namespaceData.vector_count !== undefined
              ? namespaceData.vector_count.toLocaleString()
              : "—"
          }
        />
        <StatCard icon={CircleStackIcon} label="Knowledge Base" value={index.name} />
        <StatCard
          icon={CircleStackIcon}
          label="Dimension"
          value={index.dimension ?? "—"}
        />
      </div>

      {/* Files in this namespace */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-semibold text-white">
            Files in this namespace
          </h2>
          {filesData && !filesLoading && (
            <span className="text-sm text-gray-400">
              {filesData.files.length} file
              {filesData.files.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {filesData &&
          (filesData.truncated || filesData.source === "ingestion_log") && (
            <p className="text-xs text-amber-300/80 mb-4">
              {filesData.source === "ingestion_log"
                ? "Approximate counts from ingestion history — this namespace is too large to scan live."
                : "Partial breakdown — this namespace is larger than the scan limit."}
            </p>
          )}

        <div className="overflow-x-auto rounded-lg border border-gray-700/50 mt-4">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-900/60 text-gray-400">
              <tr>
                <th className="px-4 py-3 font-medium">File</th>
                <th className="px-4 py-3 font-medium">Uploaded At</th>
                <th className="px-4 py-3 font-medium">Uploaded By</th>
                <th className="px-4 py-3 font-medium text-right">Vectors</th>
                <th className="px-4 py-3 font-medium text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {filesLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-sm text-gray-400"
                  >
                    Loading files…
                  </td>
                </tr>
              ) : filesError ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-sm text-red-400"
                  >
                    {filesError}
                  </td>
                </tr>
              ) : !filesData || filesData.files.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12">
                    <div className="text-center">
                      <DocumentTextIcon className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-300 text-sm font-medium">
                        No files found
                      </p>
                      <p className="text-gray-500 text-xs mt-1 max-w-md mx-auto">
                        This namespace has no vectors with a recognizable source
                        file yet.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filesData.files.map((f) => (
                  <tr
                    key={f.filename}
                    className="hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <DocumentTextIcon className="h-4 w-4 text-blue-400 shrink-0" />
                        <span
                          className="text-white truncate"
                          title={f.filename}
                        >
                          {f.filename}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                      {formatUploadedAt(f.uploaded_at)}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      <span className="truncate block max-w-[16rem]" title={f.uploaded_by || undefined}>
                        {f.uploaded_by || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300 tabular-nums">
                      {f.vector_count.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canWrite && (
                        <button
                          onClick={() => handleDeleteFile(f)}
                          disabled={!perFileDeletable}
                          title={
                            perFileDeletable
                              ? `Delete vectors for "${f.filename}"`
                              : "Namespace too large to delete by file"
                          }
                          className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-600/20 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-gray-500 disabled:hover:bg-transparent"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/** Format an epoch-ms string (as stored in vector metadata) as a local date. */
function formatUploadedAt(value?: string | null): string {
  if (!value) return "—";
  const ms = Number(value);
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
}) {
  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-9 w-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
          <Icon className="h-5 w-5 text-blue-400" />
        </div>
        <span className="text-sm font-medium text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white truncate" title={String(value)}>
        {value}
      </p>
    </div>
  );
}
