"use client";

import {
  MagnifyingGlassIcon,
  CircleStackIcon,
  PencilSquareIcon,
  EnvelopeIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType } from "react";
import { AgentTool, TOOL_TYPE_METADATA } from "@/services/agentsService";

// Icon map is the only place in the codebase that maps tool type → icon.
// All rendering components use this via ToolDisplayCard.
const TOOL_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  vectorSearch: MagnifyingGlassIcon,
  vectorSearchWithReranking: MagnifyingGlassIcon,
  dbTableRead: CircleStackIcon,
  dbTableWrite: PencilSquareIcon,
  sendTxtEmailWithSes: EnvelopeIcon,
};

interface ToolDisplayCardProps {
  tool: AgentTool;
}

export function ToolDisplayCard({ tool }: ToolDisplayCardProps) {
  const meta = TOOL_TYPE_METADATA[tool.type];
  const Icon = TOOL_ICONS[tool.type] ?? QuestionMarkCircleIcon;

  if (!meta) {
    return (
      <div className="bg-gray-900/50 p-2 rounded border border-gray-700/50">
        <span className="text-xs text-gray-400">{(tool as any).type ?? "Unknown Tool"}</span>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900/50 p-2 rounded border ${meta.borderClass}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 flex-shrink-0 ${meta.iconClass}`} />
        <span className="text-xs font-medium text-white">{meta.label}</span>
      </div>
      <p className={`text-xs pl-6 ${meta.iconClass}`}>{meta.summary(tool)}</p>
      {tool.description && (
        <p className="text-xs text-gray-400 pl-6 mt-0.5 truncate" title={tool.description}>
          {tool.description}
        </p>
      )}
    </div>
  );
}
