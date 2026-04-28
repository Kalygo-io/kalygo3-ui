"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { agentsService, Agent } from "@/services/agentsService";
import { contactsService, Contact } from "@/services/contactsService";
import { vectorStoresService } from "@/services/vectorStoresService";
import {
  CpuChipIcon,
  UserGroupIcon,
  CircleStackIcon,
  ArrowRightIcon,
  PlusIcon,
  ChevronRightIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashboardData {
  agents: Agent[];
  contacts: Contact[];
  indexCount: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusBadgeClass(status?: string) {
  switch (status) {
    case "customer":
      return "bg-emerald-700/40 text-emerald-300 border-emerald-600/50";
    case "prospect":
      return "bg-blue-700/40 text-blue-300 border-blue-600/50";
    case "lead":
      return "bg-amber-700/40 text-amber-300 border-amber-600/50";
    case "churned":
      return "bg-red-700/40 text-red-300 border-red-600/50";
    default:
      return "bg-gray-700/40 text-gray-400 border-gray-600/50";
  }
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  sublabel,
  href,
  actionLabel,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  label: string;
  value: number | string;
  sublabel?: string;
  href: string;
  actionLabel: string;
}) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      className="group relative bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 text-left hover:border-gray-500/60 hover:bg-gray-800/80 transition-all duration-200 hover:shadow-xl hover:shadow-black/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`h-12 w-12 rounded-xl ${iconBg} flex items-center justify-center`}
        >
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <ChevronRightIcon className="h-4 w-4 text-gray-600 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all duration-200 mt-1" />
      </div>
      <p className="text-4xl font-bold text-white mb-1 tabular-nums">{value}</p>
      <p className="text-sm font-medium text-gray-300">{label}</p>
      {sublabel && <p className="text-xs text-gray-500 mt-0.5">{sublabel}</p>}
      <p className="text-xs text-blue-400 mt-4 group-hover:text-blue-300 transition-colors flex items-center gap-1">
        {actionLabel}
        <ArrowRightIcon className="h-3 w-3 group-hover:translate-x-0.5 transition-transform duration-200" />
      </p>
    </button>
  );
}

