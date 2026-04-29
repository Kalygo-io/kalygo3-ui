"use client";

import { useState, useEffect, useCallback } from "react";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  MegaphoneIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import {
  emailCampaignsService,
  EmailCampaign,
  CreateEmailCampaignPayload,
  UpdateEmailCampaignPayload,
} from "@/services/emailCampaignsService";
import {
  emailTemplatesService,
  EmailTemplate,
} from "@/services/emailTemplatesService";
import {
  contactListsService,
  ContactList,
} from "@/services/contactListsService";

const STATUSES = ["draft", "active", "paused", "completed"] as const;
type CampaignStatus = (typeof STATUSES)[number];

const STATUS_COLORS: Record<CampaignStatus, string> = {
  draft: "bg-gray-700/50 text-gray-300 border-gray-600",
  active: "bg-green-900/40 text-green-300 border-green-700/40",
  paused: "bg-yellow-900/40 text-yellow-300 border-yellow-700/40",
  completed: "bg-blue-900/40 text-blue-300 border-blue-700/40",
};

function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status as CampaignStatus] ?? STATUS_COLORS.draft;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors}`}
    >
      {status}
    </span>
  );
}

export function EmailCampaignsContainer() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);

  const [editing, setEditing] = useState<EmailCampaign | null>(null);
  const [isNew, setIsNew] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emailTemplateId, setEmailTemplateId] = useState<number | undefined>(
    undefined
  );
  const [contactListId, setContactListId] = useState<number | undefined>(
    undefined
  );
  const [status, setStatus] = useState<string>("draft");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await emailCampaignsService.list(
        search || undefined,
        statusFilter || undefined
      );
      setCampaigns(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  const loadRelatedData = useCallback(async () => {
    try {
      const [t, cl] = await Promise.all([
        emailTemplatesService.list(),
        contactListsService.listContactLists(),
      ]);
      setTemplates(t);
      setContactLists(cl);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadRelatedData();
  }, [loadRelatedData]);

  const openNew = () => {
    setEditing(null);
    setIsNew(true);
    setName("");
    setDescription("");
    setEmailTemplateId(undefined);
    setContactListId(undefined);
    setStatus("draft");
    setFormError(null);
  };

  const openEdit = (c: EmailCampaign) => {
    setEditing(c);
    setIsNew(false);
    setName(c.name);
    setDescription(c.description ?? "");
    setEmailTemplateId(c.email_template_id ?? undefined);
    setContactListId(c.contact_list_id ?? undefined);
    setStatus(c.status);
    setFormError(null);
  };

  const closeForm = () => {
    setEditing(null);
    setIsNew(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setFormError("Campaign name is required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (isNew) {
        const payload: CreateEmailCampaignPayload = {
          name: name.trim(),
          description: description.trim() || undefined,
          email_template_id: emailTemplateId,
          contact_list_id: contactListId,
          status,
        };
        await emailCampaignsService.create(payload);
      } else if (editing) {
        const payload: UpdateEmailCampaignPayload = {
          name: name.trim(),
          description: description.trim() || undefined,
          email_template_id: emailTemplateId,
          contact_list_id: contactListId,
          status,
        };
        await emailCampaignsService.update(editing.id, payload);
      }
      closeForm();
      load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this campaign? This cannot be undone.")) return;
    try {
      await emailCampaignsService.delete(id);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const isFormOpen = isNew || editing !== null;

  const templateName = (id?: number) =>
    id ? templates.find((t) => t.id === id)?.name : undefined;

  const contactListName = (id?: number) =>
    id ? contactLists.find((cl) => cl.id === id)?.name : undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Email Campaigns</h1>
          <p className="text-sm text-gray-400 mt-1">
            Create, manage, and track your email campaigns
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          New Campaign
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors text-sm"
        >
          <ArrowPathIcon
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-900/30 border border-red-700/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Campaign list */}
      {!isFormOpen && (
        <div className="space-y-3">
          {loading && !campaigns.length ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-gray-800/60 animate-pulse"
              />
            ))
          ) : campaigns.length === 0 ? (
            <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 py-16 text-center">
              <MegaphoneIcon className="h-10 w-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No campaigns yet.</p>
              <button
                onClick={openNew}
                className="mt-3 text-blue-400 hover:text-blue-300 text-sm underline underline-offset-2"
              >
                Create your first campaign
              </button>
            </div>
          ) : (
            campaigns.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-gray-700/50 bg-gray-900/50 px-5 py-4 flex items-start gap-4 hover:border-gray-600/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-white truncate">
                      {c.name}
                    </p>
                    <StatusBadge status={c.status} />
                  </div>
                  {c.description && (
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {c.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    {templateName(c.email_template_id) && (
                      <span>
                        Template:{" "}
                        <span className="text-gray-300">
                          {templateName(c.email_template_id)}
                        </span>
                      </span>
                    )}
                    {contactListName(c.contact_list_id) && (
                      <span>
                        List:{" "}
                        <span className="text-gray-300">
                          {contactListName(c.contact_list_id)}
                        </span>
                      </span>
                    )}
                    <span>
                      Created:{" "}
                      <span className="text-gray-300">
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEdit(c)}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                    title="Edit"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create/Edit form */}
      {isFormOpen && (
        <div className="rounded-xl border border-blue-700/40 bg-gray-900/60 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50 bg-gray-800/40">
            <h2 className="text-base font-semibold text-white">
              {isNew ? "New Campaign" : `Editing: ${editing?.name}`}
            </h2>
            <button
              onClick={closeForm}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {formError && (
              <div className="rounded-lg bg-red-900/30 border border-red-700/40 px-4 py-2 text-sm text-red-300">
                {formError}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-1.5">
                Campaign Name *
              </label>
              <input
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Spring Newsletter 2026"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-1.5">
                Description
              </label>
              <textarea
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this campaign's purpose"
              />
            </div>

            {/* Template + Contact List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-1.5">
                  Email Template
                </label>
                <select
                  value={emailTemplateId ?? ""}
                  onChange={(e) =>
                    setEmailTemplateId(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-1.5">
                  Contact List
                </label>
                <select
                  value={contactListId ?? ""}
                  onChange={(e) =>
                    setContactListId(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None</option>
                  {contactLists.map((cl) => (
                    <option key={cl.id} value={cl.id}>
                      {cl.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-1.5">
                Status
              </label>
              <div className="flex gap-2 flex-wrap">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      status === s
                        ? STATUS_COLORS[s] + " ring-1 ring-white/20"
                        : "border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600"
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-700/50 bg-gray-800/30">
            <button
              onClick={closeForm}
              className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {saving && (
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              )}
              {isNew ? "Create Campaign" : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
