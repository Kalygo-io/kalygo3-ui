"use client";

import { useState, useEffect } from "react";
import { vectorStoresService, Index } from "@/services/vectorStoresService";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";
import { PageLoading } from "@/components/shared/common/page-loading";
import { CircleStackIcon } from "@heroicons/react/24/outline";
import { DataIngestion } from "@/components/vector-stores/data-ingestion";

export function DataIngestionContainer() {
  const [indexes, setIndexes] = useState<Index[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<string>("");

  useEffect(() => {
    loadIndexes();
  }, []);

  const loadIndexes = async () => {
    try {
      setLoading(true);
      const data = await vectorStoresService.listIndexes();
      setIndexes(data);
      if (data.length > 0) {
        setSelectedIndex(data[0].name);
      }
    } catch (error: any) {
      errorToast(error.message || "Failed to load knowledge bases");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLoading label="Loading knowledge bases..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-semibold text-white">Data Ingestion</h1>
        <p className="text-gray-400 mt-2">
          Upload text or CSV files into a knowledge base namespace.
        </p>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        {indexes.length === 0 ? (
          <div className="text-center py-12">
            <CircleStackIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-sm">
              No knowledge bases found. Create one from the Show All page to get
              started.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Index Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Knowledge Base *
              </label>
              <select
                value={selectedIndex}
                onChange={(e) => setSelectedIndex(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {indexes.map((idx) => (
                  <option key={idx.name} value={idx.name}>
                    {idx.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Namespace selector + ingest tabs for the chosen index */}
            {selectedIndex && (
              <DataIngestion
                key={selectedIndex}
                indexName={selectedIndex}
                onUploadSuccess={() => successToast("Upload complete")}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
