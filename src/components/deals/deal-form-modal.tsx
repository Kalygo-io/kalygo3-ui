"use client";

import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { errorToast } from "@/shared/toasts/errorToast";
import {
  Deal,
  CreateDealRequest,
  DEAL_STAGES,
  DealStage,
} from "@/services/dealsService";
import { ContactCombobox } from "@/components/contacts/contact-combobox";

// Per-stage badge styling, shared by the Deals page and the contact-detail
// Deals section so the visual language stays consistent.
export const STAGE_META: Record<DealStage, { label: string; badge: string }> = {
  lead: { label: "Lead", badge: "bg-gray-600/20 text-gray-300 border-gray-500/30" },
  qualified: { label: "Qualified", badge: "bg-sky-600/20 text-sky-300 border-sky-500/30" },
  proposal: { label: "Proposal", badge: "bg-indigo-600/20 text-indigo-300 border-indigo-500/30" },
  negotiation: { label: "Negotiation", badge: "bg-amber-600/20 text-amber-300 border-amber-500/30" },
  won: { label: "Won", badge: "bg-emerald-600/20 text-emerald-300 border-emerald-500/30" },
  lost: { label: "Lost", badge: "bg-red-600/20 text-red-300 border-red-500/30" },
};

export function formatMoney(
  amount?: number | null,
  currency = "USD"
): string | null {
  if (amount == null) return null;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}

export function DealFormModal({
  initial,
  onClose,
  onSave,
  defaultContactId = null,
  defaultContactName = null,
}: {
  initial?: Deal;
  onClose: () => void;
  onSave: (data: CreateDealRequest) => Promise<void>;
  /** Pre-seed the contact link (e.g. adding a deal from a contact's page). */
  defaultContactId?: number | null;
  defaultContactName?: string | null;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    amount: initial?.amount != null ? String(initial.amount) : "",
    currency: initial?.currency ?? "USD",
    stage: (initial?.stage ?? "lead") as DealStage,
    expected_close_date: initial?.expected_close_date ?? "",
  });
  // Contact link is tracked separately from `form` since the combobox sets an
  // id/name pair rather than a plain input value.
  const [contactId, setContactId] = useState<number | null>(
    initial ? initial.contact_id ?? null : defaultContactId
  );
  const [contactName, setContactName] = useState<string | null>(
    initial ? initial.contact_name ?? null : defaultContactName
  );
  const [saving, setSaving] = useState(false);

  const set =
    (key: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return errorToast("Title is required");
    let amount: number | undefined;
    if (form.amount.trim()) {
      const parsed = Number(form.amount);
      if (isNaN(parsed) || parsed < 0) {
        return errorToast("Amount must be a non-negative number");
      }
      amount = parsed;
    }
    setSaving(true);
    try {
      await onSave({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        amount,
        currency: form.currency.trim().toUpperCase() || undefined,
        stage: form.stage,
        expected_close_date: form.expected_close_date || undefined,
        // Always sent: a number links, null unlinks (account-level deal).
        contact_id: contactId,
      });
    } catch (error: any) {
      errorToast(error.message || "Failed to save deal");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-gray-800 border border-gray-700 rounded-xl shadow-2xl">
          <div className="flex items-center justify-between p-5 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">
              {isEdit ? "Edit Deal" : "Add Deal"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={set("title")}
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="e.g. Annual subscription — Acme Corp"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={set("description")}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                placeholder="Scope, terms, notes…"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={set("amount")}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Currency
                </label>
                <input
                  type="text"
                  value={form.currency}
                  onChange={set("currency")}
                  maxLength={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white uppercase placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="USD"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Stage
                </label>
                <select
                  value={form.stage}
                  onChange={set("stage")}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  {DEAL_STAGES.map((s) => (
                    <option key={s} value={s}>
                      {STAGE_META[s].label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Expected Close
                </label>
                <input
                  type="date"
                  value={form.expected_close_date}
                  onChange={set("expected_close_date")}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Contact
              </label>
              <ContactCombobox
                value={contactId}
                displayName={contactName}
                onChange={(id, name) => {
                  setContactId(id);
                  setContactName(name);
                }}
                placeholder="Search contacts to link…"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional — leave empty for an account-level deal.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
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
                {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Deal"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
