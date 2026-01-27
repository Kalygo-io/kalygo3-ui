import {
  VectorSearchToolCall,
  VectorSearchWithRerankingToolCall,
  DbReadToolCall,
  TextDocumentMetadata,
  QaMetadata,
} from "@/ts/types/ChatMessage";

/**
 * Type guard to check if metadata is TextDocumentMetadata
 */
export function isTextDocumentMetadata(
  metadata: TextDocumentMetadata | QaMetadata
): metadata is TextDocumentMetadata {
  return "chunkId" in metadata && "totalChunks" in metadata;
}

/**
 * Type guard to check if metadata is QaMetadata
 */
export function isQaMetadata(
  metadata: TextDocumentMetadata | QaMetadata
): metadata is QaMetadata {
  return "q" in metadata && "a" in metadata && "row_number" in metadata;
}

/**
 * Union type for all tool calls
 */
export type AnyToolCall = VectorSearchToolCall | VectorSearchWithRerankingToolCall | DbReadToolCall;

/**
 * Type guard to check if tool call is VectorSearchToolCall
 */
export function isVectorSearchToolCall(
  call: AnyToolCall
): call is VectorSearchToolCall {
  return call.toolType === "vectorSearch";
}

/**
 * Type guard to check if tool call is VectorSearchWithRerankingToolCall
 */
export function isVectorSearchWithRerankingToolCall(
  call: AnyToolCall
): call is VectorSearchWithRerankingToolCall {
  return call.toolType === "vectorSearchWithReranking";
}

/**
 * Type guard to check if tool call is DbReadToolCall
 */
export function isDbReadToolCall(
  call: AnyToolCall
): call is DbReadToolCall {
  return call.toolType === "dbRead";
}

/**
 * Format timestamp from milliseconds string to readable date
 */
export function formatTimestamp(timestampMs: string): string {
  try {
    return new Date(parseInt(timestampMs)).toLocaleDateString();
  } catch {
    return timestampMs;
  }
}

/**
 * Format timestamp from milliseconds string to readable date and time
 */
export function formatTimestampWithTime(timestampMs: string): string {
  try {
    return new Date(parseInt(timestampMs)).toLocaleString();
  } catch {
    return timestampMs;
  }
}

/**
 * Get filename from metadata, handling different possible field names
 */
export function getFilenameFromMetadata(
  metadata: TextDocumentMetadata | QaMetadata
): string {
  return metadata.filename || "Unknown File";
}

/**
 * Format score as percentage
 */
export function formatScore(score: number): string {
  return `${(score * 100).toFixed(1)}%`;
}

/**
 * Get tool type display name
 */
export function getToolTypeDisplayName(
  toolType: "vectorSearch" | "vectorSearchWithReranking" | "dbRead"
): string {
  switch (toolType) {
    case "vectorSearch":
      return "Vector Search";
    case "vectorSearchWithReranking":
      return "Vector Search with Reranking";
    case "dbRead":
      return "Database Query";
    default:
      return toolType;
  }
}

/**
 * Format table name for display (convert snake_case to Title Case)
 */
export function formatTableName(tableName: string): string {
  return tableName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Extract custom YAML front matter fields from metadata
 */
export function getCustomFields(
  metadata: TextDocumentMetadata
): Record<string, string | number> {
  const customFields: Record<string, string | number> = {};
  
  Object.keys(metadata).forEach((key) => {
    if (key.startsWith("file_")) {
      customFields[key] = (metadata as any)[key];
    }
  });
  
  return customFields;
}

/**
 * Format custom field name for display
 */
export function formatCustomFieldName(fieldName: string): string {
  return fieldName
    .replace("file_", "")
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
