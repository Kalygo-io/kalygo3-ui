"use client";

import { cn } from "@/shared/utils";

interface P extends React.ComponentProps<"div"> {
  currentTool: string;
}

export function ToolStatus(P: P) {
  console.log("P", P);

  return (
    <div
      className={cn(
        "flex items-center justify-end transition-opacity font-bold text-text_default_color"
      )}
    >
      {P.currentTool}
    </div>
  );
}
