"use client";

import { useState } from "react";
import {
  accessService,
  ResourceAudit,
  EffectiveAccount,
} from "@/services/accessService";
import { errorToast } from "@/shared/toasts/errorToast";
import { ShieldCheckIcon, UsersIcon, CircleStackIcon } from "@heroicons/react/24/outline";

/**
 * Owner-facing audit: who can actually reach this agent (grants resolved to
 * individual users), plus the DERIVED exposure — the indexes the agent searches
 * and whose source documents those same users can open. Surfacing the implicit
 * agent→index→source chain is the whole point.
 */
export function AgentAccessAudit({ agentId }: { agentId: string }) {
  const [audit, setAudit] = useState<ResourceAudit | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const run = async () => {
    try {
      setLoading(true);
      const data = await accessService.auditResource("agent", Number(agentId));
      setAudit(data);
      setLoaded(true);
    } catch (e: any) {
      errorToast(e?.message || "Failed to load access audit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <ShieldCheckIcon className="h-5 w-5 text-emerald-400" />
          Access audit
        </h3>
        <button
          onClick={run}
          disabled={loading}
          className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm font-medium py-1.5 px-3 rounded-lg transition-colors"
        >
          {loading ? "Checking…" : loaded ? "Refresh" : "Who has access?"}
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-1">
        Everyone who can run this agent — and the knowledge bases &amp; source
        documents they can therefore read.
      </p>

      {audit && (
        <div className="mt-4 space-y-5">
          {/* Effective users */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-1.5">
              <UsersIcon className="h-4 w-4" /> People with access ({audit.effective_accounts.length})
            </h4>
            {audit.effective_accounts.length === 0 ? (
              <p className="text-sm text-gray-400">No one but the owner.</p>
            ) : (
              <ul className="divide-y divide-gray-700/60 rounded-lg border border-gray-700/60 overflow-hidden">
                {audit.effective_accounts.map((a: EffectiveAccount) => (
                  <li key={a.account_id} className="flex items-center justify-between px-3 py-2 bg-gray-900/40">
                    <span className="text-sm text-gray-200">{a.email || `account #${a.account_id}`}</span>
                    <span className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-gray-700 text-gray-200">{a.role}</span>
                      <span className="text-gray-400">{a.via}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Derived exposure */}
          {audit.derived_exposure.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-1.5">
                <CircleStackIcon className="h-4 w-4" /> Knowledge bases exposed through this agent
              </h4>
              <ul className="space-y-2">
                {audit.derived_exposure.map((d) => (
                  <li
                    key={`${d.resource_type}:${d.resource_id}:${d.label}`}
                    className="rounded-lg border px-3 py-2"
                    style={{
                      backgroundColor: "rgba(245, 158, 11, 0.12)",
                      borderColor: "rgba(245, 158, 11, 0.45)",
                    }}
                  >
                    <div
                      className="text-sm font-medium"
                      style={{ color: "#fde68a" }}
                    >
                      {d.label}
                    </div>
                    <div className="text-xs" style={{ color: "#fcd34d" }}>
                      {d.note}
                    </div>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-400 mt-2">
                These have no separate grant — access is inherited from the agent. The
                people listed above can read this content and open its source files.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
