"use client";

const TEMPLATE_VARIABLES = [
  { name: "current_time", description: "Current time in UTC (e.g. 14:30 UTC)" },
  { name: "current_date", description: "Current date (e.g. 2026-02-15)" },
  { name: "current_datetime", description: "Full ISO datetime" },
  { name: "current_day_of_week", description: "Day of the week (e.g. Saturday)" },
  { name: "agent_name", description: "The agent's name" },
];

interface TemplateVariableHintProps {
  onInsert: (variable: string) => void;
}

export function TemplateVariableHint({ onInsert }: TemplateVariableHintProps) {
  return (
    <div className="mt-2 space-y-1.5">
      <p className="text-gray-400 text-xs">
        The system prompt that defines the agent&apos;s behavior and
        personality. Supports template variables that are resolved at runtime:
      </p>
      <div className="flex flex-wrap gap-1.5">
        {TEMPLATE_VARIABLES.map((v) => (
          <button
            key={v.name}
            type="button"
            onClick={() => onInsert(`{{ ${v.name} }}`)}
            title={v.description}
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-gray-700/60 text-blue-300 border border-gray-600/50 hover:bg-gray-600/60 hover:text-blue-200 transition-colors cursor-pointer"
          >
            {"{{ "}
            {v.name}
            {" }}"}
          </button>
        ))}
      </div>
    </div>
  );
}
