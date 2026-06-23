"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";
import { PageLoading } from "@/components/shared/common/page-loading";
import { EmptyState } from "@/components/shared/common/empty-state";
import { useConfirmDelete } from "@/shared/hooks/use-confirm-delete";
import {
  contactsService,
  Contact,
  ContactEvent,
  UpdateContactRequest,
  CareerTimelineEntry,
  ContactCompany,
} from "@/services/contactsService";
import { dealsService, Deal } from "@/services/dealsService";
import {
  DealFormModal,
  STAGE_META,
  formatMoney,
} from "@/components/deals/deal-form-modal";
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
  TagIcon,
  ClockIcon,
  ChatBubbleLeftEllipsisIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  SparklesIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
  LinkIcon,
  BuildingOffice2Icon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import { ContactAgentDrawer } from "./contact-agent-drawer";
import { DetailSection } from "./components/detail-section";
import { EventFormModal } from "./components/event-form-modal";
import { CareerTimelineFormModal } from "./components/career-timeline-form-modal";
import { LinkCompanyModal } from "./components/link-company-modal";
import { getEventType } from "./components/event-types";

// ── Source config ─────────────────────────────────────────────────────────────

const SOURCE_OPTIONS = [
  "website", "referral", "chat_bot", "import", "cold_outreach", "event", "other",
];

// ── Main component ────────────────────────────────────────────────────────────

