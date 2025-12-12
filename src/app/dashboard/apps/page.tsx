"use client";

import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import React, { Suspense } from "react";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

interface AppCardProps {
  title: string;
  description?: string;
  href?: string;
  isComingSoon?: boolean;
  onClick?: () => void;
}

function AppCard({
  title,
  description,
  href,
  isComingSoon,
  onClick,
}: AppCardProps) {
  const router = useRouter();

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    }
  };

  return (
    <div
      className={`
        bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6
        transition-all duration-200
        hover:shadow-lg hover:border-gray-600/50
        flex flex-col
        ${isComingSoon ? "opacity-60" : ""}
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        {isComingSoon && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-600/20 text-yellow-300 border border-yellow-500/40">
            Coming Soon
          </span>
        )}
      </div>
      {description && (
        <p className="text-sm text-gray-400 mb-4 flex-1">{description}</p>
      )}
      {!isComingSoon && (href || onClick) && (
        <button
          onClick={handleOpen}
          className="mt-auto w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          Open
        </button>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-semibold text-white mb-8">Playground</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Kalygo Agent Card */}
            <AppCard
              title="Kalygo Agent"
              description="ReAct LLM agent for conversational interactions with a configurable set of tools."
              href="/dashboard/kalygo-agent"
            />

            {/* Cliff Notes Generator Card */}
            <AppCard
              title="Cliff Notes Generator"
              description="Generate customizable summaries and key insights from vast amounts of data."
              isComingSoon={true}
            />

            {/* LLM Arbitration Card */}
            <AppCard
              title="LLM Arbitration"
              description="Use an LLM to settle a dispute between two or more parties."
              isComingSoon={true}
            />
          </div>
        </div>
      </DashboardLayout>
    </Suspense>
  );
}
