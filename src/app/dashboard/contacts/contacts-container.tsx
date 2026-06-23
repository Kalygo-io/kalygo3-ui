"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";
import {
  contactsService,
  Contact,
  CreateContactRequest,
} from "@/services/contactsService";
import { ContactFormModal } from "@/components/contacts/contact-form-modal";
import { PageLoading } from "@/components/shared/common/page-loading";
import { EmptyState } from "@/components/shared/common/empty-state";
import { PaginationFooter } from "@/components/shared/common/pagination-footer";
import { useConfirmDelete } from "@/shared/hooks/use-confirm-delete";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import {
  PlusIcon,
  UserIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  EnvelopeIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";

const PAGE_SIZE_OPTIONS = [25, 50, 100];

// ── Main container ────────────────────────────────────────────────────────────

export function ContactsContainer() {
  const router = useRouter();
  const confirmDelete = useConfirmDelete();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Debounce the search box so each keystroke does not hit the server.
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  // Any new filter / page-size resets to the first page.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      const res = await contactsService.listContactsPage({
        search: debouncedSearch || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });
      setContacts(res.contacts);
      setTotal(res.total);

      // If the current page fell past the end (e.g. after deletes), step back.
      const lastPage = Math.max(1, Math.ceil(res.total / pageSize));
      if (page > lastPage) setPage(lastPage);
    } catch (error: any) {
      errorToast(error.message || "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, pageSize]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const handleDeleteContact = async (contact: Contact) => {
    await confirmDelete(
      `Delete "${contact.name}"? This will also delete all associated events and cannot be undone.`,
      () => contactsService.deleteContact(contact.id),
      {
        successMessage: `"${contact.name}" deleted`,
        errorMessage: "Failed to delete contact",
        // Counts/offsets shifted server-side — refetch the current page.
        onSuccess: () => loadPage(),
      },
    );
  };

  // ── Server-side pagination math ──────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);

  if (loading && contacts.length === 0 && total === 0) {
    return <PageLoading label="Loading contacts..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-semibold text-white">Contacts</h1>
          <p className="text-gray-400 mt-1">
            {total} contact{total !== 1 ? "s" : ""}
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
            placeholder="Search name, email…"
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
      </div>

      {/* Table / Empty state */}
      {total === 0 ? (
        <EmptyState
          icon={UserIcon}
          title={
            debouncedSearch ? "No contacts match your search" : "No contacts yet"
          }
          description={
            !debouncedSearch
              ? "Add your first contact to start building your CRM."
              : undefined
          }
          action={
            !debouncedSearch ? (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Add Your First Contact
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
          <div
            aria-busy={loading}
            className={`transition-opacity duration-200 ${
              loading ? "opacity-50 pointer-events-none" : "opacity-100"
            }`}
          >
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Name
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
              {contacts.map((contact) => (
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
                  <td className="px-6 py-4 hidden lg:table-cell text-gray-400 text-sm">
                    {new Date(contact.created_at).toLocaleDateString()}
                  </td>
                  <td
                    className="px-6 py-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => router.push(`/dashboard/contacts/${contact.id}`)}
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

          {/* Pagination footer */}
          <PaginationFooter
            page={currentPage}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            loading={loading}
          />
        </div>
      )}

      {/* Create modal */}
      {showCreateModal && (
        <ContactFormModal
          onClose={() => setShowCreateModal(false)}
          onSave={async (data) => {
            const created = await contactsService.createContact(data as CreateContactRequest);
            setShowCreateModal(false);
            successToast(`Contact "${created.name}" created`);
            // Show the newest contact (ordered by updated_at desc -> page 1).
            if (page === 1) {
              await loadPage();
            } else {
              setPage(1);
            }
          }}
        />
      )}
    </div>
  );
}
