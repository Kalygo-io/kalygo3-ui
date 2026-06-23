import React from "react";

/**
 * Centered full-section loading placeholder.
 *
 * Replaces the hand-rolled
 *   <div className="flex items-center justify-center min-h-[400px]">
 *     <div className="text-gray-400">Loading …</div>
 *   </div>
 * block duplicated across ~20 dashboard containers.
 */
export function PageLoading({
  label = "Loading…",
  className = "min-h-[400px]",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="text-gray-400">{label}</div>
    </div>
  );
}
