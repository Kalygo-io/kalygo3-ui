"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  EnvelopeIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  FunnelIcon,
  XMarkIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ShieldExclamationIcon,
  CursorArrowRaysIcon,
} from "@heroicons/react/24/outline";
import {
  emailEventsService,
  EmailEvent,
  EmailEventStats,
  ListEmailEventsParams,
} from "@/services/emailEventsService";

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const AUTO_REFRESH_INTERVAL = 5000;

const EVENT_TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "send", label: "Send" },
  { value: "delivery", label: "Delivery" },
  { value: "open", label: "Open" },
  { value: "bounce", label: "Bounce" },
  { value: "complaint", label: "Complaint" },
  { value: "click", label: "Click" },
  { value: "other", label: "Other" },
];

const EVENT_BADGE: Record<string, string> = {
  send: "bg-blue-900/40   text-blue-300   border border-blue-700/40",
  delivery: "bg-green-900/40  text-green-300  border border-green-700/40",
  open: "bg-purple-900/40 text-purple-300 border border-purple-700/40",
  bounce: "bg-red-900/40    text-red-300    border border-red-700/40",
  complaint: "bg-orange-900/40 text-orange-300 border border-orange-700/40",
  click: "bg-cyan-900/40   text-cyan-300   border border-cyan-700/40",
  other: "bg-gray-800      text-gray-400   border border-gray-600",
};

