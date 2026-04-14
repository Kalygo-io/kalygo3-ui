"use client";

import { useState } from "react";
import {
  Contact,
  CreateContactRequest,
  UpdateContactRequest,
} from "@/services/contactsService";
import { UserIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { errorToast } from "@/shared/toasts/errorToast";

const SOURCE_OPTIONS = [
  "website",
  "referral",
  "chat_bot",
  "import",
  "cold_outreach",
  "event",
  "other",
];

interface ContactFormModalProps {
  initial?: Contact;
  onClose: () => void;
  onSave: (data: CreateContactRequest | UpdateContactRequest) => Promise<void>;
}

export function ContactFormModal({
  initial,
  onClose,
  onSave,
}: ContactFormModalProps) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    first_name: initial?.first_name ?? "",
    middle_name: initial?.middle_name ?? "",
    last_name: initial?.last_name ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    source: initial?.source ?? "",
  });
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
    if (!form.first_name.trim()) return errorToast("First name is required");
    if (!form.email.trim()) return errorToast("Email is required");
    setSaving(true);
    try {
      const payload = {
        first_name: form.first_name.trim(),
        middle_name: form.middle_name.trim() || undefined,
        last_name: form.last_name.trim() || undefined,
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        source: form.source || undefined,
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Middle Name
                </label>
                <input
                  type="text"
                  value={form.middle_name}
                  onChange={set("middle_name")}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Marie"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Last Name
                </label>
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
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={set("phone")}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="+1 555 000 0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Source
                </label>
                <select
                  value={form.source}
                  onChange={set("source")}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="">— Select —</option>
                  {SOURCE_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
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
