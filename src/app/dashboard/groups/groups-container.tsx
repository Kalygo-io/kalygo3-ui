"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  accessGroupsService,
  AccessGroup,
} from "@/services/accessGroupsService";
import { errorToast } from "@/shared/toasts/errorToast";
import {
  ArrowRightIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

export function GroupsContainer() {
  const router = useRouter();
  const [groups, setGroups] = useState<AccessGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await accessGroupsService.listGroups();
      setGroups(data);
    } catch (error: any) {
      errorToast(error.message || "Failed to load access groups");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (groupId: number) => {
    router.push(`/dashboard/group?group_id=${groupId}`);
  };

  const handleCreate = () => {
    router.push("/dashboard/groups/create");
  };

  const handleDelete = async (group: AccessGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `Are you sure you want to delete "${group.name}"? This will remove all members and revoke all agent grants for this group.`,
    );
    if (!confirmed) return;

    try {
      await accessGroupsService.deleteGroup(group.id);
      setGroups((prev) => prev.filter((g) => g.id !== group.id));
    } catch (error: any) {
      errorToast(error.message || "Failed to delete group");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Loading access groups...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-semibold text-white">Access Groups</h1>
        <button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Create Group
        </button>
      </div>

      <p className="text-gray-400 text-sm">
        Access groups let you share agents with other accounts. Create a group,
        add members, then grant the group access to specific agents.
      </p>

      {/* Groups List */}
      {groups.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-12 text-center">
          <UserGroupIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">No access groups yet</p>
          <p className="text-gray-500 text-sm mb-6">
            Create a group to start sharing agents with other accounts.
          </p>
          <button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 inline-flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Create Your First Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onViewDetails={() => handleViewDetails(group.id)}
              onDelete={(e) => handleDelete(group, e)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GroupCard({
  group,
  onViewDetails,
  onDelete,
}: {
  group: AccessGroup;
  onViewDetails: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 transition-all duration-200 hover:shadow-lg hover:border-gray-600/50 flex flex-col">
      <div className="flex-1 mb-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5 text-blue-400" />
            <h3 className="text-xl font-semibold text-white">{group.name}</h3>
          </div>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-600/20 rounded-lg transition-colors duration-200"
            title="Delete group"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-3">
          {group.member_count !== undefined && (
            <span className="px-2 py-1 bg-gray-700/50 rounded">
              {group.member_count} member{group.member_count !== 1 ? "s" : ""}
            </span>
          )}
          {group.created_at && (
            <span className="px-2 py-1 bg-gray-700/50 rounded">
              Created: {new Date(group.created_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onViewDetails}
        className="mt-auto w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
      >
        Manage Group
        <ArrowRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