const EMPTY_STATS: EmailEventStats = {
  send: 0,
  delivery: 0,
  open: 0,
  bounce: 0,
  complaint: 0,
  click: 0,
  other: 0,
  total: 0,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function pct(num: number, den: number): string {
  if (!den) return "";
  return ` (${Math.round((num / den) * 100)}%)`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  bg,
  border,
}: {
  label: string;
  value: number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <div
      className={`rounded-xl border ${border} ${bg} p-5 flex items-center gap-4`}
    >
      <div className={`rounded-lg p-2 ${bg} shrink-0`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {label}
        </p>
        <p className={`text-2xl font-bold ${color}`}>
          {value.toLocaleString()}
        </p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[180, 80, 70, 200, 110].map((w, i) => (
        <td key={i} className="px-6 py-3">
          <div className="h-3 bg-gray-700/60 rounded" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

// ── Main container ────────────────────────────────────────────────────────────

export function SesEmailAnalyticsContainer() {
  const [stats, setStats] = useState<EmailEventStats>(EMPTY_STATS);
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Filters (draft — committed on Search)
  const [recipient, setRecipient] = useState("");
  const [messageId, setMessageId] = useState("");
  const [eventType, setEventType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [applied, setApplied] = useState<ListEmailEventsParams>({});

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [countdown, setCountdown] = useState(AUTO_REFRESH_INTERVAL / 1000);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appliedRef = useRef<ListEmailEventsParams>({});

  // Keep appliedRef in sync so the auto-refresh closure stays current
  useEffect(() => {
    appliedRef.current = applied;
  }, [applied]);

  const fetchData = useCallback(
    async (params: ListEmailEventsParams, silent = false) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const [eventsData, statsData] = await Promise.all([
          emailEventsService.listEvents({ ...params, limit: 1000 }),
          emailEventsService.getStats({
            from_date: params.from_date,
            to_date: params.to_date,
          }),
        ]);
        setEvents(eventsData);
        setStats(statsData);
        setLastRefreshed(new Date());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load data");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  // Initial load
  useEffect(() => {
    fetchData({});
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    if (!autoRefresh) {
      setCountdown(AUTO_REFRESH_INTERVAL / 1000);
      return;
    }

    setCountdown(AUTO_REFRESH_INTERVAL / 1000);

    intervalRef.current = setInterval(() => {
      fetchData(appliedRef.current, true);
      setCountdown(AUTO_REFRESH_INTERVAL / 1000);
    }, AUTO_REFRESH_INTERVAL);

    countdownRef.current = setInterval(() => {
      setCountdown((c) => (c <= 1 ? AUTO_REFRESH_INTERVAL / 1000 : c - 1));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [autoRefresh, fetchData]);

  // Helpers
  const buildParams = (): ListEmailEventsParams => {
    const p: ListEmailEventsParams = {};
    if (recipient.trim()) p.primary_recipient = recipient.trim();
    if (messageId.trim()) p.message_id = messageId.trim();
    if (eventType) p.event_type = eventType;
    if (fromDate) p.from_date = new Date(fromDate).toISOString();
    if (toDate) p.to_date = new Date(toDate).toISOString();
    return p;
  };

  const handleSearch = () => {
    const p = buildParams();
    setApplied(p);
    setPage(1);
    fetchData(p);
  };

  const handleClear = () => {
    setRecipient("");
    setMessageId("");
    setEventType("");
    setFromDate("");
    setToDate("");
    setApplied({});
    setPage(1);
    fetchData({});
  };

  const handleRefresh = () => fetchData(applied, true);

  const hasFilters = !!(
    recipient ||
    messageId ||
    eventType ||
    fromDate ||
    toDate
  );

  // Pagination
  const totalPages = Math.max(1, Math.ceil(events.length / pageSize));
  const pageEvents = events.slice((page - 1) * pageSize, page * pageSize);
  const startRow = events.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRow = Math.min(page * pageSize, events.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">SES Email Analytics</h1>
          <p className="mt-1 text-sm text-gray-400">
            Track delivery, open, bounce, and complaint events for emails sent
            via AWS SES.
          </p>
        </div>

        {/* Refresh controls */}
        <div className="flex items-center gap-3 shrink-0">
          {lastRefreshed && (
            <span className="text-xs text-gray-500 hidden sm:block">
              Updated {relativeTime(lastRefreshed.toISOString())}
            </span>
          )}

          {/* Auto-refresh toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setAutoRefresh((v) => !v)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                autoRefresh ? "bg-blue-600" : "bg-gray-700"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  autoRefresh ? "translate-x-4" : "translate-x-1"
                }`}
              />
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {autoRefresh ? `Auto (${countdown}s)` : "Auto-refresh"}
            </span>
          </label>

          {/* Manual refresh */}
          <button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            title="Refresh"
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white text-sm px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard
          label="Sent"
          value={stats.send}
          icon={EnvelopeIcon}
          color="text-blue-400"
          bg="bg-blue-900/20"
          border="border-blue-700/40"
        />
        <StatCard
          label="Delivered"
          value={stats.delivery}
          sub={
            pct(stats.delivery, stats.send)
              ? `${pct(stats.delivery, stats.send)} of sent`
              : undefined
          }
          icon={CheckCircleIcon}
          color="text-green-400"
          bg="bg-green-900/20"
          border="border-green-700/40"
        />
        <StatCard
          label="Opens"
          value={stats.open}
          sub={
            pct(stats.open, stats.delivery)
              ? `${pct(stats.open, stats.delivery)} of delivered`
              : undefined
          }
          icon={ArrowTrendingUpIcon}
          color="text-purple-400"
          bg="bg-purple-900/20"
          border="border-purple-700/40"
        />
        <StatCard
          label="Bounces"
          value={stats.bounce}
          sub={
            pct(stats.bounce, stats.send)
              ? `${pct(stats.bounce, stats.send)} of sent`
              : undefined
          }
          icon={ExclamationTriangleIcon}
          color="text-red-400"
          bg="bg-red-900/20"
          border="border-red-700/40"
        />
        <StatCard
          label="Complaints"
          value={stats.complaint}
          sub={
            pct(stats.complaint, stats.delivery)
              ? `${pct(stats.complaint, stats.delivery)} of delivered`
              : undefined
          }
          icon={ShieldExclamationIcon}
          color="text-orange-400"
          bg="bg-orange-900/20"
          border="border-orange-700/40"
        />
        <StatCard
          label="Clicks"
          value={stats.click}
          sub={
            pct(stats.click, stats.delivery)
              ? `${pct(stats.click, stats.delivery)} of delivered`
              : undefined
          }
          icon={CursorArrowRaysIcon}
          color="text-cyan-400"
          bg="bg-cyan-900/20"
          border="border-cyan-700/40"
        />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <FunnelIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Filters</span>
          {Object.keys(applied).length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-blue-600/30 text-blue-300 border border-blue-600/40">
              {Object.keys(applied).length} active
            </span>
          )}
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
            placeholder="Message ID"
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
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
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
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-900/20 border border-red-700/40 px-4 py-3 text-sm text-red-300 flex items-center gap-2">
          <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 overflow-hidden">
        {/* Table header bar */}
        <div className="px-6 py-3 border-b border-gray-700/50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-white">Email Events</h2>
            {!loading && (
              <span className="text-xs text-gray-500">
                {events.length.toLocaleString()} total record
                {events.length !== 1 ? "s" : ""}
              </span>
            )}
            {refreshing && (
              <ArrowPathIcon className="h-3.5 w-3.5 text-blue-400 animate-spin" />
            )}
          </div>

          {/* Page size picker */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Rows</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {PAGE_SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700/50">
            <thead className="bg-gray-800/50">
              <tr>
                {[
                  "#",
                  "Recipient",
                  "Event",
                  "Provider",
                  "Message ID",
                  "Timestamp",
                ].map((col) => (
                  <th
                    key={col}
                    className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {loading ? (
                Array.from({ length: pageSize > 10 ? 8 : 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <EnvelopeIcon className="h-8 w-8 text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">
                      No email events found.
                    </p>
                    {Object.keys(applied).length > 0 && (
                      <button
                        onClick={handleClear}
                        className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                      >
                        Clear filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                pageEvents.map((ev, idx) => (
                  <tr
                    key={ev.id}
                    className="hover:bg-gray-800/40 transition-colors group"
                  >
                    <td className="px-5 py-3 text-xs text-gray-600 tabular-nums">
                      {(page - 1) * pageSize + idx + 1}
                    </td>
                    <td
                      className="px-5 py-3 text-sm text-gray-300 max-w-[180px] truncate"
                      title={ev.primary_recipient ?? ""}
                    >
                      {ev.primary_recipient ?? (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${EVENT_BADGE[ev.event_type] ?? EVENT_BADGE.other}`}
                      >
                        {ev.event_type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-400">
                      {ev.provider ?? <span className="text-gray-600">—</span>}
                    </td>
                    <td
                      className="px-5 py-3 text-xs text-gray-400 font-mono max-w-[200px] truncate"
                      title={ev.message_id ?? ""}
                    >
                      {ev.message_id ?? (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td
                      className="px-5 py-3 text-sm text-gray-400 whitespace-nowrap"
                      title={formatDate(ev.created_at)}
                    >
                      {relativeTime(ev.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {!loading && events.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-700/50 flex items-center justify-between gap-4">
            <span className="text-xs text-gray-500">
              {startRow}–{endRow} of {events.length.toLocaleString()}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-2 py-1 rounded text-xs text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                «
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>

              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                )
                .reduce<(number | "…")[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "…" ? (
                    <span
                      key={`ellipsis-${i}`}
                      className="px-2 py-1 text-xs text-gray-600"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        page === p
                          ? "bg-blue-600 text-white"
                          : "text-gray-400 hover:text-white hover:bg-gray-700"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="px-2 py-1 rounded text-xs text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
