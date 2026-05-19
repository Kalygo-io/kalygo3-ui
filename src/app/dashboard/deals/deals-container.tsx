"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";
import {
  dealsService,
  Deal,
  DEAL_STAGES,
} from "@/services/dealsService";
import {
  DealFormModal,
  STAGE_META,
  formatMoney,
} from "@/components/deals/deal-form-modal";
import {
  PlusIcon,
  CurrencyDollarIcon,
  UserIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

const PAGE_SIZE_OPTIONS = [25, 50, 100];

// ── Main container ────────────────────────────────────────────────────────────

export function DealsContainer() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editDeal, setEditDeal] = useState<Deal | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Debounce the search box so each keystroke does not hit the server.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Any new filter / page-size resets to the first page.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, stageFilter, pageSize]);

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dealsService.listDealsPage({
        search: debouncedSearch || undefined,
        stage: stageFilter || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });
      setDeals(res.deals);
      setTotal(res.total);

      // If the current page fell past the end (e.g. after deletes), step back.
      const lastPage = Math.max(1, Math.ceil(res.total / pageSize));
      if (page > lastPage) setPage(lastPage);
    } catch (error: any) {
      errorToast(error.message || "Failed to load deals");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, stageFilter, page, pageSize]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const handleDeleteDeal = async (deal: Deal) => {
    const confirmed = window.confirm(
      `Delete deal "${deal.title}"? This cannot be undone.`
    );
    if (!confirmed) return;
    try {
      await dealsService.deleteDeal(deal.id);
      successToast(`"${deal.title}" deleted`);
      await loadPage();
    } catch (error: any) {
      errorToast(error.message || "Failed to delete deal");
    }
  };

  // ── Server-side pagination math ──────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startRow = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRow = Math.min(currentPage * pageSize, total);

  if (loading && deals.length === 0 && total === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Loading deals...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-semibold text-white">Deals</h1>
          <p className="text-gray-400 mt-1">
            {total} deal{total !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Deal
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
            placeholder="Search title, description…"
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
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="">All stages</option>
          {DEAL_STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_META[s].label}
            </option>
          ))}
        </select>
      </div>

      {/* Table / Empty state */}
      {total === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-12 text-center">
          <CurrencyDollarIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">
            {debouncedSearch || stageFilter
              ? "No deals match your filters"
              : "No deals yet"}
          </p>
          {!debouncedSearch && !stageFilter && (
            <>
              <p className="text-gray-500 text-sm mb-6">
                Track sales opportunities across your account.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Add Your First Deal
              </button>
            </>
          )}
        </div>
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
                    Deal
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                    Amount
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                    Expected Close
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {deals.map((deal) => {
                  const stageMeta = STAGE_META[deal.stage] ?? STAGE_META.lead;
                  const money = formatMoney(deal.amount, deal.currency);
                  const closeLabel = deal.expected_close_date
                    ? new Date(
                        deal.expected_close_date + "T00:00:00"
                      ).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : null;
                  return (
                    <tr
                      key={deal.id}
                      className="hover:bg-gray-700/20 transition-colors cursor-pointer"
                      onClick={() => setEditDeal(deal)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                            <CurrencyDollarIcon className="h-4 w-4 text-emerald-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-medium truncate">
                              {deal.title}
                            </p>
                            {deal.contact_name ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (deal.contact_id)
                                    router.push(
                                      `/dashboard/contacts/${deal.contact_id}`
                                    );
                                }}
                                className="text-gray-400 text-sm truncate flex items-center gap-1 hover:text-blue-400 transition-colors"
                                title="View contact"
                              >
                                <UserIcon className="h-3.5 w-3.5 flex-shrink-0" />
                                {deal.contact_name}
                              </button>
                            ) : (
                              <p className="text-gray-600 text-sm truncate">
                                No contact
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${stageMeta.badge}`}
                        >
                          {stageMeta.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell text-gray-300 text-sm">
                        {money ?? <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell text-gray-400 text-sm">
                        {closeLabel ? (
                          <span className="flex items-center gap-1.5">
                            <CalendarDaysIcon className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                            {closeLabel}
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td
                        className="px-6 py-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditDeal(deal)}
                            className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-600/10 rounded-lg transition-colors"
                            title="Edit deal"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDeal(deal)}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
                            title="Delete deal"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div className="px-6 py-3 border-t border-gray-700/50 flex items-center justify-between gap-4 flex-wrap">
            <span className="text-xs text-gray-500">
              {startRow}–{endRow} of {total.toLocaleString()}
              {loading && " · loading…"}
            </span>
            <div className="flex items-center gap-4">
              {/* Rows per page */}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>Rows</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {PAGE_SIZE_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Page navigation */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 rounded text-xs text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="First page"
                >
                  «
                </button>
                <button
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Previous page"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - currentPage) <= 1
                  )
                  .reduce<(number | "…")[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "…" ? (
                      <span
                        key={`ellipsis-${i}`}
                        className="px-2 py-1 text-xs text-gray-600"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                          currentPage === p
                            ? "bg-blue-600 text-white"
                            : "text-gray-400 hover:text-white hover:bg-gray-700"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}

                <button
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Next page"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 rounded text-xs text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Last page"
                >
                  »
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreateModal && (
        <DealFormModal
          onClose={() => setShowCreateModal(false)}
          onSave={async (data) => {
            const created = await dealsService.createDeal(data);
            setShowCreateModal(false);
            successToast(`Deal "${created.title}" created`);
            if (page === 1) {
              await loadPage();
            } else {
              setPage(1);
            }
          }}
        />
      )}

      {/* Edit modal */}
      {editDeal && (
        <DealFormModal
          initial={editDeal}
          onClose={() => setEditDeal(null)}
          onSave={async (data) => {
            const updated = await dealsService.updateDeal(editDeal.id, data);
            setDeals((prev) =>
              prev.map((d) => (d.id === updated.id ? updated : d))
            );
            setEditDeal(null);
            successToast("Deal updated");
          }}
        />
      )}
    </div>
  );
}
