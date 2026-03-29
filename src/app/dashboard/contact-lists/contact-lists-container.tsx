"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";
import {
  contactListsService,
  ContactList,
  CreateContactListRequest,
  UpdateContactListRequest,
} from "@/services/contactListsService";
import {
  PlusIcon,
  QueueListIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

// ── Main container ────────────────────────────────────────────────────────────

export function ContactListsContainer() {
  const router = useRouter();
  const [lists, setLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editList, setEditList] = useState<ContactList | null>(null);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    try {
      setLoading(true);
      const data = await contactListsService.listContactLists();
      setLists(data);
    } catch (error: any) {
      errorToast(error.message || "Failed to load contact lists");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (list: ContactList) => {
    const confirmed = window.confirm(
      `Delete "${list.name}"? This will remove the list but will not delete the contacts themselves.`
    );
    if (!confirmed) return;
    try {
      await contactListsService.deleteContactList(list.id);
      setLists((prev) => prev.filter((l) => l.id !== list.id));
      successToast(`"${list.name}" deleted`);
    } catch (error: any) {
      errorToast(error.message || "Failed to delete contact list");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Loading contact lists...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-semibold text-white">Contact Lists</h1>
          <p className="text-gray-400 mt-1">
            {lists.length} list{lists.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          New List
        </button>
      </div>

      {/* Grid / Empty state */}
      {lists.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-12 text-center">
          <QueueListIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">No contact lists yet</p>
          <p className="text-gray-500 text-sm mb-6">
            Create a list to segment your contacts for targeted outreach.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Create Your First List
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map((list) => (
            <div
              key={list.id}
              className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5 cursor-pointer hover:border-blue-500/40 hover:bg-gray-800/80 transition-all group"
              onClick={() => router.push(`/dashboard/contact-lists/${list.id}`)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                    <QueueListIcon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-medium truncate group-hover:text-blue-300 transition-colors">
                      {list.name}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      Created {new Date(list.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div
                  className="flex items-center gap-1 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setEditList(list)}
                    className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-600/10 rounded-lg transition-colors"
                    title="Edit list"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(list)}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
                    title="Delete list"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {list.description && (
                <p className="text-gray-400 text-sm mt-3 line-clamp-2">{list.description}</p>
              )}

              <div className="flex items-center gap-1.5 mt-4 text-gray-400 text-sm">
                <UsersIcon className="h-4 w-4 text-gray-500" />
                <span>
                  {list.member_count} contact{list.member_count !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreateModal && (
        <ContactListFormModal
          onClose={() => setShowCreateModal(false)}
          onSave={async (data) => {
            const created = await contactListsService.createContactList(data as CreateContactListRequest);
            setLists((prev) => [created, ...prev]);
            setShowCreateModal(false);
            successToast(`"${created.name}" created`);
          }}
        />
      )}

      {/* Edit modal */}
      {editList && (
        <ContactListFormModal
          initial={editList}
          onClose={() => setEditList(null)}
          onSave={async (data) => {
            const updated = await contactListsService.updateContactList(editList.id, data as UpdateContactListRequest);
            setLists((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
            setEditList(null);
            successToast(`"${updated.name}" updated`);
          }}
        />
      )}
    </div>
  );
}

// ── Contact list form modal ───────────────────────────────────────────────────

function ContactListFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: ContactList;
  onClose: () => void;
  onSave: (data: CreateContactListRequest | UpdateContactListRequest) => Promise<void>;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
  });
  const [saving, setSaving] = useState(false);

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return errorToast("List name is required");
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      };
      await onSave(payload);
    } catch (error: any) {
      errorToast(error.message || "Failed to save list");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-gray-800 border border-gray-700 rounded-xl shadow-2xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <QueueListIcon className="h-6 w-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">
                {isEdit ? "Edit List" : "New Contact List"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={set("name")}
                required
                autoFocus
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                placeholder="Q2 Outreach, Newsletter subscribers…"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={set("description")}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                placeholder="What is this list for?"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {saving ? "Saving…" : isEdit ? "Save Changes" : "Create List"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
