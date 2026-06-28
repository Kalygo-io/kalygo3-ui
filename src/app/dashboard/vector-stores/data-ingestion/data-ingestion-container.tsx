"use client";

import { useState, useEffect } from "react";
import { vectorStoresService } from "@/services/vectorStoresService";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";
import { PageLoading } from "@/components/shared/common/page-loading";
import { CircleStackIcon } from "@heroicons/react/24/outline";
import { DataIngestion } from "@/components/vector-stores/data-ingestion";

/** A pickable ingest target — either an own index or a writable shared KB. */
interface IngestTarget {
  indexName: string;
  /** Owner of a shared KB; undefined for the caller's own index. */
  ownerAccountId?: number;
  shared: boolean;
}

/** Stable <option> value that encodes the owner (or "own"). */
function targetKey(t: IngestTarget): string {
  return t.ownerAccountId != null ? `shared:${t.ownerAccountId}:${t.indexName}` : `own:${t.indexName}`;
}

export function DataIngestionContainer() {
  const [targets, setTargets] = useState<IngestTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string>("");

  useEffect(() => {
    loadTargets();
  }, []);

  const loadTargets = async () => {
    try {
      setLoading(true);
      const [indexes, shared] = await Promise.all([
        vectorStoresService.listIndexes(),
        vectorStoresService.listSharedVectorStores().catch(() => []),
      ]);
      const ownTargets: IngestTarget[] = indexes.map((idx) => ({
        indexName: idx.name,
        shared: false,
      }));
      const sharedTargets: IngestTarget[] = shared
        .filter((s) => s.can_write)
        .map((s) => ({
          indexName: s.index_name,
          ownerAccountId: s.owner_account_id,
          shared: true,
        }));
      const all = [...ownTargets, ...sharedTargets];
      setTargets(all);
      if (all.length > 0) {
        setSelectedKey(targetKey(all[0]));
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

  const selectedTarget = targets.find((t) => targetKey(t) === selectedKey);

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
        {targets.length === 0 ? (
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
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {targets.map((t) => {
                  const key = targetKey(t);
                  return (
                    <option key={key} value={key}>
                      {t.indexName}
                      {t.shared ? " (shared)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Namespace selector + ingest tabs for the chosen index */}
            {selectedTarget && (
              <DataIngestion
                key={selectedKey}
                indexName={selectedTarget.indexName}
                ownerAccountId={selectedTarget.ownerAccountId}
                onUploadSuccess={() => successToast("Upload complete")}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
