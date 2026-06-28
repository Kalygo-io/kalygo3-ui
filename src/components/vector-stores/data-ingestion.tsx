"use client";

import { useState, useEffect } from "react";
import {
  vectorStoresService,
  Namespace,
} from "@/services/vectorStoresService";
import { errorToast } from "@/shared/toasts/errorToast";
import {
  DocumentTextIcon,
  DocumentArrowUpIcon,
} from "@heroicons/react/24/outline";
import { ChooseTextFile } from "@/components/vector-stores/choose-text-file";
import { ChooseCsvFile } from "@/components/vector-stores/choose-csv-file";

interface Props {
  indexName: string;
  onUploadSuccess?: () => void;
  /** Owner of a shared knowledge base being ingested into (omit for own). */
  ownerAccountId?: number;
}

/**
 * Namespace selector + Ingest Text / Ingest CSV tabs for a given index.
 * Used by the standalone Data Ingestion page (under an index picker).
 */
export function DataIngestion({
  indexName,
  onUploadSuccess,
  ownerAccountId,
}: Props) {
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [loadingNamespaces, setLoadingNamespaces] = useState(true);
  const [selectedNamespace, setSelectedNamespace] = useState<string>("");
  const [activeIngestionTab, setActiveIngestionTab] = useState("ingest-text");
  const [textFiles, setTextFiles] = useState<File[] | null>(null);
  const [csvFiles, setCsvFiles] = useState<File[] | null>(null);

  useEffect(() => {
    // Reset selection when the index changes
    setSelectedNamespace("");
    loadNamespaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indexName]);

  const loadNamespaces = async () => {
    try {
      setLoadingNamespaces(true);
      const data = await vectorStoresService.listNamespaces(
        indexName,
        ownerAccountId,
      );
      setNamespaces(data);
      if (data.length > 0) {
        setSelectedNamespace(data[0].namespace || "");
      }
    } catch (error: any) {
      errorToast(error.message || `Failed to load namespaces for ${indexName}`);
    } finally {
      setLoadingNamespaces(false);
    }
  };

  const handleUploadSuccess = async () => {
    await loadNamespaces();
    onUploadSuccess?.();
  };

  return (
    <div>
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
        {!loadingNamespaces && namespaces.length === 0 && (
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
                ownerAccountId={ownerAccountId}
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
                  Upload .csv files with Q&amp;A format (q,a columns). These
                  files will be processed and added to the knowledge base in
                  namespace &quot;
                  {selectedNamespace || "(default)"}&quot;.
                </p>
              </div>
              <ChooseCsvFile
                indexName={indexName}
                namespace={selectedNamespace}
                ownerAccountId={ownerAccountId}
                files={csvFiles}
                setFiles={setCsvFiles}
                onUploadSuccess={handleUploadSuccess}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
