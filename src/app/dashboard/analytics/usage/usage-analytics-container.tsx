"use client";

import { CpuChipIcon, ChatBubbleLeftRightIcon, WrenchScrewdriverIcon, CircleStackIcon } from "@heroicons/react/24/outline";

const STAT_CARDS = [
  {
    label: "Agent Completions",
    value: "—",
    icon: CpuChipIcon,
    color: "text-blue-400",
    bg: "bg-blue-900/20",
    border: "border-blue-700/40",
  },
  {
    label: "Chat Sessions",
    value: "—",
    icon: ChatBubbleLeftRightIcon,
    color: "text-green-400",
    bg: "bg-green-900/20",
    border: "border-green-700/40",
  },
  {
    label: "Tool Calls",
    value: "—",
    icon: WrenchScrewdriverIcon,
    color: "text-purple-400",
    bg: "bg-purple-900/20",
    border: "border-purple-700/40",
  },
  {
    label: "Vector Searches",
    value: "—",
    icon: CircleStackIcon,
    color: "text-orange-400",
    bg: "bg-orange-900/20",
    border: "border-orange-700/40",
  },
];

export function UsageAnalyticsContainer() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Usage Analytics</h1>
        <p className="mt-1 text-sm text-gray-400">
          Monitor platform activity including agent completions, chat sessions, and tool usage.
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

      {/* Placeholder breakdown table */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700/50">
          <h2 className="text-sm font-semibold text-white">Activity Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700/50">
            <thead className="bg-gray-800/50">
              <tr>
                {["Category", "Count", "Last Activity"].map((col) => (
                  <th
                    key={col}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-gray-500 text-sm">
                  Usage data coming soon.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
