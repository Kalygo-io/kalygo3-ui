"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";
import {
  contactsService,
  Contact,
  CreateContactRequest,
  UpdateContactRequest,
} from "@/services/contactsService";
import {
  PlusIcon,
  UserIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";

const STATUS_OPTIONS = ["lead", "prospect", "customer", "churned"];
const SOURCE_OPTIONS = ["website", "referral", "chat_bot", "import", "cold_outreach", "event", "other"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusBadgeClass(status?: string) {
  switch (status) {
    case "customer":
      return "bg-emerald-700/40 text-emerald-300 border-emerald-600/50";
    case "prospect":
      return "bg-blue-700/40 text-blue-300 border-blue-600/50";
    case "lead":
      return "bg-amber-700/40 text-amber-300 border-amber-600/50";
    case "churned":
      return "bg-red-700/40 text-red-300 border-red-600/50";
    default:
      return "bg-gray-700/40 text-gray-400 border-gray-600/50";
  }
}

// ── Main container ────────────────────────────────────────────────────────────

export function ContactsContainer() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const data = await contactsService.listContacts();
      setContacts(data);
    } catch (error: any) {
      errorToast(error.message || "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async (contact: Contact) => {
    const confirmed = window.confirm(
      `Delete "${contact.name}"? This will also delete all associated events and cannot be undone.`
    );
    if (!confirmed) return;
    try {
      await contactsService.deleteContact(contact.id);
      setContacts((prev) => prev.filter((c) => c.id !== contact.id));
      successToast(`"${contact.name}" deleted`);
    } catch (error: any) {
      errorToast(error.message || "Failed to delete contact");
    }
  };

  const filtered = contacts.filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.first_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.last_name || "").toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.company || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Loading contacts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-semibold text-white">Contacts</h1>
          <p className="text-gray-400 mt-1">
            {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Contact
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, company…"
            className="w-full pl-9 pr-9 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Table / Empty state */}
      {filtered.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-12 text-center">
          <UserIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">
            {contacts.length === 0 ? "No contacts yet" : "No contacts match your filters"}
          </p>
          {contacts.length === 0 && (
            <>
              <p className="text-gray-500 text-sm mb-6">
                Add your first contact to start building your CRM.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Add Your First Contact
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Name
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
              {filtered.map((contact) => (
                <tr
                  key={contact.id}
                  className="hover:bg-gray-700/20 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/contacts/${contact.id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-blue-300">
                          {contact.first_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">
                          {contact.first_name}{contact.last_name ? ` ${contact.last_name}` : ""}
                        </p>
                        <p className="text-gray-400 text-sm truncate flex items-center gap-1">
                          <EnvelopeIcon className="h-3.5 w-3.5 flex-shrink-0" />
                          {contact.email}
                        </p>
                        {contact.phone && (
                          <p className="text-gray-500 text-xs truncate flex items-center gap-1 sm:hidden">
                            <PhoneIcon className="h-3 w-3 flex-shrink-0" />
                            {contact.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    {contact.company ? (
                      <div className="flex items-center gap-1.5 text-gray-300 text-sm">
                        <BuildingOfficeIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="truncate max-w-[160px]">{contact.company}</span>
                      </div>
                    ) : (
                      <span className="text-gray-600 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    {contact.status ? (
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadgeClass(contact.status)}`}
                      >
                        {contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
                      </span>
                    ) : (
                      <span className="text-gray-600 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell text-gray-400 text-sm">
                    {new Date(contact.created_at).toLocaleDateString()}
                  </td>
                  <td
                    className="px-6 py-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditContact(contact)}
                        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-600/10 rounded-lg transition-colors"
                        title="Edit contact"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
                        title="Delete contact"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      {showCreateModal && (
        <ContactFormModal
          onClose={() => setShowCreateModal(false)}
          onSave={async (data) => {
            const created = await contactsService.createContact(data as CreateContactRequest);
            setContacts((prev) => [created, ...prev]);
            setShowCreateModal(false);
            successToast(`Contact "${created.name}" created`);
          }}
        />
      )}

      {/* Edit modal */}
      {editContact && (
        <ContactFormModal
          initial={editContact}
          onClose={() => setEditContact(null)}
          onSave={async (data) => {
            const updated = await contactsService.updateContact(editContact.id, data as UpdateContactRequest);
            setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
            setEditContact(null);
            successToast(`Contact "${updated.name}" updated`);
          }}
        />
      )}
    </div>
  );
}

// ── Contact form modal ────────────────────────────────────────────────────────

function ContactFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: Contact;
  onClose: () => void;
  onSave: (data: CreateContactRequest | UpdateContactRequest) => Promise<void>;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    first_name: initial?.first_name ?? "",
    last_name: initial?.last_name ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    company: initial?.company ?? "",
    title: initial?.title ?? "",
    source: initial?.source ?? "",
    status: initial?.status ?? "",
    notes: initial?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim()) return errorToast("First name is required");
    if (!form.email.trim()) return errorToast("Email is required");
    setSaving(true);
    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim() || undefined,
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        company: form.company.trim() || undefined,
        title: form.title.trim() || undefined,
        source: form.source || undefined,
        status: form.status || undefined,
        notes: form.notes.trim() || undefined,
      };
      await onSave(payload);
    } catch (error: any) {
      errorToast(error.message || "Failed to save contact");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-gray-800 border border-gray-700 rounded-xl shadow-2xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <UserIcon className="h-6 w-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">
                {isEdit ? "Edit Contact" : "New Contact"}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  First Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={set("first_name")}
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  placeholder="Jane"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Last Name</label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={set("last_name")}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  placeholder="jane@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={set("phone")}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="+1 555 000 0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Company</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={set("company")}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Acme Inc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Job Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={set("title")}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="VP of Engineering"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={set("status")}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="">— Select —</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Source</label>
                <select
                  value={form.source}
                  onChange={set("source")}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="">— Select —</option>
                  {SOURCE_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={set("notes")}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                placeholder="Any additional notes…"
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
                {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Contact"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