export function ContactDetailContainer({ contactId }: { contactId: number }) {
  const router = useRouter();
  const confirmDelete = useConfirmDelete();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editEvent, setEditEvent] = useState<ContactEvent | null>(null);
  const [showAssistant, setShowAssistant] = useState(false);
  const [refreshingEvents, setRefreshingEvents] = useState(false);

  // Career timeline state
  const [careerEntries, setCareerEntries] = useState<CareerTimelineEntry[]>([]);
  const [showCareerModal, setShowCareerModal] = useState(false);
  const [editCareerEntry, setEditCareerEntry] = useState<CareerTimelineEntry | null>(null);

  // Deals state
  const [deals, setDeals] = useState<Deal[]>([]);
  const [showDealModal, setShowDealModal] = useState(false);
  const [editDeal, setEditDeal] = useState<Deal | null>(null);

  // Companies state (which companies this contact is associated with)
  const [companies, setCompanies] = useState<ContactCompany[]>([]);
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  // Inline-edit form state
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const formRef = useRef<Record<string, string>>({});

  const buildForm = (c: Contact) => ({
    first_name: c.first_name,
    middle_name: c.middle_name ?? "",
    last_name: c.last_name ?? "",
    email: c.email,
    alt_email_1: c.alt_email_1 ?? "",
    alt_email_2: c.alt_email_2 ?? "",
    phone: c.phone ?? "",
    source: c.source ?? "",
    linkedin_url: c.linkedin_url ?? "",
    instagram_url: c.instagram_url ?? "",
    youtube_url: c.youtube_url ?? "",
    x_url: c.x_url ?? "",
  });

  useEffect(() => {
    loadContact();
  }, [contactId]);

  const loadContact = async () => {
    try {
      setLoading(true);
      const [data, career, dealList, companyList] = await Promise.all([
        contactsService.getContact(contactId),
        contactsService.listCareerTimeline(contactId),
        dealsService.listDealsForContact(contactId),
        contactsService.listCompanies(contactId),
      ]);
      setContact(data);
      setCareerEntries(career);
      setDeals(dealList);
      setCompanies(companyList);
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
        // Sent as "" (not undefined) when blank so the backend clears it.
        alt_email_1: form.alt_email_1.trim(),
        alt_email_2: form.alt_email_2.trim(),
        phone: form.phone.trim() || undefined,
        source: form.source || undefined,
        // Sent as "" when blank so an edit clears the field.
        linkedin_url: form.linkedin_url.trim(),
        instagram_url: form.instagram_url.trim(),
        youtube_url: form.youtube_url.trim(),
        x_url: form.x_url.trim(),
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

  const handleRefreshEvents = async () => {
    if (!contact || refreshingEvents) return;
    setRefreshingEvents(true);
    try {
      const events = await contactsService.listEvents(contact.id);
      setContact((prev) => (prev ? { ...prev, events } : prev));
    } catch (error: any) {
      errorToast(error.message || "Failed to refresh activity timeline");
    } finally {
      setRefreshingEvents(false);
    }
  };

  const handleDeleteEvent = async (event: ContactEvent) => {
    if (!contact) return;
    await confirmDelete(
      `Delete event "${event.title}"?`,
      () => contactsService.deleteEvent(contact.id, event.id),
      {
        successMessage: "Event deleted",
        errorMessage: "Failed to delete event",
        onSuccess: () =>
          setContact((prev) =>
            prev
              ? { ...prev, events: (prev.events ?? []).filter((e) => e.id !== event.id) }
              : prev
          ),
      }
    );
  };

  const handleDeleteCareerEntry = async (entry: CareerTimelineEntry) => {
    if (!contact) return;
    await confirmDelete(
      `Delete "${entry.title}"?`,
      () => contactsService.deleteCareerTimelineEntry(contact.id, entry.id),
      {
        successMessage: "Entry deleted",
        errorMessage: "Failed to delete entry",
        onSuccess: () => setCareerEntries((prev) => prev.filter((e) => e.id !== entry.id)),
      }
    );
  };

  const handleDeleteDeal = async (deal: Deal) => {
    if (!contact) return;
    await confirmDelete(
      `Delete deal "${deal.title}"?`,
      () => dealsService.deleteDeal(deal.id),
      {
        successMessage: "Deal deleted",
        errorMessage: "Failed to delete deal",
        onSuccess: () => setDeals((prev) => prev.filter((d) => d.id !== deal.id)),
      }
    );
  };

  const handleRemoveCompany = async (membership: ContactCompany) => {
    if (!contact) return;
    await confirmDelete(
      `Remove this contact from "${membership.company.name}"?`,
      () => contactsService.removeCompany(contact.id, membership.company_id),
      {
        successMessage: `Removed from "${membership.company.name}"`,
        errorMessage: "Failed to remove company",
        onSuccess: () => setCompanies((prev) => prev.filter((m) => m.id !== membership.id)),
      }
    );
  };

  if (loading) {
    return <PageLoading label="Loading contact..." />;
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
      {/* Back + AI Assistant */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => router.push("/dashboard/contacts")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Contacts
        </button>
        <button
          onClick={() => setShowAssistant(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
        >
          <SparklesIcon className="h-4 w-4" />
          AI Assistant
        </button>
      </div>

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
              <EnvelopeIcon className="h-3.5 w-3.5" /> Default Email <span className="text-red-400">*</span>
            </label>
            <input type="email" value={form.email} onChange={set("email")} className={inputClass} placeholder="email@example.com" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <EnvelopeIcon className="h-3.5 w-3.5" /> Alternate Email 1
            </label>
            <input type="email" value={form.alt_email_1} onChange={set("alt_email_1")} className={inputClass} placeholder="alternate@example.com" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <EnvelopeIcon className="h-3.5 w-3.5" /> Alternate Email 2
            </label>
            <input type="email" value={form.alt_email_2} onChange={set("alt_email_2")} className={inputClass} placeholder="alternate@example.com" />
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
          <div>
            <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <LinkIcon className="h-3.5 w-3.5" /> LinkedIn
            </label>
            <input type="url" value={form.linkedin_url} onChange={set("linkedin_url")} className={inputClass} placeholder="https://linkedin.com/in/…" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <LinkIcon className="h-3.5 w-3.5" /> Instagram
            </label>
            <input type="url" value={form.instagram_url} onChange={set("instagram_url")} className={inputClass} placeholder="https://instagram.com/…" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <LinkIcon className="h-3.5 w-3.5" /> YouTube
            </label>
            <input type="url" value={form.youtube_url} onChange={set("youtube_url")} className={inputClass} placeholder="https://youtube.com/@…" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <LinkIcon className="h-3.5 w-3.5" /> X (Twitter)
            </label>
            <input type="url" value={form.x_url} onChange={set("x_url")} className={inputClass} placeholder="https://x.com/…" />
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

      {/* Companies */}
      <DetailSection
        title="Companies"
        addLabel="Link Company"
        onAdd={() => setShowCompanyModal(true)}
      >
        {companies.length === 0 ? (
          <EmptyState
            size="sm"
            icon={BuildingOffice2Icon}
            title="Not linked to any companies yet"
            description="Associate this contact with the companies they work with."
            action={
              <button
                onClick={() => setShowCompanyModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2 text-sm"
              >
                <PlusIcon className="h-4 w-4" />
                Link First Company
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {companies.map((membership) => (
              <div
                key={membership.id}
                className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 hover:border-gray-600/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="flex items-start gap-3 min-w-0 cursor-pointer"
                    onClick={() => router.push(`/dashboard/companies/${membership.company_id}`)}
                  >
                    <div className="h-9 w-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BuildingOffice2Icon className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-medium hover:text-blue-300 transition-colors">
                          {membership.company.name}
                        </p>
                        {membership.title && (
                          <span className="text-xs px-2 py-0.5 rounded-full border border-gray-600 text-gray-300">
                            {membership.title}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {membership.company.industry && (
                          <span className="text-gray-400 text-sm">
                            {membership.company.industry}
                          </span>
                        )}
                        {membership.company.domain && (
                          <span className="flex items-center gap-1.5 text-gray-400 text-sm">
                            <GlobeAltIcon className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                            {membership.company.domain}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveCompany(membership)}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors flex-shrink-0"
                    title="Remove from company"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DetailSection>

      {/* Career Timeline */}
      <DetailSection
        title="Career Timeline"
        addLabel="Add Entry"
        onAdd={() => setShowCareerModal(true)}
      >
        {careerEntries.length === 0 ? (
          <EmptyState
            size="sm"
            icon={BriefcaseIcon}
            title="No career history yet"
            description="Track roles, positions, and career milestones for this contact."
            action={
              <button
                onClick={() => setShowCareerModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2 text-sm"
              >
                <PlusIcon className="h-4 w-4" />
                Add First Entry
              </button>
            }
          />
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
      </DetailSection>

      {/* Deals */}
      <DetailSection
        title="Deals"
        addLabel="Add Deal"
        onAdd={() => setShowDealModal(true)}
      >
        {deals.length === 0 ? (
          <EmptyState
            size="sm"
            icon={CurrencyDollarIcon}
            title="No deals yet"
            description="Track sales opportunities associated with this contact."
            action={
              <button
                onClick={() => setShowDealModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2 text-sm"
              >
                <PlusIcon className="h-4 w-4" />
                Add First Deal
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {deals.map((deal) => {
              const stageMeta = STAGE_META[deal.stage] ?? STAGE_META.lead;
              const money = formatMoney(deal.amount, deal.currency);
              const closeLabel = deal.expected_close_date
                ? new Date(deal.expected_close_date + "T00:00:00").toLocaleDateString(
                    undefined,
                    { month: "short", day: "numeric", year: "numeric" }
                  )
                : null;
              return (
                <div
                  key={deal.id}
                  className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 hover:border-gray-600/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CurrencyDollarIcon className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-white font-medium">{deal.title}</p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border ${stageMeta.badge}`}
                          >
                            {stageMeta.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {money && (
                            <span className="text-gray-300 text-sm font-medium">{money}</span>
                          )}
                          {closeLabel && (
                            <span className="flex items-center gap-1.5 text-gray-400 text-sm">
                              <CalendarDaysIcon className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                              Close {closeLabel}
                            </span>
                          )}
                        </div>
                        {deal.description && (
                          <p className="text-gray-400 text-sm mt-2 whitespace-pre-wrap">
                            {deal.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setEditDeal(deal)}
                        className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-600/10 rounded-lg transition-colors"
                        title="Edit deal"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDeal(deal)}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
                        title="Delete deal"
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
      </DetailSection>

      {/* Event timeline */}
      <DetailSection
        title="Activity Timeline"
        addLabel="Log Event"
        onAdd={() => setShowEventModal(true)}
        extraActions={
          <button
            onClick={handleRefreshEvents}
            disabled={refreshingEvents}
            title="Refresh activity timeline"
            aria-label="Refresh activity timeline"
            className="bg-gray-800 hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed text-gray-300 hover:text-white font-medium py-2 px-3 rounded-lg transition-colors flex items-center gap-2 text-sm border border-gray-700"
          >
            <ArrowPathIcon
              className={`h-4 w-4 ${refreshingEvents ? "animate-spin" : ""}`}
            />
          </button>
        }
      >
        {events.length === 0 ? (
          <EmptyState
            size="sm"
            icon={ChatBubbleLeftEllipsisIcon}
            title="No events logged yet"
            description="Log calls, emails, meetings, and notes to track your interactions."
            action={
              <button
                onClick={() => setShowEventModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2 text-sm"
              >
                <PlusIcon className="h-4 w-4" />
                Log First Event
              </button>
            }
          />
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
                          <p className="text-white font-medium mt-1 break-words">{event.title}</p>
                          {event.description && (
                            <p className="text-gray-400 text-sm mt-1 whitespace-pre-wrap break-words">
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
      </DetailSection>

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

      {/* Create deal modal */}
      {showDealModal && (
        <DealFormModal
          defaultContactId={contact.id}
          defaultContactName={contact.name}
          onClose={() => setShowDealModal(false)}
          onSave={async (data) => {
            const created = await dealsService.createDeal(data);
            setDeals((prev) => [created, ...prev]);
            setShowDealModal(false);
            successToast("Deal added");
          }}
        />
      )}

      {/* Edit deal modal */}
      {editDeal && (
        <DealFormModal
          initial={editDeal}
          onClose={() => setEditDeal(null)}
          onSave={async (data) => {
            const updated = await dealsService.updateDeal(editDeal.id, data);
            setDeals((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
            setEditDeal(null);
            successToast("Deal updated");
          }}
        />
      )}

      {/* Link company modal */}
      {showCompanyModal && (
        <LinkCompanyModal
          existingCompanyIds={new Set(companies.map((m) => m.company_id))}
          onClose={() => setShowCompanyModal(false)}
          onLink={async (companyId, title) => {
            const created = await contactsService.addCompany(contact.id, {
              company_id: companyId,
              title: title || undefined,
            });
            setCompanies((prev) => [...prev, created]);
            setShowCompanyModal(false);
            successToast(`Linked to "${created.company.name}"`);
          }}
        />
      )}

      {/* Contact-scoped AI assistant drawer */}
      <ContactAgentDrawer
        contactId={contact.id}
        contactName={
          [contact.first_name, contact.last_name].filter(Boolean).join(" ") ||
          contact.email
        }
        isOpen={showAssistant}
        onClose={() => setShowAssistant(false)}
      />
    </div>
  );
}
