"use client";

import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { errorToast } from "@/shared/toasts/errorToast";
import {
  ContactEvent,
  CreateContactEventRequest,
} from "@/services/contactsService";
import { EVENT_TYPES } from "./event-types";

export function EventFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: ContactEvent;
  onClose: () => void;
  onSave: (data: CreateContactEventRequest) => Promise<void>;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    event_type: initial?.event_type ?? "note",
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    occurred_at: initial?.occurred_at
      ? new Date(initial.occurred_at).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
  });
  const [saving, setSaving] = useState(false);

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return errorToast("Title is required");
    setSaving(true);
    try {
      await onSave({
        event_type: form.event_type,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        occurred_at: new Date(form.occurred_at).toISOString(),
      });
    } catch (error: any) {
      errorToast(error.message || "Failed to save event");
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
              {isEdit ? "Edit Event" : "Log Event"}
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
              <label className="block text-sm font-medium text-gray-300 mb-1">Event Type</label>
              <select
                value={form.event_type}
                onChange={set("event_type")}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

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
                placeholder="e.g. Discovery call with Jane"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={set("description")}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                placeholder="Details, notes, next steps…"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Date &amp; Time</label>
              <input
                type="datetime-local"
                value={form.occurred_at}
                onChange={set("occurred_at")}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
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
                {saving ? "Saving…" : isEdit ? "Save Changes" : "Log Event"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
