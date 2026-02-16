"use client";

import { useState, useEffect } from "react";
import {
  InformationCircleIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CogIcon,
  ArrowPathIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { DrawerCloseButton } from "@/components/shared/drawer-close-button";
// import { ChooseFile } from "./choose-file";
import {
  callGetAiSchoolKbStats,
  KbStats,
} from "@/services/callGetAiSchoolKbStats";
import { callDeleteAiSchoolVectorsInNamespace } from "@/services/callDeleteAiSchoolVectorsInNamespace";
import { errorToast, successToast } from "@/shared/toasts";

interface ContextualAsideProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
}

export function ContextualAside({
  isOpen,
  onClose,
  onUploadSuccess,
}: ContextualAsideProps) {
  const [activeTab, setActiveTab] = useState("kb-stats");
  const [kbStats, setKbStats] = useState<KbStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [files, setFiles] = useState<File[] | null>(null);

  const fetchKbStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await callGetAiSchoolKbStats();
      setKbStats(stats);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch KB stats";
      setError(errorMessage);
      errorToast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVectors = async () => {
    if (!kbStats?.namespace) {
      errorToast("No namespace available for deletion");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete all vectors in namespace "${kbStats.namespace}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      const response = await callDeleteAiSchoolVectorsInNamespace(
        kbStats.namespace
      );
      if (response.success) {
        successToast(
          `Successfully deleted vectors from namespace "${kbStats.namespace}"`
        );
        // Refresh the stats after deletion
        await fetchKbStats();
      } else {
        const errorMessage = response.error || "Failed to delete vectors";
        setError(errorMessage);
        errorToast(errorMessage);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete vectors";
      setError(errorMessage);
      errorToast(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === "kb-stats") {
      fetchKbStats();
    }
  }, [isOpen, activeTab]);

  const tabs = [
    { id: "kb-stats", name: "KB Stats", icon: DocumentTextIcon },
    { id: "update-kb", name: "Update KB", icon: CogIcon },
  ];

  return (
    <>
      {/* Mobile overlay backdrop */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-16 bottom-0 right-0 w-96 bg-gray-900 border-l border-gray-700 z-[70] transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">
              AI School Agent
            </h2>
            <DrawerCloseButton onClose={onClose} />
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-700 overflow-x-auto">
            <div className="flex min-w-max">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? "text-blue-400 border-b-2 border-blue-400 bg-gray-800"
                        : "text-gray-400 hover:text-gray-300 hover:bg-gray-800"
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">{tab.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "kb-stats" && (
              <div className="space-y-4">
                <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      Knowledge Base Statistics
                    </h3>
                    <button
                      onClick={fetchKbStats}
                      disabled={loading}
                      className="p-1 hover:bg-blue-700/30 rounded transition-colors disabled:opacity-50"
                      title="Refresh stats"
                    >
                      <ArrowPathIcon
                        className={`w-4 h-4 text-blue-400 ${
                          loading ? "animate-spin" : ""
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-white text-sm leading-relaxed">
                    Overview of your current knowledge base content and
                    performance metrics.
                  </p>
                </div>

                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                    <span className="ml-2 text-gray-300">Loading stats...</span>
                  </div>
                )}

                {error && (
                  <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4">
                    <p className="text-red-300 text-sm">{error}</p>
                    <button
                      onClick={fetchKbStats}
                      className="mt-2 text-red-300 hover:text-red-200 text-sm underline"
                    >
                      Try again
                    </button>
                  </div>
                )}

                {!loading && !error && kbStats && (
                  <div className="space-y-3">
                    <h4 className="text-md font-semibold text-white">
                      Index Information:
                    </h4>
                    <div className="space-y-3">
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-300">
                            Index Name
                          </span>
                          <span className="text-sm font-medium text-white">
                            {kbStats.index_name || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-300">
                            Dimensions
                          </span>
                          <span className="text-sm font-medium text-white">
                            {kbStats.index_dimension || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-300">
                            Namespace
                          </span>
                          <span className="text-sm font-medium text-white">
                            {kbStats.namespace || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-300">
                            Vectors in Namespace
                          </span>
                          <span className="text-sm font-medium text-white">
                            {new Intl.NumberFormat().format(
                              kbStats.namespace_vector_count || 0
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Delete Vectors Button */}
                      {kbStats.namespace_vector_count > 0 && (
                        <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm text-red-300 font-medium">
                                Delete All Vectors
                              </span>
                              <p className="text-xs text-red-400 mt-1">
                                This will permanently delete all vectors in
                                namespace &quot;{kbStats.namespace}&quot;
                              </p>
                            </div>
                            <button
                              onClick={handleDeleteVectors}
                              disabled={deleting}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white text-xs font-medium rounded transition-colors"
                              title="Delete all vectors in this namespace"
                            >
                              <TrashIcon className="w-3 h-3" />
                              <span>{deleting ? "Deleting..." : "Delete"}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "update-kb" && (
              <div className="space-y-4">
                <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Update Knowledge Base
                  </h3>
                  <p className="text-white text-sm leading-relaxed">
                    Upload new data into your knowledge base. This tools
                    supports .csv files with 2 columns: q,a
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-md font-semibold text-white">
                    Provide Knowledge:
                  </h4>
                  <div className="space-y-3">
                    {/* <ChooseFile
                      files={files}
                      setFiles={setFiles}
                      onUploadSuccess={() => {
                        if (onUploadSuccess) {
                          onUploadSuccess();
                        }
                        fetchKbStats();
                      }}
                    /> */}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
