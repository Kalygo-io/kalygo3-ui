export interface Message {
  id: string;
  content: string;
  role: "human" | "ai" | "tool_approval";
  error: ErrorDetails | null;
  rerankedMatches?: RerankedMatch[];
  kb_search_query?: string;
  retrievalCalls?: RetrievalCall[]; // Legacy - kept for backward compatibility
  toolCalls?: ToolCall[]; // New schema-based tool calls
  /** Set when role === "tool_approval" */
  toolApproval?: ToolApprovalMessage;
}

export interface ToolApprovalMessage {
  approvalId: number;
  toolType: string;
  /** resolved status after the user acts; undefined while pending */
  resolvedStatus?: "approved" | "rejected" | "expired";
  preview: {
    from_email?: string;
    to_email: string;
    subject: string;
    /** Plain-text body (sendTxtEmail* tools) */
    body?: string;
    /** Agent-authored / template-rendered HTML body (sendHtmlEmailWithSes) */
    html_body?: string;
    /** Template metadata (sendTemplateEmailWithSes) */
    template_name?: string;
    variables?: Record<string, string>;
  };
}

export interface ErrorDetails {
  error: string; // Short error title (e.g., "Internal server error")
  message: string; // Detailed error message
  timestamp?: number; // When the error occurred
  stack?: string; // Stack trace if available
}

export interface RetrievalCall {
  query: string;
  reranked_results: RerankedMatch[];
  similarity_results: any[];
  message: string;
  namespace: string;
}

export interface RerankedMatch {
  chunk_id: string;
  total_chunks: number;
  score: number;
  relevance_score: number;
  similarity_score: number;
  content: string;
  filename?: string;
  kb_search_query?: string;
}

// New schema-based tool call types
export interface ToolCall {
  name: string; // e.g., "retrieval with re-ranking"
  query: string;
  namespace: string;
  index: string;
  results: RetrievalResult[];
}

export interface RetrievalResult {
  chunk_id: string;
  score: number;
  content: string;
  metadata?: Record<string, any>;
}
