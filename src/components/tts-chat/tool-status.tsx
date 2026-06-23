"use client";

import { ToolStatus } from "@/components/shared/chat/tool-status";

interface ToolStatusProps {
  currentTool: string;
  className?: string;
}

export function TtsToolStatus({ currentTool, className }: ToolStatusProps) {
  return (
    <ToolStatus
      currentTool={currentTool}
      accent="purple"
      variant="label"
      className={className}
    />
  );
}
