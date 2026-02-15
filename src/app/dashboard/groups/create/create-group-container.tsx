"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { accessGroupsService } from "@/services/accessGroupsService";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export function CreateGroupContainer() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      errorToast("Group name is required");
      return;
    }

    try {
      setSubmitting(true);
      const group = await accessGroupsService.createGroup({
        name: name.trim(),
      });
      successToast("Access group created successfully");
      router.push(`/dashboard/group?group_id=${group.id}`);
    } catch (error: any) {
      errorToast(error.message || "Failed to create access group");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard/groups");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleCancel}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-4xl font-semibold text-white">
            Create Access Group
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Groups let you share agents with other accounts
          </p>
        </div>
      </div>

      {/* Create Form */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Group Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Engineering Team, Sales Team"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-gray-400 text-xs mt-2">
              Choose a descriptive name for your access group.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {submitting ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
