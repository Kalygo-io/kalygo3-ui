"use client";

import { cn } from "@/shared/utils";

interface ToolStatusProps extends React.ComponentProps<"div"> {
  currentTool: string;
}

export function ToolStatus({ currentTool, className, ...props }: ToolStatusProps) {
  console.log("[Concierge] ToolStatus - currentTool:", currentTool);

  if (!currentTool) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 text-sm font-medium text-purple-400 mt-2",
        className
      )}
      {...props}
    >
      <span className="animate-pulse">🔧</span>
      <span>Using tool: {currentTool}</span>
    </div>
  );
}
