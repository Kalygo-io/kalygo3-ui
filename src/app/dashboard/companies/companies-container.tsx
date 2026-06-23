"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";
import {
  companiesService,
  Company,
  CreateCompanyRequest,
  UpdateCompanyRequest,
} from "@/services/companiesService";
import { PageLoading } from "@/components/shared/common/page-loading";
import { EmptyState } from "@/components/shared/common/empty-state";
import { useConfirmDelete } from "@/shared/hooks/use-confirm-delete";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { PaginationFooter } from "@/components/shared/common/pagination-footer";
import {
  PlusIcon,
  BuildingOffice2Icon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";

const PAGE_SIZE = 50;

// ── Main container ────────────────────────────────────────────────────────────

export function CompaniesContainer() {
  const router = useRouter();
  const confirmDelete = useConfirmDelete();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const debouncedSearch = useDebouncedValue(search, 300);

  const loadCompanies = useCallback(
    async (opts: { search: string; offset: number }) => {
      try {
        setLoading(true);
        const data = await companiesService.listCompaniesPage({
          search: opts.search || undefined,
          limit: PAGE_SIZE,
          offset: opts.offset,
        });
        setCompanies(data.companies);
        setTotal(data.total);
      } catch (error: any) {
        errorToast(error.message || "Failed to load companies");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Debounced search; reset to the first page whenever the term changes.
  useEffect(() => {
    setOffset(0);
    loadCompanies({ search: debouncedSearch, offset: 0 });
  }, [debouncedSearch, loadCompanies]);

  const goToPage = (newOffset: number) => {
    setOffset(newOffset);
    loadCompanies({ search, offset: newOffset });
  };

  const handleDelete = async (company: Company) => {
    await confirmDelete(
      `Delete "${company.name}"? This removes the company but will not delete the contacts associated with it.`,
      () => companiesService.deleteCompany(company.id),
      {
        successMessage: `"${company.name}" deleted`,
        errorMessage: "Failed to delete company",
        onSuccess: () => {
          setCompanies((prev) => prev.filter((c) => c.id !== company.id));
          setTotal((t) => Math.max(0, t - 1));
        },
      }
    );
  };

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-semibold text-white">Companies</h1>
          <p className="text-gray-400 mt-1">
            {total} compan{total !== 1 ? "ies" : "y"}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          New Company
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, domain, or industry…"
          className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
        />
      </div>

      {/* Grid / Empty / Loading */}
      {loading ? (
        <PageLoading label="Loading companies..." className="min-h-[300px]" />
      ) : companies.length === 0 ? (
        <EmptyState
          icon={BuildingOffice2Icon}
          title={search ? "No companies match your search" : "No companies yet"}
          description={
            search
              ? undefined
              : "Create a company to group the contacts who work there."
          }
          action={
            search ? undefined : (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Create Your First Company
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <div
              key={company.id}
              className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5 cursor-pointer hover:border-blue-500/40 hover:bg-gray-800/80 transition-all group"
              onClick={() => router.push(`/dashboard/companies/${company.id}`)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                    <BuildingOffice2Icon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-medium truncate group-hover:text-blue-300 transition-colors">
                      {company.name}
                    </p>
                    {company.industry ? (
                      <p className="text-gray-500 text-xs mt-0.5 truncate">{company.industry}</p>
                    ) : (
                      <p className="text-gray-500 text-xs mt-0.5">
                        Created {new Date(company.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div
                  className="flex items-center gap-1 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setEditCompany(company)}
                    className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-600/10 rounded-lg transition-colors"
                    title="Edit company"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(company)}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
                    title="Delete company"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {company.domain && (
                <div className="flex items-center gap-1.5 mt-3 text-gray-400 text-sm min-w-0">
                  <GlobeAltIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="truncate">{company.domain}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 mt-4 text-gray-400 text-sm">
                <UsersIcon className="h-4 w-4 text-gray-500" />
                <span>
                  {company.contact_count} contact{company.contact_count !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && total > PAGE_SIZE && (
        <PaginationFooter
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={PAGE_SIZE}
          onPageChange={(p) => goToPage((p - 1) * PAGE_SIZE)}
          loading={loading}
        />
      )}

      {/* Create modal */}
      {showCreateModal && (
        <CompanyFormModal
          onClose={() => setShowCreateModal(false)}
          onSave={async (data) => {
            const created = await companiesService.createCompany(data as CreateCompanyRequest);
            setShowCreateModal(false);
            successToast(`"${created.name}" created`);
            // Reload to keep ordering / pagination consistent.
            setOffset(0);
            loadCompanies({ search, offset: 0 });
          }}
        />
      )}

      {/* Edit modal */}
      {editCompany && (
        <CompanyFormModal
          initial={editCompany}
          onClose={() => setEditCompany(null)}
          onSave={async (data) => {
            const updated = await companiesService.updateCompany(
              editCompany.id,
              data as UpdateCompanyRequest
            );
            setCompanies((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
            setEditCompany(null);
            successToast(`"${updated.name}" updated`);
          }}
        />
      )}
    </div>
  );
}

// ── Company form modal ──────────────────────────────────────────────────────

export function CompanyFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: Company;
  onClose: () => void;
  onSave: (data: CreateCompanyRequest | UpdateCompanyRequest) => Promise<void>;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    domain: initial?.domain ?? "",
    website: initial?.website ?? "",
    industry: initial?.industry ?? "",
    linkedin_url: initial?.linkedin_url ?? "",
    description: initial?.description ?? "",
  });
  const [saving, setSaving] = useState(false);

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return errorToast("Company name is required");
    setSaving(true);
    try {
      await onSave({
        name: form.name.trim(),
        domain: form.domain.trim() || undefined,
        website: form.website.trim() || undefined,
        industry: form.industry.trim() || undefined,
        linkedin_url: form.linkedin_url.trim() || undefined,
        description: form.description.trim() || undefined,
      });
    } catch (error: any) {
      errorToast(error.message || "Failed to save company");
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
              <BuildingOffice2Icon className="h-6 w-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">
                {isEdit ? "Edit Company" : "New Company"}
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
                placeholder="Acme Inc."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Domain</label>
                <input
                  type="text"
                  value={form.domain}
                  onChange={set("domain")}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  placeholder="acme.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Industry</label>
                <input
                  type="text"
                  value={form.industry}
                  onChange={set("industry")}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  placeholder="SaaS, Manufacturing…"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Website</label>
              <input
                type="text"
                value={form.website}
                onChange={set("website")}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                placeholder="https://acme.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">LinkedIn URL</label>
              <input
                type="text"
                value={form.linkedin_url}
                onChange={set("linkedin_url")}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                placeholder="https://linkedin.com/company/acme"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={set("description")}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                placeholder="What does this company do?"
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
                {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Company"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
