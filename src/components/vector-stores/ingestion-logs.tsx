"use client";

import { useState, useEffect, useCallback } from "react";
import {
  vectorStoresService,
  IngestionLog,
  IngestionLogsListResponse,
} from "@/services/vectorStoresService";
import { errorToast } from "@/shared/toasts/errorToast";
import {
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

interface IngestionLogsProps {
  indexName: string;
  refreshTrigger?: number;
}

export function IngestionLogs({
  indexName,
  refreshTrigger,
}: IngestionLogsProps) {
  const [logs, setLogs] = useState<IngestionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(30);
  const [pagination, setPagination] = useState<{
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  } | null>(null);

  const fetchLogs = useCallback(
    async (offsetValue: number = 0) => {
      setLoading(true);
      setError(null);
      try {
        // Ensure offset is always a valid number
        const numOffset =
          typeof offsetValue === "number" && !isNaN(offsetValue)
            ? offsetValue
            : 0;

        const response = await vectorStoresService.getIngestionLogs(indexName, {
          limit: pageSize,
          offset: numOffset,
        });

        console.log("Ingestion logs response:", response);
        console.log("Logs array:", response.logs);
        console.log("Logs length:", response.logs?.length);

        // Ensure we have a valid logs array
        if (response && Array.isArray(response.logs)) {
          setLogs(response.logs);
          setPagination({
            total: response.total || 0,
            limit: response.limit || 100,
            offset: response.offset || 0,
            has_more: response.has_more || false,
          });
        } else {
          console.error("Invalid response structure:", response);
          setError("Invalid response format from server");
          setLogs([]);
        }
      } catch (err: any) {
        console.error("Error fetching ingestion logs:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load ingestion logs";
        setError(errorMessage);
        errorToast(errorMessage);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    },
    [indexName, pageSize]
  );

  useEffect(() => {
    fetchLogs(0);
  }, [fetchLogs, refreshTrigger]);

  const handlePageSizeChange = async (newPageSize: number) => {
    setPageSize(newPageSize);
    // Reset to first page when page size changes
    setLoading(true);
    setError(null);
    try {
      const response = await vectorStoresService.getIngestionLogs(indexName, {
        limit: newPageSize,
        offset: 0,
      });

      if (response && Array.isArray(response.logs)) {
        setLogs(response.logs);
        setPagination({
          total: response.total || 0,
          limit: response.limit || newPageSize,
          offset: 0,
          has_more: response.has_more || false,
        });
      } else {
        console.error("Invalid response structure:", response);
        setError("Invalid response format from server");
        setLogs([]);
      }
    } catch (err: any) {
      console.error("Error fetching ingestion logs:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load ingestion logs";
      setError(errorMessage);
      errorToast(errorMessage);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
      case "completed":
        return "text-green-400";
      case "failed":
      case "error":
        return "text-red-400";
      case "pending":
      case "in_progress":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  const getOperationTypeColor = (operationType: string) => {
    switch (operationType.toLowerCase()) {
      case "upload":
      case "ingest":
        return "text-blue-400";
      case "delete":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Ingestion Logs</h3>
        <button
          onClick={(e) => {
            e.preventDefault();
            fetchLogs(0);
          }}
          disabled={loading}
          className="p-2 hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
          title="Refresh logs"
        >
          <ArrowPathIcon
            className={`w-5 h-5 text-gray-400 ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {loading && logs.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          <span className="ml-2 text-gray-300">Loading logs...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4">
          <p className="text-red-300 text-sm">{error}</p>
          <button
            onClick={(e) => {
              e.preventDefault();
              fetchLogs(0);
            }}
            className="mt-2 text-red-300 hover:text-red-200 text-sm underline"
          >
            Try again
          </button>
        </div>
      )}

      {!loading &&
        !error &&
        logs.length === 0 &&
        pagination &&
        pagination.total > 0 && (
          <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4">
            <p className="text-yellow-300 text-sm">
              Warning: Server reports {pagination.total} logs but none are
              displayed. Check console for details.
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        logs.length === 0 &&
        (!pagination || pagination.total === 0) && (
          <div className="bg-gray-800/50 border border-gray-700/30 rounded-lg p-8 text-center">
            <p className="text-gray-400">No ingestion logs found</p>
          </div>
        )}

      {!loading && !error && logs.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Operation
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Namespace
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Files
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Vectors Added
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Vectors Deleted
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Vectors Failed
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Error
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800/30 divide-y divide-gray-700">
                {logs.map((log, index) => (
                  <tr key={log.id} className="hover:bg-gray-800/50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                      {pagination ? pagination.offset + index + 1 : index + 1}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(log.created_at)}
                    </td>
                    <td
                      className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${getOperationTypeColor(
                        log.operation_type
                      )}`}
                    >
                      {log.operation_type || "N/A"}
                    </td>
                    <td
                      className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${getStatusColor(
                        log.status
                      )}`}
                    >
                      {log.status || "N/A"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                      {log.namespace || "(default)"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {log.filenames && log.filenames.length > 0 ? (
                        <div className="space-y-1">
                          {log.filenames.slice(0, 2).map((filename, idx) => (
                            <div
                              key={idx}
                              className="truncate max-w-xs"
                              title={filename}
                            >
                              {filename}
                            </div>
                          ))}
                          {log.filenames.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{log.filenames.length - 2} more
                            </div>
                          )}
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                      {log.vectors_added.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                      {log.vectors_deleted.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                      {log.vectors_failed.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-400 max-w-xs">
                      {log.error_message ? (
                        <div className="truncate" title={log.error_message}>
                          {log.error_message}
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </td>
                  </tr>
                ))}
                {/* Placeholder rows to pad the final page */}
                {pagination &&
                  logs.length > 0 &&
                  logs.length < pageSize &&
                  !pagination.has_more &&
                  Array.from({ length: pageSize - logs.length }).map(
                    (_, idx) => (
                      <tr
                        key={`placeholder-${idx}`}
                        className="opacity-0 pointer-events-none"
                        aria-hidden="true"
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                          &nbsp;
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                          &nbsp;
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                          &nbsp;
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                          &nbsp;
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                          &nbsp;
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          &nbsp;
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                          &nbsp;
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                          &nbsp;
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                          &nbsp;
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          &nbsp;
                        </td>
                      </tr>
                    )
                  )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-400">
                  Showing{" "}
                  <span className="font-medium text-white">
                    {pagination.offset + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-white">
                    {Math.min(
                      pagination.offset + pagination.limit,
                      pagination.total
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-white">
                    {pagination.total.toLocaleString()}
                  </span>{" "}
                  logs
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Show:</span>
                  <div className="flex items-center gap-1">
                    {[10, 20, 40].map((size) => (
                      <button
                        key={size}
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageSizeChange(size);
                        }}
                        disabled={loading}
                        className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                          pageSize === size
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    fetchLogs(
                      Math.max(0, pagination.offset - pagination.limit)
                    );
                  }}
                  disabled={loading || pagination.offset === 0}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-700"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                  Previous
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    fetchLogs(pagination.offset + pagination.limit);
                  }}
                  disabled={loading || !pagination.has_more}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-700"
                >
                  Next
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
