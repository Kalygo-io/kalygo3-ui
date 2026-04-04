"use client";

import { EnvelopeIcon, ArrowTrendingUpIcon, ExclamationTriangleIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

const STAT_CARDS = [
  {
    label: "Sent",
    value: "—",
    icon: EnvelopeIcon,
    color: "text-blue-400",
    bg: "bg-blue-900/20",
    border: "border-blue-700/40",
  },
  {
    label: "Delivered",
    value: "—",
    icon: CheckCircleIcon,
    color: "text-green-400",
    bg: "bg-green-900/20",
    border: "border-green-700/40",
  },
  {
    label: "Opens",
    value: "—",
    icon: ArrowTrendingUpIcon,
    color: "text-purple-400",
    bg: "bg-purple-900/20",
    border: "border-purple-700/40",
  },
  {
    label: "Bounces",
    value: "—",
    icon: ExclamationTriangleIcon,
    color: "text-red-400",
    bg: "bg-red-900/20",
    border: "border-red-700/40",
  },
];

export function SesEmailAnalyticsContainer() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">SES Email Analytics</h1>
        <p className="mt-1 text-sm text-gray-400">
          Track delivery, open, bounce, and complaint events for emails sent via AWS SES.
        </p>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border ${card.border} ${card.bg} p-5 flex items-center gap-4`}
          >
            <div className={`rounded-lg p-2 ${card.bg}`}>
              <card.icon className={`h-6 w-6 ${card.color}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                {card.label}
              </p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Event log table placeholder */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700/50">
          <h2 className="text-sm font-semibold text-white">Recent Events</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700/50">
            <thead className="bg-gray-800/50">
              <tr>
                {["Recipient", "Event", "Provider Message ID", "Provider", "Timestamp"].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500 text-sm">
                  No email events recorded yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
