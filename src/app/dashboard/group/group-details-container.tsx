"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  accessGroupsService,
  AccessGroup,
  AccessGroupMember,
} from "@/services/accessGroupsService";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";
import {
  ArrowLeftIcon,
  TrashIcon,
  PlusIcon,
  PencilIcon,
  UserGroupIcon,
  EnvelopeIcon,
  XMarkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

export function GroupDetailsContainer({ groupId }: { groupId?: string }) {
  const router = useRouter();
  const [group, setGroup] = useState<AccessGroup | null>(null);
  const [members, setMembers] = useState<AccessGroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // Edit name state
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);

  // Add member state
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [addingMember, setAddingMember] = useState(false);

  const numericGroupId = groupId ? parseInt(groupId, 10) : undefined;

  useEffect(() => {
    if (!numericGroupId || isNaN(numericGroupId)) {
      errorToast("Group ID is required");
      router.push("/dashboard/groups");
      return;
    }

    loadGroup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericGroupId]);

  const loadGroup = async () => {
    if (!numericGroupId) return;

    try {
      setLoading(true);
      const [groupData, membersData] = await Promise.all([
        accessGroupsService.getGroup(numericGroupId),
        accessGroupsService.listMembers(numericGroupId),
      ]);
      setGroup(groupData);
      setMembers(membersData);
      setNameInput(groupData.name);
    } catch (error: any) {
      errorToast(error.message || "Failed to load group");
      router.push("/dashboard/groups");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!numericGroupId || !nameInput.trim()) return;

    try {
      setSavingName(true);
      const updated = await accessGroupsService.updateGroup(numericGroupId, {
        name: nameInput.trim(),
      });
      setGroup(updated);
      setEditingName(false);
      successToast("Group name updated");
    } catch (error: any) {
      errorToast(error.message || "Failed to update group name");
    } finally {
      setSavingName(false);
    }
  };

  const handleDelete = async () => {
    if (!numericGroupId || !group) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${group.name}"? This will remove all members and revoke all agent grants for this group.`,
    );
    if (!confirmed) return;

    try {
      setDeleting(true);
      await accessGroupsService.deleteGroup(numericGroupId);
      successToast(`Group "${group.name}" deleted successfully`);
      router.push("/dashboard/groups");
    } catch (error: any) {
      errorToast(error.message || "Failed to delete group");
    } finally {
      setDeleting(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numericGroupId || !memberEmail.trim()) return;

    try {
      setAddingMember(true);
      const member = await accessGroupsService.addMember(numericGroupId, {
        email: memberEmail.trim(),
      });
      setMembers((prev) => [...prev, member]);
      setMemberEmail("");
      setShowAddMember(false);
      successToast("Member added successfully");
    } catch (error: any) {
      errorToast(error.message || "Failed to add member");
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (member: AccessGroupMember) => {
    if (!numericGroupId) return;

    const confirmed = window.confirm(
      `Remove ${member.email || `account #${member.account_id}`} from this group?`,
    );
    if (!confirmed) return;

    try {
      await accessGroupsService.removeMember(
        numericGroupId,
        member.account_id,
      );
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      successToast("Member removed");
    } catch (error: any) {
      errorToast(error.message || "Failed to remove member");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Loading group details...</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Group not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard/groups")}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-400" />
          </button>
          <div className="flex items-center gap-3">
            <UserGroupIcon className="h-7 w-7 text-blue-400" />
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") {
                      setEditingName(false);
                      setNameInput(group.name);
                    }
                  }}
                />
                <button
                  onClick={handleSaveName}
                  disabled={savingName}
                  className="p-1.5 text-green-400 hover:bg-green-600/20 rounded-lg transition-colors"
                >
                  <CheckIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    setEditingName(false);
                    setNameInput(group.name);
                  }}
                  className="p-1.5 text-gray-400 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-4xl font-semibold text-white">
                  {group.name}
                </h1>
                <button
                  onClick={() => setEditingName(true)}
                  className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-600/20 rounded-lg transition-colors"
                  title="Edit name"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Delete group"
        >
          <TrashIcon className="h-5 w-5" />
          <span className="text-sm font-medium">
            {deleting ? "Deleting..." : "Delete Group"}
          </span>
        </button>
      </div>

      {/* Group Info */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Group Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-400">
              Group ID
            </label>
            <p className="text-white mt-1">{group.id}</p>
          </div>
          {group.created_at && (
            <div>
              <label className="text-sm font-medium text-gray-400">
                Created At
              </label>
              <p className="text-white mt-1">
                {new Date(group.created_at).toLocaleString()}
              </p>
            </div>
          )}
          {group.updated_at && (
            <div>
              <label className="text-sm font-medium text-gray-400">
                Updated At
              </label>
              <p className="text-white mt-1">
                {new Date(group.updated_at).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Members Section */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            Members ({members.length})
          </h2>
          <button
            onClick={() => setShowAddMember(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
          >
            <PlusIcon className="h-4 w-4" />
            Add Member
          </button>
        </div>

        {/* Add Member Form */}
        {showAddMember && (
          <form
            onSubmit={handleAddMember}
            className="mb-6 bg-gray-900/50 border border-gray-700/50 rounded-lg p-4"
          >
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Add member by email
            </label>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={addingMember}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                {addingMember ? "Adding..." : "Add"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddMember(false);
                  setMemberEmail("");
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-2">
              The account must already exist on Kalygo.
            </p>
          </form>
        )}

        {/* Members List */}
        {members.length === 0 ? (
          <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-8 text-center">
            <UserGroupIcon className="h-10 w-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm mb-4">
              No members yet. Add members to share agents with them.
            </p>
            {!showAddMember && (
              <button
                onClick={() => setShowAddMember(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                <PlusIcon className="h-4 w-4" />
                Add Your First Member
              </button>
            )}
          </div>
        ) : (
          <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50 border-b border-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Account ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Added
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {members.map((member) => (
                    <tr
                      key={member.id}
                      className="hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-white">
                          {member.email || (
                            <span className="text-gray-500 italic">
                              Unknown
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-400">
                          {member.account_id}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-400">
                          {member.created_at
                            ? new Date(member.created_at).toLocaleDateString()
                            : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleRemoveMember(member)}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-600/20 rounded-lg transition-colors duration-200"
                          title="Remove member"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
