"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";
import {
  contactsService,
  Contact,
  ContactEvent,
  CreateContactEventRequest,
  UpdateContactRequest,
  CareerTimelineEntry,
  CreateCareerTimelineRequest,
} from "@/services/contactsService";
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  EnvelopeIcon,
  PhoneIcon,
  TagIcon,
  ClockIcon,
  ChatBubbleLeftEllipsisIcon,
  PhoneArrowUpRightIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
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

const SOURCE_OPTIONS = [
  "website", "referral", "chat_bot", "import", "cold_outreach", "event", "other",
];

// ── Main component ────────────────────────────────────────────────────────────

export function ContactDetailContainer({ contactId }: { contactId: number }) {
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editEvent, setEditEvent] = useState<ContactEvent | null>(null);

  // Career timeline state
  const [careerEntries, setCareerEntries] = useState<CareerTimelineEntry[]>([]);
  const [showCareerModal, setShowCareerModal] = useState(false);
  const [editCareerEntry, setEditCareerEntry] = useState<CareerTimelineEntry | null>(null);

  // Inline-edit form state
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const formRef = useRef<Record<string, string>>({});

  const buildForm = (c: Contact) => ({
    first_name: c.first_name,
    middle_name: c.middle_name ?? "",
    last_name: c.last_name ?? "",
    email: c.email,
    phone: c.phone ?? "",
    source: c.source ?? "",
  });

  useEffect(() => {
    loadContact();
  }, [contactId]);

  const loadContact = async () => {
    try {
      setLoading(true);
      const [data, career] = await Promise.all([
        contactsService.getContact(contactId),
        contactsService.listCareerTimeline(contactId),
      ]);
      setContact(data);
      setCareerEntries(career);
      const f = buildForm(data);
      setForm(f);
      formRef.current = f;
    } catch (error: any) {
      errorToast(error.message || "Failed to load contact");
      router.push("/dashboard/contacts");
    } finally {
      setLoading(false);
    }
  };

  const set =
    (key: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const isDirty = contact
    ? Object.keys(form).some((k) => form[k] !== formRef.current[k])
    : false;

  const handleSave = useCallback(async () => {
    if (!contact || !isDirty) return;
    if (!form.first_name.trim()) return errorToast("First name is required");
    if (!form.email.trim()) return errorToast("Email is required");
    setSaving(true);
    try {
      const payload: UpdateContactRequest = {
        first_name: form.first_name.trim(),
        middle_name: form.middle_name.trim() || undefined,
        last_name: form.last_name.trim() || undefined,
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        source: form.source || undefined,
      };
      const updated = await contactsService.updateContact(contact.id, payload);
      setContact((prev) => (prev ? { ...updated, events: prev.events } : prev));
      const f = buildForm(updated);
      setForm(f);
      formRef.current = f;
      successToast("Contact saved");
    } catch (error: any) {
      errorToast(error.message || "Failed to save contact");
    } finally {
      setSaving(false);
    }
  }, [contact, form, isDirty]);

  const handleDiscard = useCallback(() => {
    setForm({ ...formRef.current });
  }, []);

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

  const handleDeleteCareerEntry = async (entry: CareerTimelineEntry) => {
    const confirmed = window.confirm(`Delete "${entry.title}"?`);
    if (!confirmed || !contact) return;
    try {
      await contactsService.deleteCareerTimelineEntry(contact.id, entry.id);
      setCareerEntries((prev) => prev.filter((e) => e.id !== entry.id));
      successToast("Entry deleted");
    } catch (error: any) {
      errorToast(error.message || "Failed to delete entry");
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

  const inputClass =
    "w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm";
  const selectClass =
    "w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm";

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

      {/* Contact card — always editable */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
        {/* Avatar + name row */}
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-1">
            <span className="text-xl font-bold text-blue-300">
              {(form.first_name || "?").charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">First Name <span className="text-red-400">*</span></label>
                <input type="text" value={form.first_name} onChange={set("first_name")} className={inputClass} placeholder="First" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Middle Name</label>
                <input type="text" value={form.middle_name} onChange={set("middle_name")} className={inputClass} placeholder="Middle" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Last Name</label>
                <input type="text" value={form.last_name} onChange={set("last_name")} className={inputClass} placeholder="Last" />
              </div>
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <EnvelopeIcon className="h-3.5 w-3.5" /> Email <span className="text-red-400">*</span>
            </label>
            <input type="email" value={form.email} onChange={set("email")} className={inputClass} placeholder="email@example.com" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <PhoneIcon className="h-3.5 w-3.5" /> Phone
            </label>
            <input type="tel" value={form.phone} onChange={set("phone")} className={inputClass} placeholder="+1 (555) 000-0000" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <TagIcon className="h-3.5 w-3.5" /> Source
            </label>
            <select value={form.source} onChange={set("source")} className={selectClass}>
              <option value="">— Select —</option>
              {SOURCE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Read-only metadata */}
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <ClockIcon className="h-3.5 w-3.5" />
            Added {new Date(contact.created_at).toLocaleDateString()}
          </span>
          {contact.updated_at !== contact.created_at && (
            <span>· Updated {new Date(contact.updated_at).toLocaleDateString()}</span>
          )}
        </div>

        {/* Save / discard bar — appears when dirty */}
        {isDirty && (
          <div className="mt-4 flex items-center justify-end gap-3 pt-3 border-t border-gray-700/50">
            <button
              type="button"
              onClick={handleDiscard}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {/* Career Timeline */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Career Timeline</h2>
          <button
            onClick={() => setShowCareerModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <PlusIcon className="h-4 w-4" />
            Add Entry
          </button>
        </div>

        {careerEntries.length === 0 ? (
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-10 text-center">
            <BriefcaseIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-2">No career history yet</p>
            <p className="text-gray-500 text-sm mb-5">
              Track roles, positions, and career milestones for this contact.
            </p>
            <button
              onClick={() => setShowCareerModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2 text-sm"
            >
              <PlusIcon className="h-4 w-4" />
              Add First Entry
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {careerEntries.map((entry) => {
              const start = new Date(entry.start_date + "T00:00:00");
              const end = entry.end_date ? new Date(entry.end_date + "T00:00:00") : null;
              const dateLabel = end
                ? `${start.toLocaleDateString(undefined, { month: "short", year: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", year: "numeric" })}`
                : `${start.toLocaleDateString(undefined, { month: "short", year: "numeric" })} – Present`;

              return (
                <div
                  key={entry.id}
                  className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 hover:border-gray-600/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <BriefcaseIcon className="h-4 w-4 text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium">{entry.title}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <CalendarDaysIcon className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                          <span className="text-gray-400 text-sm">{dateLabel}</span>
                        </div>
                        {entry.description && (
                          <p className="text-gray-400 text-sm mt-2 whitespace-pre-wrap">
                            {entry.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setEditCareerEntry(entry)}
                        className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-600/10 rounded-lg transition-colors"
                        title="Edit entry"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCareerEntry(entry)}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
                        title="Delete entry"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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

      {/* Create career timeline modal */}
      {showCareerModal && (
        <CareerTimelineFormModal
          onClose={() => setShowCareerModal(false)}
          onSave={async (data) => {
            const created = await contactsService.createCareerTimelineEntry(contact.id, data);
            setCareerEntries((prev) =>
              [created, ...prev].sort(
                (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
              )
            );
            setShowCareerModal(false);
            successToast("Career entry added");
          }}
        />
      )}

      {/* Edit career timeline modal */}
      {editCareerEntry && (
        <CareerTimelineFormModal
          initial={editCareerEntry}
          onClose={() => setEditCareerEntry(null)}
          onSave={async (data) => {
            const updated = await contactsService.updateCareerTimelineEntry(
              contact.id,
              editCareerEntry.id,
              data
            );
            setCareerEntries((prev) =>
              prev
                .map((e) => (e.id === updated.id ? updated : e))
                .sort(
                  (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
                )
            );
            setEditCareerEntry(null);
            successToast("Career entry updated");
          }}
        />
      )}
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

// ── Career Timeline form modal ───────────────────────────────────────────────

function CareerTimelineFormModal({
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
