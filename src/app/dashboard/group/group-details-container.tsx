"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  accessGroupsService,
  AccessGroup,
  AccessGroupMember,
  GroupAgent,
} from "@/services/accessGroupsService";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";
import { PageLoading } from "@/components/shared/common/page-loading";
import { EmptyState } from "@/components/shared/common/empty-state";
import { useConfirmDelete } from "@/shared/hooks/use-confirm-delete";
import {
  ArrowLeftIcon,
  TrashIcon,
  PlusIcon,
  PencilIcon,
  UserGroupIcon,
  EnvelopeIcon,
  XMarkIcon,
  CheckIcon,
  CpuChipIcon,
} from "@heroicons/react/24/outline";

export function GroupDetailsContainer({ groupId }: { groupId?: string }) {
  const router = useRouter();
  const confirmDelete = useConfirmDelete();
  const [group, setGroup] = useState<AccessGroup | null>(null);
  const [members, setMembers] = useState<AccessGroupMember[]>([]);
  const [agents, setAgents] = useState<GroupAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // Edit name state
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);

  // Add member(s) state — accepts a paste of many emails at once
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmails, setMemberEmails] = useState("");
  const [addingMembers, setAddingMembers] = useState(false);
  const [addResults, setAddResults] = useState<{
    added: string[];
    already: string[];
    notFound: string[];
    failed: string[];
  } | null>(null);

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
      const [groupData, membersData, agentsData] = await Promise.all([
        accessGroupsService.getGroup(numericGroupId),
        accessGroupsService.listMembers(numericGroupId),
        accessGroupsService.listGroupAgents(numericGroupId),
      ]);
      setGroup(groupData);
      setMembers(membersData);
      setAgents(agentsData);
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

    setDeleting(true);
    try {
      await confirmDelete(
        `Are you sure you want to delete "${group.name}"? This will remove all members and revoke all agent grants for this group.`,
        () => accessGroupsService.deleteGroup(numericGroupId),
        {
          successMessage: `Group "${group.name}" deleted successfully`,
          errorMessage: "Failed to delete group",
          onSuccess: () => router.push("/dashboard/groups"),
        },
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleAddMembers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numericGroupId) return;

    // Accept any reasonable separator: commas, semicolons, or new lines.
    const emails = Array.from(
      new Set(
        memberEmails
          .split(/[\s,;]+/)
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean),
      ),
    );
    if (emails.length === 0) return;

    setAddingMembers(true);
    setAddResults(null);
    const results = {
      added: [] as string[],
      already: [] as string[],
      notFound: [] as string[],
      failed: [] as string[],
    };
    const newMembers: AccessGroupMember[] = [];

    // Sequential loop over the existing single-add endpoint — small N (a few
    // dozen at most) and it keeps per-email error classification simple.
    for (const email of emails) {
      try {
        const member = await accessGroupsService.addMember(numericGroupId, {
          email,
        });
        results.added.push(email);
        newMembers.push(member);
      } catch (error: any) {
        const msg = (error?.message || "").toLowerCase();
        if (msg.includes("already a member")) results.already.push(email);
        else if (msg.includes("not found")) results.notFound.push(email);
        else results.failed.push(email);
      }
    }

    if (newMembers.length) {
      setMembers((prev) => [...prev, ...newMembers]);
    }
    setAddResults(results);
    setAddingMembers(false);

    const parts: string[] = [];
    if (results.added.length) parts.push(`${results.added.length} added`);
    if (results.already.length)
      parts.push(`${results.already.length} already members`);
    if (results.notFound.length)
      parts.push(`${results.notFound.length} no account`);
    if (results.failed.length) parts.push(`${results.failed.length} failed`);
    const summary = parts.join(", ");

    if (results.added.length) {
      successToast(`Members updated — ${summary}`);
    } else {
      errorToast(summary || "No members added");
    }

    // Clean run (everything added / already there) → close the form. If some
    // emails had no account or errored, keep it open so the admin sees which.
    if (results.notFound.length === 0 && results.failed.length === 0) {
      setMemberEmails("");
      setShowAddMember(false);
    }
  };

  const handleRemoveMember = async (member: AccessGroupMember) => {
    if (!numericGroupId) return;

    await confirmDelete(
      `Remove ${member.email || `account #${member.account_id}`} from this group?`,
      () => accessGroupsService.removeMember(numericGroupId, member.account_id),
      {
        successMessage: "Member removed",
        errorMessage: "Failed to remove member",
        onSuccess: () =>
          setMembers((prev) => prev.filter((m) => m.id !== member.id)),
      },
    );
  };

  if (loading) {
    return <PageLoading label="Loading group details..." />;
  }

  if (!group) {
    return <PageLoading label="Group not found" />;
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

      {/* Shared Agents Section (read-only) — what this group grants access to */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-2">
          Shared Agents ({agents.length})
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Members of this group can use these agents. Grant or revoke access
          from an agent&apos;s detail page.
        </p>
        {agents.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No agents are shared with this group yet.
          </p>
        ) : (
          <ul className="divide-y divide-gray-700/50 bg-gray-900/50 border border-gray-700/50 rounded-lg overflow-hidden">
            {agents.map((agent) => (
              <li
                key={agent.agent_id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <CpuChipIcon className="h-5 w-5 text-blue-400" />
                  <span className="text-sm text-white">{agent.agent_name}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {agent.granted_at
                    ? `Shared ${new Date(agent.granted_at).toLocaleDateString()}`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
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

        {/* Add Member(s) Form — paste one or many emails at once */}
        {showAddMember && (
          <form
            onSubmit={handleAddMembers}
            className="mb-6 bg-gray-900/50 border border-gray-700/50 rounded-lg p-4"
          >
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <EnvelopeIcon className="h-5 w-5 text-gray-500" />
              Add members by email
            </label>
            <textarea
              value={memberEmails}
              onChange={(e) => setMemberEmails(e.target.value)}
              placeholder={"alice@acme.com, bob@acme.com\ncarol@acme.com"}
              rows={4}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              autoFocus
            />
            <div className="flex gap-3 mt-3">
              <button
                type="submit"
                disabled={addingMembers}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                {addingMembers ? "Adding..." : "Add Members"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddMember(false);
                  setMemberEmails("");
                  setAddResults(null);
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-2">
              Separate emails with commas or new lines. Each account must
              already exist on Kalygo.
            </p>

            {/* Per-email results so the admin can see who needs follow-up */}
            {addResults && (
              <div className="mt-4 space-y-1.5 text-xs">
                {addResults.added.length > 0 && (
                  <p className="text-green-400">
                    ✓ Added: {addResults.added.join(", ")}
                  </p>
                )}
                {addResults.already.length > 0 && (
                  <p className="text-gray-400">
                    • Already members: {addResults.already.join(", ")}
                  </p>
                )}
                {addResults.notFound.length > 0 && (
                  <p className="text-amber-400">
                    ⚠ No Kalygo account (ask them to sign up first):{" "}
                    {addResults.notFound.join(", ")}
                  </p>
                )}
                {addResults.failed.length > 0 && (
                  <p className="text-red-400">
                    ✕ Failed: {addResults.failed.join(", ")}
                  </p>
                )}
              </div>
            )}
          </form>
        )}

        {/* Members List */}
        {members.length === 0 ? (
          <EmptyState
            size="sm"
            icon={UserGroupIcon}
            title="No members yet. Add members to share agents with them."
            action={
              !showAddMember && (
                <button
                  onClick={() => setShowAddMember(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Your First Member
                </button>
              )
            }
          />
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
