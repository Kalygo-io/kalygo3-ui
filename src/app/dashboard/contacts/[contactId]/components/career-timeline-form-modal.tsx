"use client";

import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { errorToast } from "@/shared/toasts/errorToast";
import {
  CareerTimelineEntry,
  CreateCareerTimelineRequest,
} from "@/services/contactsService";

export function CareerTimelineFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: CareerTimelineEntry;
  onClose: () => void;
  onSave: (data: CreateCareerTimelineRequest) => Promise<void>;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    start_date: initial?.start_date ?? "",
    end_date: initial?.end_date ?? "",
  });
  const [saving, setSaving] = useState(false);

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return errorToast("Title is required");
    if (!form.start_date) return errorToast("Start date is required");
    if (form.end_date && form.end_date < form.start_date) {
      return errorToast("End date cannot be before start date");
    }
    setSaving(true);
    try {
      await onSave({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        start_date: form.start_date,
        end_date: form.end_date || undefined,
      });
    } catch (error: any) {
      errorToast(error.message || "Failed to save entry");
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
              {isEdit ? "Edit Career Entry" : "Add Career Entry"}
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
                placeholder="e.g. Software Engineer at Acme Corp"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={set("description")}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                placeholder="Responsibilities, achievements, notes…"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Start Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={set("start_date")}
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={set("end_date")}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
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
                {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Entry"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
