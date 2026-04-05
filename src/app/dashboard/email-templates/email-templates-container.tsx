"use client";

import { useState, useEffect, useCallback } from "react";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  XMarkIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import {
  emailTemplatesService,
  EmailTemplate,
  TemplateVariable,
  CreateEmailTemplatePayload,
} from "@/services/emailTemplatesService";

// ── Default starter template ──────────────────────────────────────────────────
const STARTER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{{subject}}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">{{preheader}}</span>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f4;">
    <tr><td align="center" style="padding:24px 0;">
      <table width="600" cellpadding="0" cellspacing="0" border="0"
             style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;">
        <!-- Header -->
        <tr><td style="background:#1a1a2e;padding:24px 32px;">
          <p style="margin:0;font-size:22px;font-weight:bold;color:#ffffff;">{{company_name}}</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;font-size:16px;line-height:1.6;color:#333333;">
          <p style="margin:0 0 16px;">Hi {{first_name}},</p>
          <p style="margin:0 0 16px;">{{body}}</p>
          <!-- CTA button -->
          <table cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
            <tr><td style="background:#4f46e5;border-radius:6px;padding:12px 24px;text-align:center;">
              <a href="{{cta_url}}" style="color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;">
                {{cta_label}}
              </a>
            </td></tr>
          </table>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 32px;background:#f4f4f4;font-size:12px;color:#888888;text-align:center;">
          <p style="margin:0;">© 2026 {{company_name}}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const STARTER_VARIABLES: TemplateVariable[] = [
  { name: "subject", label: "Subject", default: "" },
  { name: "preheader", label: "Preheader text", default: "" },
  { name: "company_name", label: "Company name", default: "Your Company" },
  { name: "first_name", label: "First name", default: "there" },
  { name: "body", label: "Body content", default: "" },
  { name: "cta_url", label: "CTA URL", default: "https://" },
  { name: "cta_label", label: "CTA button label", default: "Learn More" },
];

// ── Helper — render {{token}} substitution for preview ─────────────────────────
function renderTemplate(html: string, vars: TemplateVariable[]): string {
  let out = html;
  for (const v of vars) {
    // Match {{ token }} with optional spaces — same tolerance as the Python renderer
    out = out.replace(
      new RegExp(`\\{\\{\\s*${v.name}\\s*\\}\\}`, "g"),
      v.default ?? "",
    );
  }
  return out;
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}
    >
      {children}
    </span>
  );
}

