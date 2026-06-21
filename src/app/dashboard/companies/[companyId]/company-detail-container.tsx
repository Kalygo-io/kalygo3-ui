"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";
import {
  companiesService,
  Company,
  CompanyDetail,
  CompanyContact,
} from "@/services/companiesService";
import { contactsService, Contact } from "@/services/contactsService";
import { CompanyFormModal } from "../companies-container";
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  BuildingOffice2Icon,
  UserPlusIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";

// ── Main container ────────────────────────────────────────────────────────────

export function CompanyDetailContainer({ companyId }: { companyId: number }) {
  const router = useRouter();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [contactSearch, setContactSearch] = useState("");

  useEffect(() => {
    loadCompany();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const loadCompany = async () => {
    try {
      setLoading(true);
      const data = await companiesService.getCompany(companyId);
      setCompany(data);
    } catch (error: any) {
      errorToast(error.message || "Failed to load company");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveContact = async (membership: CompanyContact) => {
    const confirmed = window.confirm(
      `Remove "${membership.contact.name}" from ${company?.name}?`
    );
    if (!confirmed) return;
    try {
      await companiesService.removeContact(companyId, membership.contact_id);
      setCompany((prev) =>
        prev
          ? { ...prev, contacts: prev.contacts.filter((m) => m.id !== membership.id) }
          : prev
      );
      successToast(`"${membership.contact.name}" removed from company`);
    } catch (error: any) {
      errorToast(error.message || "Failed to remove contact");
    }
  };

  const filteredContacts = useMemo(() => {
    if (!company) return [];
    if (!contactSearch.trim()) return company.contacts;
    const term = contactSearch.toLowerCase();
    return company.contacts.filter(
      (m) =>
        m.contact.name.toLowerCase().includes(term) ||
        m.contact.email.toLowerCase().includes(term) ||
        (m.title || "").toLowerCase().includes(term)
    );
  }, [company, contactSearch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Loading company...</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-lg">Company not found</p>
        <button
          onClick={() => router.push("/dashboard/companies")}
          className="mt-4 text-blue-400 hover:text-blue-300 text-sm"
        >
          Back to Companies
        </button>
      </div>
    );
  }

  // CompanyFormModal expects a Company (with contact_count); derive it here.
  const editInitial: Company = {
    id: company.id,
    account_id: company.account_id,
    name: company.name,
    domain: company.domain,
    website: company.website,
    industry: company.industry,
    description: company.description,
    linkedin_url: company.linkedin_url,
    contact_count: company.contacts.length,
    created_at: company.created_at,
    updated_at: company.updated_at,
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button
        onClick={() => router.push("/dashboard/companies")}
        className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Companies
      </button>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
            <BuildingOffice2Icon className="h-7 w-7 text-blue-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold text-white">{company.name}</h1>
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1">
              {company.industry && (
                <span className="text-gray-400 text-sm">{company.industry}</span>
              )}
              {company.domain && (
                <span className="flex items-center gap-1 text-gray-400 text-sm">
                  <GlobeAltIcon className="h-4 w-4 text-gray-500" />
                  {company.website ? (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {company.domain}
                    </a>
                  ) : (
                    company.domain
                  )}
                </span>
              )}
            </div>
            {company.description && (
              <p className="text-gray-400 mt-2 text-sm max-w-2xl">{company.description}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              Created {new Date(company.created_at).toLocaleDateString()} &bull; Updated{" "}
              {new Date(company.updated_at).toLocaleDateString()}
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
        <span className="text-white font-medium">{company.contacts.length}</span>
        <span className="text-gray-400 text-sm">
          contact{company.contacts.length !== 1 ? "s" : ""} at this company
        </span>
      </div>

      {/* Contacts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-medium text-white">Contacts</h2>
          {company.contacts.length > 0 && (
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder="Search contacts…"
                className="pl-9 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 w-64"
              />
            </div>
          )}
        </div>

        {company.contacts.length === 0 ? (
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-10 text-center">
            <UsersIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-2">No contacts at this company yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <UserPlusIcon className="h-4 w-4" />
              Add Contacts
            </button>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-10 text-center">
            <p className="text-gray-400">No contacts match your search</p>
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
                    Title
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
                {filteredContacts.map((membership) => (
                  <tr
                    key={membership.id}
                    className="hover:bg-gray-700/20 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/contacts/${membership.contact_id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-blue-300">
                            {membership.contact.first_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate">
                            {membership.contact.name}
                          </p>
                          <p className="text-gray-400 text-sm truncate flex items-center gap-1">
                            <EnvelopeIcon className="h-3.5 w-3.5 flex-shrink-0" />
                            {membership.contact.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      {membership.title ? (
                        <span className="text-gray-300 text-sm">{membership.title}</span>
                      ) : (
                        <span className="text-gray-600 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-gray-400 text-sm">
                      {new Date(membership.added_at).toLocaleDateString()}
                    </td>
                    <td
                      className="px-6 py-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleRemoveContact(membership)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
                        title="Remove from company"
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

      {/* Edit modal (reuses the create/edit form from the list page) */}
      {showEditModal && (
        <CompanyFormModal
          initial={editInitial}
          onClose={() => setShowEditModal(false)}
          onSave={async (data) => {
            const updated = await companiesService.updateCompany(companyId, data);
            setCompany((prev) => (prev ? { ...prev, ...updated } : prev));
            setShowEditModal(false);
            successToast("Company updated");
          }}
        />
      )}

      {/* Add contacts modal */}
      {showAddModal && (
        <AddContactsModal
          companyId={companyId}
          existingContactIds={new Set(company.contacts.map((m) => m.contact_id))}
          onClose={() => setShowAddModal(false)}
          onAdded={async () => {
            setShowAddModal(false);
            await loadCompany();
          }}
        />
      )}
    </div>
  );
}

// ── Add contacts modal ────────────────────────────────────────────────────────

function AddContactsModal({
  companyId,
  existingContactIds,
  onClose,
  onAdded,
}: {
  companyId: number;
  existingContactIds: Set<number>;
  onClose: () => void;
  onAdded: () => void | Promise<void>;
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
      (c) => c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term)
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
      const result = await companiesService.bulkAddContacts(companyId, {
        contact_ids: Array.from(selected),
      });
      successToast(
        `${result.added} contact${result.added !== 1 ? "s" : ""} added${result.skipped > 0 ? `, ${result.skipped} skipped` : ""}`
      );
      await onAdded();
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
                All contacts are already associated with this company
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
