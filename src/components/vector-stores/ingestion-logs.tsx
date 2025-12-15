"use client";

import { useState, useEffect, useCallback } from "react";
import {
  vectorStoresService,
  IngestionLog,
  IngestionLogsListResponse,
} from "@/services/vectorStoresService";
import { errorToast } from "@/shared/toasts/errorToast";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

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
          limit: 100,
          offset: numOffset,
        });
        setLogs(response.logs);
        setPagination({
          total: response.total,
          limit: response.limit,
          offset: response.offset,
          has_more: response.has_more,
        });
      } catch (err: any) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load ingestion logs";
        setError(errorMessage);
        errorToast(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [indexName]
  );

  useEffect(() => {
    fetchLogs(0);
  }, [fetchLogs, refreshTrigger]);

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
          onClick={fetchLogs}
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
            onClick={fetchLogs}
            className="mt-2 text-red-300 hover:text-red-200 text-sm underline"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div className="bg-gray-800/50 border border-gray-700/30 rounded-lg p-8 text-center">
          <p className="text-gray-400">No ingestion logs found</p>
        </div>
      )}

      {pagination && logs.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-400 mt-4">
          <div>
            Showing {pagination.offset + 1}-
            {Math.min(pagination.offset + pagination.limit, pagination.total)}{" "}
            of {pagination.total.toLocaleString()} logs
          </div>
          <div className="flex gap-2">
            {pagination.offset > 0 && (
              <button
                onClick={() =>
                  fetchLogs(Math.max(0, pagination.offset - pagination.limit))
                }
                disabled={loading}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
            )}
            {pagination.has_more && (
              <button
                onClick={() => fetchLogs(pagination.offset + pagination.limit)}
                disabled={loading}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            )}
          </div>
        </div>
      )}

      {!loading && !error && logs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800/50">
              <tr>
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
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-800/50">
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
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
