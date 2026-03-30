import React from "react";

interface P {
  content: string | React.ReactNode;
}

export function EmptyScreen(P: P) {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col items-center gap-2 rounded-lg border bg-background p-8 shadow-sm">
        {P.content}
      </div>
    </div>
  );
}