function VariableRow({
  variable,
  onChange,
  onRemove,
}: {
  variable: TemplateVariable;
  onChange: (updated: TemplateVariable) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
      <input
        className="bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="token_name"
        value={variable.name}
        onChange={(e) => onChange({ ...variable, name: e.target.value })}
      />
      <input
        className="bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="Label"
        value={variable.label}
        onChange={(e) => onChange({ ...variable, label: e.target.value })}
      />
      <input
        className="bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="Default value"
        value={variable.default ?? ""}
        onChange={(e) => onChange({ ...variable, default: e.target.value })}
      />
      <button
        onClick={onRemove}
        className="text-gray-500 hover:text-red-400 transition-colors p-1"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Main container ─────────────────────────────────────────────────────────────
export function EmailTemplatesContainer() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Editor state
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [isNew, setIsNew] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subjectTemplate, setSubjectTemplate] = useState("");
  const [htmlTemplate, setHtmlTemplate] = useState(STARTER_HTML);
  const [variables, setVariables] =
    useState<TemplateVariable[]>(STARTER_VARIABLES);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<EmailTemplate | null>(
    null,
  );

  // HTML editor tab
  const [activeTab, setActiveTab] = useState<"html" | "preview">("html");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await emailTemplatesService.list(search || undefined);
      setTemplates(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditing(null);
    setIsNew(true);
    setName("");
    setDescription("");
    setSubjectTemplate("");
    setHtmlTemplate(STARTER_HTML);
    setVariables(STARTER_VARIABLES);
    setFormError(null);
    setActiveTab("html");
  };

  const openEdit = (t: EmailTemplate) => {
    setEditing(t);
    setIsNew(false);
    setName(t.name);
    setDescription(t.description ?? "");
    setSubjectTemplate(t.subject_template);
    setHtmlTemplate(t.html_template);
    setVariables((t.variables as TemplateVariable[]) ?? []);
    setFormError(null);
    setActiveTab("html");
  };

  const closeForm = () => {
    setEditing(null);
    setIsNew(false);
  };

  const handleSave = async () => {
    if (!name.trim() || !subjectTemplate.trim() || !htmlTemplate.trim()) {
      setFormError("Name, subject, and HTML body are required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload: CreateEmailTemplatePayload = {
        name: name.trim(),
        description: description.trim() || undefined,
        subject_template: subjectTemplate.trim(),
        html_template: htmlTemplate,
        variables: variables.length > 0 ? variables : undefined,
      };
      if (isNew) {
        await emailTemplatesService.create(payload);
      } else if (editing) {
        await emailTemplatesService.update(editing.id, payload);
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
    if (!confirm("Delete this template? This cannot be undone.")) return;
    try {
      await emailTemplatesService.delete(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const addVariable = () =>
    setVariables((v) => [...v, { name: "", label: "", default: "" }]);

  const updateVariable = (i: number, v: TemplateVariable) =>
    setVariables((prev) => prev.map((x, idx) => (idx === i ? v : x)));

  const removeVariable = (i: number) =>
    setVariables((prev) => prev.filter((_, idx) => idx !== i));

  const isFormOpen = isNew || editing !== null;
  const livePreviewHtml = renderTemplate(htmlTemplate, variables);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Email Templates</h1>
          <p className="text-sm text-gray-400 mt-1">
            Reusable, inbox-compatible HTML templates with variable slots
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          New Template
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <input
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search templates…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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

      {/* Template list */}
      {!isFormOpen && (
        <div className="space-y-3">
          {loading && !templates.length ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-xl bg-gray-800/60 animate-pulse"
              />
            ))
          ) : templates.length === 0 ? (
            <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 py-16 text-center">
              <DocumentTextIcon className="h-10 w-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No templates yet.</p>
              <button
                onClick={openNew}
                className="mt-3 text-blue-400 hover:text-blue-300 text-sm underline underline-offset-2"
              >
                Create your first template
              </button>
            </div>
          ) : (
            templates.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-gray-700/50 bg-gray-900/50 px-5 py-4 flex items-center gap-4 hover:border-gray-600/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {t.name}
                  </p>
                  {t.description && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {t.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-xs text-gray-600 font-mono">
                      ID {t.id}
                    </span>
                    {(t.variables ?? []).map((v) => (
                      <Badge
                        key={v.name}
                        className="bg-blue-900/40 text-blue-300 border-blue-700/40"
                      >
                        {`{{${v.name}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setPreviewTarget(t);
                      setPreviewOpen(true);
                    }}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                    title="Preview"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openEdit(t)}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                    title="Edit"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
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

      {/* Editor form */}
      {isFormOpen && (
        <div className="rounded-xl border border-blue-700/40 bg-gray-900/60 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50 bg-gray-800/40">
            <h2 className="text-base font-semibold text-white">
              {isNew ? "New Template" : `Editing: ${editing?.name}`}
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

            {/* Name + Subject */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-1.5">
                  Name *
                </label>
                <input
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Welcome Email"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-1.5">
                  Subject template *
                </label>
                <input
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={subjectTemplate}
                  onChange={(e) => setSubjectTemplate(e.target.value)}
                  placeholder="Welcome to {{company_name}}, {{first_name}}!"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-1.5">
                Description
              </label>
              <input
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe when to use this template"
              />
            </div>

            {/* Variables */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold">
                  Variables
                </label>
                <button
                  onClick={addVariable}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Add variable
                </button>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 px-0.5">
                  {["Token name", "Label", "Default"].map((h) => (
                    <p key={h} className="text-xs text-gray-600 font-medium">
                      {h}
                    </p>
                  ))}
                  <span />
                </div>
                {variables.map((v, i) => (
                  <VariableRow
                    key={i}
                    variable={v}
                    onChange={(upd) => updateVariable(i, upd)}
                    onRemove={() => removeVariable(i)}
                  />
                ))}
                {variables.length === 0 && (
                  <p className="text-xs text-gray-600 italic">
                    No variables — template will be sent as-is.
                  </p>
                )}
              </div>
            </div>

            {/* HTML editor + preview tabs */}
            <div>
              <div className="flex items-center gap-1 mb-2">
                {(["html", "preview"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      activeTab === tab
                        ? "bg-blue-600 text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                    }`}
                  >
                    {tab === "html" ? "HTML Source" : "Live Preview"}
                  </button>
                ))}
                <span className="ml-auto text-xs text-gray-600">
                  Use <code className="text-blue-400">{"{{"}</code>token
                  <code className="text-blue-400">{"}}"}</code> for variables
                </span>
              </div>
              {activeTab === "html" ? (
                <textarea
                  value={htmlTemplate}
                  onChange={(e) => setHtmlTemplate(e.target.value)}
                  rows={18}
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-3 text-xs text-gray-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  spellCheck={false}
                />
              ) : (
                <iframe
                  srcDoc={livePreviewHtml}
                  sandbox="allow-same-origin"
                  className="w-full rounded-lg border border-gray-700 bg-white"
                  style={{ height: "480px" }}
                  title="Template live preview"
                />
              )}
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
              {isNew ? "Create Template" : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {previewOpen && previewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-2xl rounded-xl border border-gray-700 bg-gray-900 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-700 bg-gray-800/60">
              <div>
                <p className="text-sm font-semibold text-white">
                  {previewTarget.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Subject: {previewTarget.subject_template}
                </p>
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <iframe
              srcDoc={renderTemplate(
                previewTarget.html_template,
                (previewTarget.variables as TemplateVariable[]) ?? [],
              )}
              sandbox="allow-same-origin"
              className="w-full bg-white"
              style={{ height: "520px" }}
              title="Template preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}
