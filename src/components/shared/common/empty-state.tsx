import React from "react";

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

/**
 * Empty-list / "nothing here yet" placeholder card.
 *
 * Consolidates the icon + title + description + CTA block duplicated 30+ times
 * across the dashboard (4× inside contact-detail-container alone).
 *
 * Two sizes mirror the two variants found in the codebase:
 *   - "md" (default): top-level list pages — p-12, h-16 icon, text-lg title
 *   - "sm": nested section cards — p-10, h-12 icon, regular title
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = "md",
  className = "",
}: {
  icon?: IconComponent;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Optional CTA element (button/link) rendered under the description. */
  action?: React.ReactNode;
  size?: "sm" | "md";
  className?: string;
}) {
  const isSm = size === "sm";
  return (
    <div
      className={`bg-gray-800/50 border border-gray-700/50 rounded-xl text-center ${
        isSm ? "p-10" : "p-12"
      } ${className}`}
    >
      {Icon && (
        <Icon
          className={`text-gray-600 mx-auto ${
            isSm ? "h-12 w-12 mb-3" : "h-16 w-16 mb-4"
          }`}
        />
      )}
      <p className={`text-gray-400 mb-2 ${isSm ? "" : "text-lg"}`}>{title}</p>
      {description && (
        <p className={`text-gray-500 text-sm ${isSm ? "mb-5" : "mb-6"}`}>
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
