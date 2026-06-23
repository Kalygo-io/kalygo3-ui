"use client";

import { cn } from "@/shared/utils";
import { ChatAccent } from "@/components/shared/chat/accent";

interface ToolStatusProps extends React.ComponentProps<"div"> {
  currentTool: string;
  accent?: ChatAccent;
  /**
   * "plain" = agent-chat behavior (DEFAULT): right-aligned bold `{currentTool}`.
   * "label" = tts behavior: centered `🔧 Using tool: {currentTool}` with a
   * null-guard, in the accent color (purple).
   */
  variant?: "plain" | "label";
}

export function ToolStatus({
  currentTool,
  accent = "blue",
  variant = "plain",
  className,
  ...props
}: ToolStatusProps) {
  if (variant === "label") {
    if (!currentTool) return null;

    const textColor = accent === "purple" ? "text-purple-400" : "text-blue-400";

    return (
      <div
        className={cn(
          "flex items-center justify-center gap-2 text-sm font-medium mt-2",
          textColor,
          className
        )}
        {...props}
      >
        <span className="animate-pulse">🔧</span>
        <span>Using tool: {currentTool}</span>
      </div>
    );
  }

  // "plain" — agent-chat behavior
  return (
    <div
      className={cn(
        "flex items-center justify-end transition-opacity font-bold text-text_default_color"
      )}
    >
      {currentTool}
    </div>
  );
}
