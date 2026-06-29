"use client";

import { useState, useEffect } from "react";
import {
  accessGroupsService,
  AccessGroup,
} from "@/services/accessGroupsService";
import {
  vectorStoresService,
  VectorStoreAccessGrant,
} from "@/services/vectorStoresService";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";
import { useConfirmDelete } from "@/shared/hooks/use-confirm-delete";
import {
  TrashIcon,
  PlusIcon,
  UserGroupIcon,
  UserIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";

interface KbSharingPanelProps {
  indexName: string;
}

export function KbSharingPanel({ indexName }: KbSharingPanelProps) {
  const confirmDelete = useConfirmDelete();
  const [grants, setGrants] = useState<VectorStoreAccessGrant[]>([]);
  const [myGroups, setMyGroups] = useState<AccessGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [principalType, setPrincipalType] = useState<"group" | "individual">("group");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [granteeEmail, setGranteeEmail] = useState<string>("");
  const [role, setRole] = useState<"read" | "write">("read");
  const [granting, setGranting] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indexName]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [grantsData, groupsData] = await Promise.all([
        vectorStoresService.listVectorStoreGrants(indexName),
        accessGroupsService.listGroups(),
      ]);
      setGrants(grantsData);
      setMyGroups(groupsData);
    } catch (error: any) {
      // Silently fail if user doesn't have access to grants (non-owner)
      console.error("Failed to load sharing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGrant = async () => {
    let principal: { accessGroupId?: number; granteeEmail?: string };
    if (principalType === "group") {
      const groupId = parseInt(selectedGroupId, 10);
      if (isNaN(groupId)) return;
      principal = { accessGroupId: groupId };
    } else {
      if (!granteeEmail.trim()) return;
      principal = { granteeEmail: granteeEmail.trim() };
    }

    try {
      setGranting(true);
      const grant = await vectorStoresService.grantVectorStoreAccess(
        indexName,
        principal,
        role,
      );
      setGrants((prev) => [...prev.filter((g) => g.id !== grant.id), grant]);
      setSelectedGroupId("");
      setGranteeEmail("");
      successToast("Access granted");
    } catch (error: any) {
      errorToast(error.message || "Failed to grant access");
    } finally {
      setGranting(false);
    }
  };

  const handleRevoke = async (grant: VectorStoreAccessGrant) => {
    const name = grant.label || `Grant #${grant.id}`;
    await confirmDelete(
      `Revoke access for "${name}"? They will no longer be able to access this knowledge base.`,
      () => vectorStoresService.revokeVectorStoreAccess(grant.id),
      {
        successMessage: "Access revoked",
        errorMessage: "Failed to revoke access",
        onSuccess: () =>
          setGrants((prev) => prev.filter((g) => g.id !== grant.id)),
      },
    );
  };

  // Groups the caller can manage (owner or admin) that don't already have a grant.
  // The backend enforces this too; filtering keeps the dropdown honest.
  const availableGroups = myGroups.filter(
    (group) =>
      (group.my_role === "owner" || group.my_role === "admin") &&
      !grants.some((grant) => grant.access_group_id === group.id),
  );

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        <div className="text-gray-400 text-sm">Loading sharing settings...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <ShareIcon className="h-5 w-5 text-blue-400" />
        <h2 className="text-xl font-semibold text-white">
          Share Knowledge Base
        </h2>
      </div>

      <p className="text-gray-400 text-sm mb-6">
        Grant a group or individual access. &ldquo;View only&rdquo; can read; &ldquo;Can edit&rdquo;
        can ingest and edit. Migrated group-admin editors appear as individual
        &ldquo;Can edit&rdquo; grants.
      </p>

      {/* Grant Form */}
      <div className="mb-6 space-y-3">
        {/* Principal type toggle */}
        <div className="inline-flex rounded-lg border border-gray-700 overflow-hidden">
          {(["group", "individual"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setPrincipalType(t)}
              className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 ${
                principalType === t
                  ? "bg-blue-600 text-white"
                  : "bg-gray-900 text-gray-300 hover:bg-gray-800"
              }`}
            >
              {t === "group" ? <UserGroupIcon className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
              {t === "group" ? "Group" : "Person"}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          {principalType === "group" ? (
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="flex-1 min-w-[200px] bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">
                {availableGroups.length ? "Select a group..." : "No groups you manage"}
              </option>
              {availableGroups.map((group) => (
                <option key={group.id} value={group.id.toString()}>
                  {group.name}
                  {group.member_count !== undefined
                    ? ` (${group.member_count} member${group.member_count !== 1 ? "s" : ""})`
                    : ""}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="email"
              value={granteeEmail}
              onChange={(e) => setGranteeEmail(e.target.value)}
              placeholder="person@example.com"
              className="flex-1 min-w-[200px] bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          {/* Role */}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "read" | "write")}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Access level"
          >
            <option value="read">View only</option>
            <option value="write">Can edit</option>
          </select>

          <button
            onClick={handleGrant}
            disabled={
              granting ||
              (principalType === "group" ? !selectedGroupId : !granteeEmail.trim())
            }
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            {granting ? "Granting..." : "Grant Access"}
          </button>
        </div>
      </div>

      {availableGroups.length === 0 && myGroups.length === 0 && (
        <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-6 text-center mb-6">
          <UserGroupIcon className="h-8 w-8 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">
            You don&apos;t have any access groups yet.{" "}
            <a
              href="/dashboard/groups/create"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Create one
            </a>{" "}
            to start sharing this knowledge base.
          </p>
        </div>
      )}

      {/* Current Grants */}
      {grants.length === 0 ? (
        <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-6 text-center">
          <p className="text-gray-500 text-sm">
            This knowledge base is not shared with any groups yet.
          </p>
        </div>
      ) : (
        <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50 border-b border-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Shared with
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Access
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Granted
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {grants.map((grant) => {
                  const isGroup = grant.target_type === "group";
                  const name =
                    grant.label ||
                    (isGroup
                      ? myGroups.find((g) => g.id === grant.access_group_id)?.name ||
                        `Group #${grant.access_group_id}`
                      : `Account #${grant.grantee_account_id}`);

                  return (
                    <tr
                      key={grant.id}
                      className="hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {isGroup ? (
                            <UserGroupIcon className="h-4 w-4 text-blue-400" />
                          ) : (
                            <UserIcon className="h-4 w-4 text-indigo-300" />
                          )}
                          <span className="text-sm text-white font-medium">
                            {name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {isGroup ? "group" : "individual"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
                            grant.role === "write"
                              ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                              : "bg-gray-600/20 text-gray-300 border-gray-500/40"
                          }`}
                        >
                          {grant.role === "write" ? "Can edit" : "View only"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-400">
                          {grant.created_at
                            ? new Date(grant.created_at).toLocaleDateString()
                            : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleRevoke(grant)}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-600/20 rounded-lg transition-colors duration-200"
                          title="Revoke access"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
