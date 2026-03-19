"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";
import {
  contactsService,
  Contact,
  ContactEvent,
  CreateContactEventRequest,
} from "@/services/contactsService";
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  TagIcon,
  ClockIcon,
  ChatBubbleLeftEllipsisIcon,
  PhoneArrowUpRightIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

// ── Event type config ─────────────────────────────────────────────────────────

const EVENT_TYPES = [
  { value: "note", label: "Note", icon: DocumentTextIcon, color: "text-gray-400" },
  { value: "call", label: "Call", icon: PhoneArrowUpRightIcon, color: "text-green-400" },
  { value: "email", label: "Email", icon: EnvelopeIcon, color: "text-blue-400" },
  { value: "meeting", label: "Meeting", icon: VideoCameraIcon, color: "text-purple-400" },
  { value: "demo", label: "Demo", icon: VideoCameraIcon, color: "text-indigo-400" },
  { value: "proposal_sent", label: "Proposal Sent", icon: PaperAirplaneIcon, color: "text-amber-400" },
  { value: "contract_signed", label: "Contract Signed", icon: CheckCircleIcon, color: "text-emerald-400" },
];

function getEventType(value: string) {
  return EVENT_TYPES.find((t) => t.value === value) ?? {
    value,
    label: value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    icon: ChatBubbleLeftEllipsisIcon,
    color: "text-gray-400",
  };
}

