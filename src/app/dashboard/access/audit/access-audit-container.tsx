"use client";

import { useState, useEffect } from "react";
import {
  accessService,
  SharedResource,
  ReverseAuditItem,
  ResourceType,
} from "@/services/accessService";
import { errorToast } from "@/shared/toasts/errorToast";
import { PageLoading } from "@/components/shared/common/page-loading";
import {
  CpuChipIcon,
  CircleStackIcon,
  KeyIcon,
  UserGroupIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

const RESOURCE_META: Record<ResourceType, { label: string; icon: React.ReactNode }> = {
  agent: { label: "Agent", icon: <CpuChipIcon className="h-4 w-4 text-blue-400" /> },
  vector_store: { label: "Knowledge base", icon: <CircleStackIcon className="h-4 w-4 text-teal-300" /> },
  credential: { label: "Credential", icon: <KeyIcon className="h-4 w-4 text-amber-300" /> },
};

function RoleBadge({ role }: { role: string }) {
  const label = role === "write" ? "Can edit" : role === "use" ? "Can use" : role === "owner" ? "Owner" : "View only";
  const elevated = role === "write" || role === "owner";
  // Inline styles so the colors render regardless of Tailwind class generation.
  const style: React.CSSProperties = elevated
    ? { backgroundColor: "#f59e0b", color: "#111827", borderColor: "#fbbf24" }
    : {
        backgroundColor: "rgba(75, 85, 99, 0.2)",
        color: "#d1d5db",
        borderColor: "rgba(107, 114, 128, 0.4)",
      };
  return (
    <span
      style={style}
      className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium border"
    >
      {label}
    </span>
  );
}

export function AccessAuditContainer() {
  const [tab, setTab] = useState<"out" | "in">("out");
  const [loading, setLoading] = useState(true);
  const [sharedByMe, setSharedByMe] = useState<SharedResource[]>([]);
  const [myAccess, setMyAccess] = useState<ReverseAuditItem[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [out, inbound] = await Promise.all([
          accessService.sharedByMe(),
          accessService.myAccessReport(),
        ]);
        setSharedByMe(out);
        setMyAccess(inbound);
      } catch (e: any) {
        errorToast(e?.message || "Failed to load access audit");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <PageLoading label="Loading access audit..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-semibold text-white">Access Audit</h1>
        <p className="text-gray-400 text-sm mt-2">
          Who can reach what. &ldquo;Shared by me&rdquo; is everything you own and have
          shared out; &ldquo;My access&rdquo; is everything shared with you.
        </p>
      </div>

      <div className="inline-flex rounded-lg border border-gray-700 overflow-hidden">
        {([["out", "Shared by me"], ["in", "My access"]] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === k ? "bg-blue-600 text-white" : "bg-gray-900 text-gray-300 hover:bg-gray-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "out" ? (
        sharedByMe.length === 0 ? (
          <p className="text-gray-500 text-sm">You haven&apos;t shared anything.</p>
        ) : (
          <div className="space-y-4">
            {sharedByMe.map((r) => (
              <div
                key={`${r.resource_type}:${r.resource_id}`}
                className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  {RESOURCE_META[r.resource_type].icon}
                  <span className="text-white font-medium">{r.label}</span>
                  <span className="text-xs text-gray-500">{RESOURCE_META[r.resource_type].label}</span>
                </div>
                <ul className="divide-y divide-gray-700/50 rounded-lg border border-gray-700/50 overflow-hidden">
                  {r.shared_with.map((s) => (
                    <li key={s.grant_id} className="flex items-center justify-between px-3 py-2 bg-gray-900/40">
                      <span className="flex items-center gap-2 text-sm text-gray-200">
                        {s.target_type === "group" ? (
                          <UserGroupIcon className="h-4 w-4 text-blue-400" />
                        ) : (
                          <UserIcon className="h-4 w-4 text-indigo-300" />
                        )}
                        {s.label}
                        <span className="text-xs text-gray-500">{s.target_type}</span>
                      </span>
                      <RoleBadge role={s.role} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )
      ) : myAccess.length === 0 ? (
        <p className="text-gray-500 text-sm">Nothing has been shared with you.</p>
      ) : (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800/60 border-b border-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Resource</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Access</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Via</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {myAccess.map((it) => (
                <tr key={`${it.resource_type}:${it.resource_id}`} className="hover:bg-gray-800/30">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 text-sm text-white">
                      {RESOURCE_META[it.resource_type].icon}
                      {it.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{RESOURCE_META[it.resource_type].label}</td>
                  <td className="px-4 py-3"><RoleBadge role={it.role} /></td>
                  <td className="px-4 py-3 text-sm text-gray-400">{it.via}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