function QuickAction({
  icon: Icon,
  label,
  description,
  href,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  href: string;
  accent: string;
}) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      className="group flex items-center gap-4 bg-gray-800/30 border border-gray-700/40 rounded-xl p-4 text-left hover:bg-gray-800/60 hover:border-gray-600/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
    >
      <div
        className={`h-10 w-10 rounded-lg ${accent} flex items-center justify-center flex-shrink-0`}
      >
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-white group-hover:text-gray-100">
          {label}
        </p>
        <p className="text-xs text-gray-500 truncate">{description}</p>
      </div>
      <ChevronRightIcon className="h-4 w-4 text-gray-600 group-hover:text-gray-400 ml-auto flex-shrink-0 group-hover:translate-x-0.5 transition-all duration-200" />
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function HomeContainer() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [agents, contacts, indexes] = await Promise.allSettled([
          agentsService.listAgents(),
          contactsService.listContacts(),
          vectorStoresService.listIndexes(),
        ]);
        setData({
          agents: agents.status === "fulfilled" ? agents.value : [],
          contacts: contacts.status === "fulfilled" ? contacts.value : [],
          indexCount: indexes.status === "fulfilled" ? indexes.value.length : 0,
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Contact status breakdown ──────────────────────────────────────────────

  const contactsByStatus = data
    ? (["lead", "prospect", "customer", "churned"] as const)
        .map((status) => ({
          status,
          count: data.contacts.filter((c) => c.status === status).length,
        }))
        .filter((s) => s.count > 0)
    : [];

  const unstagedContacts = data
    ? data.contacts.filter((c) => !c.status).length
    : 0;

  // ── Skeleton loader ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-20 bg-gray-800/50 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-44 bg-gray-800/50 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-gray-800/50 rounded-2xl" />
      </div>
    );
  }

  const hasAnyData =
    (data?.agents.length ?? 0) > 0 ||
    (data?.contacts.length ?? 0) > 0 ||
    (data?.indexCount ?? 0) > 0;

  return (
    <div className="space-y-8">
      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-blue-900/30 via-gray-800/40 to-purple-900/20 border border-gray-700/50 rounded-2xl px-8 py-7">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <SparklesIcon className="h-5 w-5 text-blue-400" />
              <p className="text-sm font-medium text-blue-300">
                {getGreeting()}
              </p>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Your CRM Overview
            </h1>
            <p className="text-gray-400 text-sm max-w-lg">
              A snapshot of your account — agents, contacts, and knowledge bases
              at a glance.
            </p>
          </div>
          <div className="text-right text-sm text-gray-500">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          icon={CpuChipIcon}
          iconBg="bg-blue-600/20 border border-blue-500/30"
          iconColor="text-blue-400"
          label="Agents"
          value={data?.agents.length ?? 0}
          sublabel="AI agents configured"
          href="/dashboard/agents"
          actionLabel="Manage agents"
        />
        <StatCard
          icon={UserGroupIcon}
          iconBg="bg-emerald-600/20 border border-emerald-500/30"
          iconColor="text-emerald-400"
          label="Contacts"
          value={data?.contacts.length ?? 0}
          sublabel="People in your CRM"
          href="/dashboard/contacts"
          actionLabel="View contacts"
        />
        <StatCard
          icon={CircleStackIcon}
          iconBg="bg-purple-600/20 border border-purple-500/30"
          iconColor="text-purple-400"
          label="Vector Indexes"
          value={data?.indexCount ?? 0}
          sublabel="Knowledge bases indexed"
          href="/dashboard/vector-stores"
          actionLabel="Explore knowledge bases"
        />
      </div>

      {/* ── Lower section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact breakdown */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-white">
              Contacts by Status
            </h2>
            <button
              onClick={() => router.push("/dashboard/contacts")}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              View all
              <ArrowRightIcon className="h-3 w-3" />
            </button>
          </div>

          {(data?.contacts.length ?? 0) === 0 ? (
            <div className="text-center py-8">
              <UserGroupIcon className="h-10 w-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm mb-4">No contacts yet</p>
              <button
                onClick={() => router.push("/dashboard/contacts")}
                className="inline-flex items-center gap-2 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Add your first contact
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {contactsByStatus.map(({ status, count }) => (
                <div key={status} className="flex items-center gap-3">
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border w-24 justify-center flex-shrink-0 ${statusBadgeClass(status)}`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                  <div className="flex-1 h-2 bg-gray-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500/60 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.round((count / (data?.contacts.length ?? 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-300 w-8 text-right tabular-nums">
                    {count}
                  </span>
                </div>
              ))}
              {unstagedContacts > 0 && (
                <div className="flex items-center gap-3">
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border w-24 justify-center flex-shrink-0 bg-gray-700/40 text-gray-400 border-gray-600/50">
                    Untagged
                  </span>
                  <div className="flex-1 h-2 bg-gray-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-500/60 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.round((unstagedContacts / (data?.contacts.length ?? 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-300 w-8 text-right tabular-nums">
                    {unstagedContacts}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent agents + quick actions */}
        <div className="space-y-6">
          {/* Recent agents */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">
                Recent Agents
              </h2>
              <button
                onClick={() => router.push("/dashboard/agents")}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                View all
                <ArrowRightIcon className="h-3 w-3" />
              </button>
            </div>

            {(data?.agents.length ?? 0) === 0 ? (
              <div className="text-center py-6">
                <CpuChipIcon className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm mb-4">No agents yet</p>
                <button
                  onClick={() => router.push("/dashboard/agents")}
                  className="inline-flex items-center gap-2 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Create your first agent
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {(data?.agents ?? []).slice(0, 4).map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => router.push("/dashboard/agent-chat")}
                    className="group w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-700/40 transition-colors text-left"
                  >
                    <div className="h-8 w-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                      <CpuChipIcon className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate group-hover:text-white">
                        {agent.name}
                      </p>
                      <p className="text-xs text-gray-500">Agent #{agent.id}</p>
                    </div>
                    <ChevronRightIcon className="h-3.5 w-3.5 text-gray-600 group-hover:text-gray-400 ml-auto flex-shrink-0" />
                  </button>
                ))}
                {(data?.agents.length ?? 0) > 4 && (
                  <p className="text-xs text-gray-500 text-center pt-1">
                    +{(data?.agents.length ?? 0) - 4} more agents
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-4">
              Quick Actions
            </h2>
            <div className="space-y-2">
              <QuickAction
                icon={CpuChipIcon}
                label="Start Agent Chat"
                description="Chat with one of your configured agents"
                href="/dashboard/agent-chat"
                accent="bg-blue-600"
              />
              <QuickAction
                icon={UserGroupIcon}
                label="Add a Contact"
                description="Grow your CRM with a new contact"
                href="/dashboard/contacts"
                accent="bg-emerald-600"
              />
              <QuickAction
                icon={CircleStackIcon}
                label="Browse Knowledge Bases"
                description="Manage your knowledge base indexes"
                href="/dashboard/vector-stores"
                accent="bg-purple-600"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