function statusBadgeClass(status?: string) {
  switch (status) {
    case "customer": return "bg-emerald-700/40 text-emerald-300 border-emerald-600/50";
    case "prospect": return "bg-blue-700/40 text-blue-300 border-blue-600/50";
    case "lead": return "bg-amber-700/40 text-amber-300 border-amber-600/50";
    case "churned": return "bg-red-700/40 text-red-300 border-red-600/50";
    default: return "bg-gray-700/40 text-gray-400 border-gray-600/50";
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export function ContactDetailContainer({ contactId }: { contactId: number }) {
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editEvent, setEditEvent] = useState<ContactEvent | null>(null);

  useEffect(() => {
    loadContact();
  }, [contactId]);

  const loadContact = async () => {
    try {
      setLoading(true);
      const data = await contactsService.getContact(contactId);
      setContact(data);
    } catch (error: any) {
      errorToast(error.message || "Failed to load contact");
      router.push("/dashboard/contacts");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (event: ContactEvent) => {
    const confirmed = window.confirm(`Delete event "${event.title}"?`);
    if (!confirmed || !contact) return;
    try {
      await contactsService.deleteEvent(contact.id, event.id);
      setContact((prev) =>
        prev ? { ...prev, events: (prev.events ?? []).filter((e) => e.id !== event.id) } : prev
      );
      successToast("Event deleted");
    } catch (error: any) {
      errorToast(error.message || "Failed to delete event");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Loading contact…</div>
      </div>
    );
  }

  if (!contact) return null;

  const events = (contact.events ?? []).slice().sort(
    (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push("/dashboard/contacts")}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Contacts
      </button>

      {/* Contact card */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-blue-300">
                {contact.first_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-semibold text-white">
                  {contact.first_name}{contact.last_name ? ` ${contact.last_name}` : ""}
                </h1>
                {contact.status && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadgeClass(contact.status)}`}
                  >
                    {contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
                  </span>
                )}
              </div>
              {contact.title && (
                <p className="text-gray-400 text-sm mt-0.5 flex items-center gap-1.5">
                  <BriefcaseIcon className="h-4 w-4" />
                  {contact.title}
                  {contact.company && <span className="text-gray-600">·</span>}
                  {contact.company && (
                    <span className="flex items-center gap-1">
                      <BuildingOfficeIcon className="h-4 w-4" />
                      {contact.company}
                    </span>
                  )}
                </p>
              )}
              {!contact.title && contact.company && (
                <p className="text-gray-400 text-sm mt-0.5 flex items-center gap-1.5">
                  <BuildingOfficeIcon className="h-4 w-4" />
                  {contact.company}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => router.push(`/dashboard/contacts?edit=${contact.id}`)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white text-sm rounded-lg transition-colors"
          >
            <PencilIcon className="h-4 w-4" />
            Edit
          </button>
        </div>

        {/* Contact details grid */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <DetailChip icon={EnvelopeIcon} label="Email" value={contact.email} />
          {contact.phone && <DetailChip icon={PhoneIcon} label="Phone" value={contact.phone} />}
          {contact.source && (
            <DetailChip
              icon={TagIcon}
              label="Source"
              value={contact.source.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            />
          )}
          <DetailChip
            icon={ClockIcon}
            label="Added"
            value={new Date(contact.created_at).toLocaleDateString()}
          />
        </div>

        {contact.notes && (
          <div className="mt-4 p-4 bg-gray-900/50 rounded-lg">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Notes</p>
            <p className="text-gray-300 text-sm whitespace-pre-wrap">{contact.notes}</p>
          </div>
        )}
      </div>

      {/* Event timeline */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Activity Timeline</h2>
          <button
            onClick={() => setShowEventModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <PlusIcon className="h-4 w-4" />
            Log Event
          </button>
        </div>

        {events.length === 0 ? (
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-10 text-center">
            <ChatBubbleLeftEllipsisIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-2">No events logged yet</p>
            <p className="text-gray-500 text-sm mb-5">
              Log calls, emails, meetings, and notes to track your interactions.
            </p>
            <button
              onClick={() => setShowEventModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2 text-sm"
            >
              <PlusIcon className="h-4 w-4" />
              Log First Event
            </button>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-700/50" />
            <div className="space-y-4 pl-14">
              {events.map((event) => {
                const et = getEventType(event.event_type);
                const Icon = et.icon;
                return (
                  <div key={event.id} className="relative">
                    {/* Dot on timeline */}
                    <div className="absolute -left-9 top-4 h-8 w-8 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center">
                      <Icon className={`h-4 w-4 ${et.color}`} />
                    </div>
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 hover:border-gray-600/50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-semibold uppercase tracking-wide ${et.color}`}>
                              {et.label}
                            </span>
                            <span className="text-gray-600 text-xs">·</span>
                            <span className="text-gray-400 text-xs">
                              {new Date(event.occurred_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-white font-medium mt-1">{event.title}</p>
                          {event.description && (
                            <p className="text-gray-400 text-sm mt-1 whitespace-pre-wrap">
                              {event.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => setEditEvent(event)}
                            className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-600/10 rounded-lg transition-colors"
                            title="Edit event"
                          >
                            <PencilIcon className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event)}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
                            title="Delete event"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Create event modal */}
      {showEventModal && (
        <EventFormModal
          onClose={() => setShowEventModal(false)}
          onSave={async (data) => {
            const created = await contactsService.createEvent(contact.id, data);
            setContact((prev) =>
              prev ? { ...prev, events: [created, ...(prev.events ?? [])] } : prev
            );
            setShowEventModal(false);
            successToast("Event logged");
          }}
        />
      )}

      {/* Edit event modal */}
      {editEvent && (
        <EventFormModal
          initial={editEvent}
          onClose={() => setEditEvent(null)}
          onSave={async (data) => {
            const updated = await contactsService.updateEvent(contact.id, editEvent.id, data);
            setContact((prev) =>
              prev
                ? { ...prev, events: (prev.events ?? []).map((e) => (e.id === updated.id ? updated : e)) }
                : prev
            );
            setEditEvent(null);
            successToast("Event updated");
          }}
        />
      )}
    </div>
  );
}

// ── Detail chip ───────────────────────────────────────────────────────────────

function DetailChip({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-gray-700/30 rounded-lg px-3 py-2">
      <Icon className="h-4 w-4 text-gray-500 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-gray-200 truncate">{value}</p>
      </div>
    </div>
  );
}

// ── Event form modal ──────────────────────────────────────────────────────────

function EventFormModal({
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
