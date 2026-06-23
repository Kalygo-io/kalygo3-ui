/**
 * Shared score -> color helpers for the ML "search demo" pages
 * (reranking, similarity-search, hybrid-search, multimodal, prompts, ...).
 *
 * IMPORTANT: the original pages used SIX divergent color schemes with different
 * tier counts, thresholds, and return types (hex strings vs. Tailwind classes
 * vs. {bg,border,text} objects). These were NOT unified, because doing so would
 * change the on-screen colors per page. Instead each distinct scheme is exported
 * here as a single named function so the duplication is removed while every
 * page keeps its exact prior behavior. Pick the variant that matches the page.
 */

/**
 * 8-tier hex ramp (green -> yellow -> orange -> red), keyed off a 0-100 score
 * percentage. Used by the reranking page's mobile "preview" score text.
 */
export function scoreColorHex8(scorePercentage: number): string {
  if (scorePercentage >= 90) return "#10b981"; // green-500
  if (scorePercentage >= 80) return "#34d399"; // green-400
  if (scorePercentage >= 70) return "#6ee7b7"; // green-300
  if (scorePercentage >= 60) return "#fbbf24"; // yellow-400
  if (scorePercentage >= 50) return "#fb923c"; // orange-400
  if (scorePercentage >= 40) return "#f97316"; // orange-500
  if (scorePercentage >= 30) return "#f87171"; // red-400
  return "#ef4444"; // red-500
}

export interface ScoreBadgeColor {
  bg: string;
  border: string;
  text: string;
}

/**
 * 5-tier score-badge palette (background / border / text), keyed off a 0-100
 * score percentage. Shared by the reranking and similarity-search result cards.
 */
export function scoreBadgeColor(scorePercentage: number): ScoreBadgeColor {
  if (scorePercentage >= 70)
    return {
      bg: "rgba(34, 197, 94, 0.2)",
      border: "rgba(34, 197, 94, 0.4)",
      text: "#4ade80",
    };
  if (scorePercentage >= 60)
    return {
      bg: "rgba(234, 179, 8, 0.2)",
      border: "rgba(234, 179, 8, 0.4)",
      text: "#facc15",
    };
  if (scorePercentage >= 50)
    return {
      bg: "rgba(249, 115, 22, 0.2)",
      border: "rgba(249, 115, 22, 0.4)",
      text: "#fb923c",
    };
  if (scorePercentage >= 40)
    return {
      bg: "rgba(239, 68, 68, 0.2)",
      border: "rgba(239, 68, 68, 0.4)",
      text: "#f87171",
    };
  return {
    bg: "rgba(107, 114, 128, 0.2)",
    border: "rgba(107, 114, 128, 0.4)",
    text: "#9ca3af",
  };
}

/**
 * 3-tier Tailwind text-color class, keyed off a 0-100 score percentage
 * (>= 80 green, >= 60 yellow, else red). Used by the hybrid-search page.
 */
export function scoreColorClass3(score: number): string {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  return "text-red-400";
}
