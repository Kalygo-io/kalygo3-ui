"use client";

import { useState, useEffect } from "react";
import {
  accessGroupsService,
  AccessGroup,
  AgentAccessGrant,
} from "@/services/accessGroupsService";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";
import {
  TrashIcon,
  PlusIcon,
  UserGroupIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";

interface AgentSharingPanelProps {
  agentId: string;
}

export function AgentSharingPanel({ agentId }: AgentSharingPanelProps) {
  const [grants, setGrants] = useState<AgentAccessGrant[]>([]);
  const [myGroups, setMyGroups] = useState<AccessGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [granting, setGranting] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [grantsData, groupsData] = await Promise.all([
        accessGroupsService.listAgentGrants(agentId),
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
    if (!selectedGroupId) return;

    const groupId = parseInt(selectedGroupId, 10);
    if (isNaN(groupId)) return;

    try {
      setGranting(true);
      const grant = await accessGroupsService.grantAgentAccess(agentId, {
        accessGroupId: groupId,
      });
      setGrants((prev) => [...prev, grant]);
      setSelectedGroupId("");
      successToast("Access granted to group");
    } catch (error: any) {
      errorToast(error.message || "Failed to grant access");
    } finally {
      setGranting(false);
    }
  };

  const handleRevoke = async (grant: AgentAccessGrant) => {
    const groupName = grant.access_group_name || `Group #${grant.access_group_id}`;
    const confirmed = window.confirm(
      `Revoke access for "${groupName}"? Members of this group will no longer be able to use this agent.`,
    );
    if (!confirmed) return;

    try {
      await accessGroupsService.revokeAgentAccess(
        agentId,
        grant.access_group_id,
      );
      setGrants((prev) => prev.filter((g) => g.id !== grant.id));
      successToast("Access revoked");
    } catch (error: any) {
      errorToast(error.message || "Failed to revoke access");
    }
  };

  // Groups that don't already have a grant
  const availableGroups = myGroups.filter(
    (group) =>
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
          Share with Groups
        </h2>
      </div>

      <p className="text-gray-400 text-sm mb-6">
        Grant access groups permission to use this agent. Members of granted
        groups can view and chat with this agent.
      </p>

      {/* Grant Form */}
      {availableGroups.length > 0 && (
        <div className="flex gap-3 mb-6">
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a group...</option>
            {availableGroups.map((group) => (
              <option key={group.id} value={group.id.toString()}>
                {group.name}
                {group.member_count !== undefined
                  ? ` (${group.member_count} member${group.member_count !== 1 ? "s" : ""})`
                  : ""}
              </option>
            ))}
          </select>
          <button
            onClick={handleGrant}
            disabled={!selectedGroupId || granting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            {granting ? "Granting..." : "Grant Access"}
          </button>
        </div>
      )}

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
            to start sharing this agent.
          </p>
        </div>
      )}

      {/* Current Grants */}
      {grants.length === 0 ? (
        <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-6 text-center">
          <p className="text-gray-500 text-sm">
            This agent is not shared with any groups yet.
          </p>
        </div>
      ) : (
        <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50 border-b border-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Group
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
                  const groupName =
                    grant.access_group_name ||
                    myGroups.find((g) => g.id === grant.access_group_id)
                      ?.name ||
                    `Group #${grant.access_group_id}`;

                  return (
                    <tr
                      key={grant.id}
                      className="hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <UserGroupIcon className="h-4 w-4 text-blue-400" />
                          <span className="text-sm text-white font-medium">
                            {groupName}
                          </span>
                        </div>
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
