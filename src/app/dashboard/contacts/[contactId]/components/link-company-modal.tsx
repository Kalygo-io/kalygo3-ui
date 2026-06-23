"use client";

import { useState, useEffect } from "react";
import { XMarkIcon, BuildingOffice2Icon } from "@heroicons/react/24/outline";
import { errorToast } from "@/shared/toasts/errorToast";
import { companiesService, Company } from "@/services/companiesService";

export function LinkCompanyModal({
  existingCompanyIds,
  onClose,
  onLink,
}: {
  existingCompanyIds: Set<number>;
  onClose: () => void;
  onLink: (companyId: number, title: string) => Promise<void>;
}) {
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    companiesService
      .listCompaniesPage({ limit: 500 })
      .then((page) => setAllCompanies(page.companies))
      .catch((e) => errorToast(e.message || "Failed to load companies"))
      .finally(() => setLoadingCompanies(false));
  }, []);

  const available = allCompanies.filter((c) => !existingCompanyIds.has(c.id));
  const filtered = search.trim()
    ? available.filter((c) => {
        const term = search.toLowerCase();
        return (
          c.name.toLowerCase().includes(term) ||
          (c.domain || "").toLowerCase().includes(term) ||
          (c.industry || "").toLowerCase().includes(term)
        );
      })
    : available;

  const handleLink = async () => {
    if (selectedId == null) return;
    setSaving(true);
    try {
      await onLink(selectedId, title.trim());
    } catch (error: any) {
      errorToast(error.message || "Failed to link company");
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
              <BuildingOffice2Icon className="h-6 w-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Link Company</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 border-b border-gray-700 flex-shrink-0">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies…"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div className="overflow-y-auto flex-1 min-h-0">
            {loadingCompanies ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                Loading companies…
              </div>
            ) : available.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 text-sm gap-2 px-6 text-center">
                <span>
                  {allCompanies.length === 0
                    ? "No companies exist yet. Create one from the Companies page first."
                    : "This contact is already linked to every company."}
                </span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
                No companies match your search
              </div>
            ) : (
              <div>
                {filtered.map((company) => (
                  <div
                    key={company.id}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-gray-700/30 cursor-pointer transition-colors ${
                      selectedId === company.id ? "bg-blue-600/15" : "hover:bg-gray-700/20"
                    }`}
                    onClick={() => setSelectedId(company.id)}
                  >
                    <input
                      type="radio"
                      checked={selectedId === company.id}
                      onChange={() => setSelectedId(company.id)}
                      className="h-4 w-4 border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500/50 cursor-pointer"
                    />
                    <div className="h-8 w-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                      <BuildingOffice2Icon className="h-4 w-4 text-blue-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-medium truncate">{company.name}</p>
                      {(company.domain || company.industry) && (
                        <p className="text-gray-400 text-xs truncate">
                          {[company.industry, company.domain].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-700 flex-shrink-0 space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Title at this company (optional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. CTO, Head of Sales…"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleLink}
                disabled={selectedId == null || saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
              >
                {saving ? "Linking…" : "Link Company"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
