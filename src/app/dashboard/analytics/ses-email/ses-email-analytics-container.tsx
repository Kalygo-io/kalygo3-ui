"use client";

import { useState, useEffect, useCallback } from "react";
import {
  EnvelopeIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  FunnelIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  emailEventsService,
  EmailEvent,
  EmailEventStats,
  ListEmailEventsParams,
} from "@/services/emailEventsService";

// ── Helpers ──────────────────────────────────────────────────────────────────

const EVENT_TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "send", label: "Send" },
  { value: "delivery", label: "Delivery" },
  { value: "open", label: "Open" },
  { value: "bounce", label: "Bounce" },
  { value: "complaint", label: "Complaint" },
  { value: "other", label: "Other" },
];

const EVENT_BADGE: Record<string, string> = {
  send: "bg-blue-900/40 text-blue-300 border border-blue-700/40",
  delivery: "bg-green-900/40 text-green-300 border border-green-700/40",
  open: "bg-purple-900/40 text-purple-300 border border-purple-700/40",
  bounce: "bg-red-900/40 text-red-300 border border-red-700/40",
  complaint: "bg-orange-900/40 text-orange-300 border border-orange-700/40",
  other: "bg-gray-800 text-gray-400 border border-gray-600",
};

const EMPTY_STATS: EmailEventStats = {
  send: 0, delivery: 0, open: 0, bounce: 0, complaint: 0, other: 0, total: 0,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, color, bg, border,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <div className={`rounded-xl border ${border} ${bg} p-5 flex items-center gap-4`}>
      <div className={`rounded-lg p-2 ${bg}`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
      </div>
    </div>
  );
}

// ── Main container ────────────────────────────────────────────────────────────

export function SesEmailAnalyticsContainer() {
  const [stats, setStats] = useState<EmailEventStats>(EMPTY_STATS);
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [recipient, setRecipient] = useState("");
  const [messageId, setMessageId] = useState("");
  const [eventType, setEventType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Applied filters (only committed on Search click)
  const [applied, setApplied] = useState<ListEmailEventsParams>({});

  const fetchData = useCallback(async (params: ListEmailEventsParams) => {
    setLoading(true);
    setError(null);
    try {
      const [eventsData, statsData] = await Promise.all([
        emailEventsService.listEvents({ ...params, limit: 200 }),
        emailEventsService.getStats({
          from_date: params.from_date,
          to_date: params.to_date,
        }),
      ]);
      setEvents(eventsData);
      setStats(statsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData({});
  }, [fetchData]);

  const handleSearch = () => {
    const params: ListEmailEventsParams = {};
    if (recipient.trim()) params.primary_recipient = recipient.trim();
    if (messageId.trim()) params.provider_message_id = messageId.trim();
    if (eventType) params.event_type = eventType;
    if (fromDate) params.from_date = new Date(fromDate).toISOString();
    if (toDate) params.to_date = new Date(toDate).toISOString();
    setApplied(params);
    fetchData(params);
  };

  const handleClear = () => {
    setRecipient("");
    setMessageId("");
    setEventType("");
    setFromDate("");
    setToDate("");
    setApplied({});
    fetchData({});
  };

  const hasFilters = !!(recipient || messageId || eventType || fromDate || toDate);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">SES Email Analytics</h1>
        <p className="mt-1 text-sm text-gray-400">
          Track delivery, open, bounce, and complaint events for emails sent via AWS SES.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Sent" value={stats.send} icon={EnvelopeIcon}
          color="text-blue-400" bg="bg-blue-900/20" border="border-blue-700/40" />
        <StatCard label="Delivered" value={stats.delivery} icon={CheckCircleIcon}
          color="text-green-400" bg="bg-green-900/20" border="border-green-700/40" />
        <StatCard label="Opens" value={stats.open} icon={ArrowTrendingUpIcon}
          color="text-purple-400" bg="bg-purple-900/20" border="border-purple-700/40" />
        <StatCard label="Bounces" value={stats.bounce} icon={ExclamationTriangleIcon}
          color="text-red-400" bg="bg-red-900/20" border="border-red-700/40" />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-4">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Filters</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            type="text"
            placeholder="Recipient email"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Provider Message ID"
            value={messageId}
            onChange={(e) => setMessageId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {EVENT_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Search
          </button>
          {hasFilters && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1 text-gray-400 hover:text-white text-sm px-3 py-2 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
              Clear
            </button>
          )}
          {Object.keys(applied).length > 0 && (
            <span className="text-xs text-gray-500 ml-1">
              Showing {events.length} filtered result{events.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-900/20 border border-red-700/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Event table */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700/50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">
            Email Events
            {!loading && (
              <span className="ml-2 text-xs font-normal text-gray-500">
                {events.length} record{events.length !== 1 ? "s" : ""}
              </span>
            )}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700/50">
            <thead className="bg-gray-800/50">
              <tr>
                {["Recipient", "Event", "Provider", "Message ID", "Timestamp"].map((col) => (
                  <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500 text-sm">
                    Loading…
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500 text-sm">
                    No email events found.
                  </td>
                </tr>
              ) : (
                events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-3 text-sm text-gray-300 max-w-[200px] truncate">
                      {ev.primary_recipient ?? <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${EVENT_BADGE[ev.event_type] ?? EVENT_BADGE.other}`}>
                        {ev.event_type}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-400">
                      {ev.provider ?? <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-400 font-mono max-w-[220px] truncate" title={ev.provider_message_id ?? ""}>
                      {ev.provider_message_id ?? <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-400 whitespace-nowrap">
                      {formatDate(ev.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
