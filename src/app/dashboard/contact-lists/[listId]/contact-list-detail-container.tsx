"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";
import {
  contactListsService,
  ContactListDetail,
  ContactListMember,
  UpdateContactListRequest,
} from "@/services/contactListsService";
import { contactsService, Contact } from "@/services/contactsService";
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  QueueListIcon,
  UserPlusIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusBadgeClass(status?: string) {
  switch (status) {
    case "customer": return "bg-emerald-700/40 text-emerald-300 border-emerald-600/50";
    case "prospect": return "bg-blue-700/40 text-blue-300 border-blue-600/50";
    case "lead": return "bg-amber-700/40 text-amber-300 border-amber-600/50";
    case "churned": return "bg-red-700/40 text-red-300 border-red-600/50";
    default: return "bg-gray-700/40 text-gray-400 border-gray-600/50";
  }
}

// ── Main container ────────────────────────────────────────────────────────────

export function ContactListDetailContainer({ listId }: { listId: number }) {
  const router = useRouter();
  const [list, setList] = useState<ContactListDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");

  useEffect(() => {
    loadList();
  }, [listId]);

  const loadList = async () => {
    try {
      setLoading(true);
      const data = await contactListsService.getContactList(listId);
      setList(data);
    } catch (error: any) {
      errorToast(error.message || "Failed to load list");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (member: ContactListMember) => {
    const confirmed = window.confirm(
      `Remove "${member.contact.name}" from this list?`
    );
    if (!confirmed) return;
    try {
      await contactListsService.removeMember(listId, member.contact_id);
      setList((prev) =>
        prev
          ? { ...prev, members: prev.members.filter((m) => m.id !== member.id) }
          : prev
      );
      successToast(`"${member.contact.name}" removed from list`);
    } catch (error: any) {
      errorToast(error.message || "Failed to remove member");
    }
  };

  const filteredMembers = useMemo(() => {
    if (!list) return [];
    if (!memberSearch.trim()) return list.members;
    const term = memberSearch.toLowerCase();
    return list.members.filter(
      (m) =>
        m.contact.name.toLowerCase().includes(term) ||
        m.contact.email.toLowerCase().includes(term) ||
        (m.contact.company || "").toLowerCase().includes(term)
    );
  }, [list, memberSearch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Loading list...</div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-lg">List not found</p>
        <button
          onClick={() => router.push("/dashboard/contact-lists")}
          className="mt-4 text-blue-400 hover:text-blue-300 text-sm"
        >
          Back to Contact Lists
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button
        onClick={() => router.push("/dashboard/contact-lists")}
        className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Contact Lists
      </button>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
            <QueueListIcon className="h-7 w-7 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-white">{list.name}</h1>
            {list.description && (
              <p className="text-gray-400 mt-1 text-sm">{list.description}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              Created {new Date(list.created_at).toLocaleDateString()} &bull; Updated{" "}
              {new Date(list.updated_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <PencilIcon className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <UserPlusIcon className="h-4 w-4" />
            Add Contacts
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl px-6 py-4 flex items-center gap-2">
        <UsersIcon className="h-5 w-5 text-gray-400" />
        <span className="text-white font-medium">{list.members.length}</span>
        <span className="text-gray-400 text-sm">
          contact{list.members.length !== 1 ? "s" : ""} in this list
        </span>
      </div>

      {/* Members */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-medium text-white">Members</h2>
          {list.members.length > 0 && (
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search members…"
                className="pl-9 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 w-64"
              />
            </div>
          )}
        </div>

        {list.members.length === 0 ? (
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-10 text-center">
            <UsersIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-2">No contacts in this list yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <UserPlusIcon className="h-4 w-4" />
              Add Contacts
            </button>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-10 text-center">
            <p className="text-gray-400">No members match your search</p>
          </div>
        ) : (
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                    Company
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                    Added
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-gray-700/20 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/contacts/${member.contact_id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-blue-300">
                            {member.contact.first_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate">{member.contact.name}</p>
                          <p className="text-gray-400 text-sm truncate flex items-center gap-1">
                            <EnvelopeIcon className="h-3.5 w-3.5 flex-shrink-0" />
                            {member.contact.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      {member.contact.company ? (
                        <div className="flex items-center gap-1.5 text-gray-300 text-sm">
                          <BuildingOfficeIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <span className="truncate max-w-[160px]">{member.contact.company}</span>
                        </div>
                      ) : (
                        <span className="text-gray-600 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      {member.contact.status ? (
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadgeClass(member.contact.status)}`}
                        >
                          {member.contact.status.charAt(0).toUpperCase() +
                            member.contact.status.slice(1)}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-gray-400 text-sm">
                      {new Date(member.added_at).toLocaleDateString()}
                    </td>
                    <td
                      className="px-6 py-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleRemoveMember(member)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
                        title="Remove from list"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {showEditModal && (
        <EditListModal
          list={list}
          onClose={() => setShowEditModal(false)}
          onSave={async (data) => {
            const updated = await contactListsService.updateContactList(listId, data);
            setList((prev) => (prev ? { ...prev, ...updated } : prev));
            setShowEditModal(false);
            successToast("List updated");
          }}
        />
      )}

      {/* Add contacts modal */}
      {showAddModal && (
        <AddContactsModal
          listId={listId}
          existingContactIds={new Set(list.members.map((m) => m.contact_id))}
          onClose={() => setShowAddModal(false)}
          onAdded={(newMembers) => {
            setList((prev) =>
              prev ? { ...prev, members: [...prev.members, ...newMembers] } : prev
            );
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

// ── Edit list modal ───────────────────────────────────────────────────────────

function EditListModal({
  list,
  onClose,
  onSave,
}: {
  list: ContactListDetail;
  onClose: () => void;
  onSave: (data: UpdateContactListRequest) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: list.name,
    description: list.description ?? "",
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
      await onSave({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      });
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
              <h2 className="text-xl font-semibold text-white">Edit List</h2>
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
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={set("description")}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
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
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Add contacts modal ────────────────────────────────────────────────────────

function AddContactsModal({
  listId,
  existingContactIds,
  onClose,
  onAdded,
}: {
  listId: number;
  existingContactIds: Set<number>;
  onClose: () => void;
  onAdded: (members: ContactListMember[]) => void;
}) {
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    contactsService
      .listContacts()
      .then(setAllContacts)
      .catch((e) => errorToast(e.message || "Failed to load contacts"))
      .finally(() => setLoadingContacts(false));
  }, []);

  const available = useMemo(
    () => allContacts.filter((c) => !existingContactIds.has(c.id)),
    [allContacts, existingContactIds]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return available;
    const term = search.toLowerCase();
    return available.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        (c.company || "").toLowerCase().includes(term)
    );
  }, [available, search]);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((c) => c.id)));
    }
  };

  const handleAdd = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    try {
      const result = await contactListsService.bulkAddMembers(listId, {
        contact_ids: Array.from(selected),
      });
      const updatedList = await contactListsService.getContactList(listId);
      const newMembers = updatedList.members.filter((m) => selected.has(m.contact_id));
      onAdded(newMembers);
      successToast(
        `${result.added} contact${result.added !== 1 ? "s" : ""} added${result.skipped > 0 ? `, ${result.skipped} skipped` : ""}`
      );
    } catch (error: any) {
      errorToast(error.message || "Failed to add contacts");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-gray-800 border border-gray-700 rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
          <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-3">
              <UserPlusIcon className="h-6 w-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Add Contacts</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 border-b border-gray-700 flex-shrink-0">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contacts…"
                className="w-full pl-9 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1 min-h-0">
            {loadingContacts ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                Loading contacts…
              </div>
            ) : available.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
                All contacts are already in this list
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
                No contacts match your search
              </div>
            ) : (
              <div>
                <div
                  className="flex items-center gap-3 px-4 py-3 border-b border-gray-700/50 cursor-pointer hover:bg-gray-700/30"
                  onClick={toggleAll}
                >
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500/50 cursor-pointer"
                  />
                  <span className="text-gray-300 text-sm font-medium">
                    Select all ({filtered.length})
                  </span>
                </div>
                {filtered.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center gap-3 px-4 py-3 border-b border-gray-700/30 cursor-pointer hover:bg-gray-700/20"
                    onClick={() => toggle(contact.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(contact.id)}
                      onChange={() => toggle(contact.id)}
                      className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500/50 cursor-pointer"
                    />
                    <div className="h-8 w-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-blue-300">
                        {contact.first_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-medium truncate">{contact.name}</p>
                      <p className="text-gray-400 text-xs truncate">{contact.email}</p>
                    </div>
                    {contact.company && (
                      <span className="text-gray-500 text-xs truncate max-w-[100px] hidden sm:block">
                        {contact.company}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-700 flex-shrink-0 flex items-center justify-between gap-3">
            <span className="text-gray-400 text-sm">
              {selected.size > 0
                ? `${selected.size} contact${selected.size !== 1 ? "s" : ""} selected`
                : "Select contacts to add"}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={selected.size === 0 || saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
              >
                {saving ? "Adding…" : `Add ${selected.size > 0 ? selected.size : ""}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
