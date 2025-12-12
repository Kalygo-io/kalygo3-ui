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

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6
        transition-all duration-200 cursor-pointer
        hover:shadow-lg hover:scale-[1.02] hover:border-blue-500/50
        ${isComingSoon ? "opacity-60 cursor-not-allowed" : ""}
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
      {description && <p className="text-sm text-gray-400">{description}</p>}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-semibold text-white mb-8">Apps</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Kalygo Agent Card */}
            <AppCard
              title="Kalygo Agent"
              description="Intelligent AI agent for conversational interactions and task automation."
              href="/dashboard/kalygo-agent"
            />

            {/* Cliff Notes Generator Card */}
            <AppCard
              title="Cliff Notes Generator"
              description="Generate concise summaries and key insights from long-form content."
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
