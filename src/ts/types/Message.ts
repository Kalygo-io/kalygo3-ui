export interface Message {
  id: string;
  content: string;
  role: "human" | "ai";
  error: ErrorDetails | null;
  /** For swarm/hierarchical chat: which agent (e.g. Director, worker name) produced this message */
  agentName?: string;
  /** When set, this message is a moderator/supervisor decision row: chosenAgent + reason for tooltip */
  supervisorDecision?: { chosenAgent: string; reason: string };
  /** When set, this message marks why the swarm ended the current turn chain */
  turnStopDecision?: { done: boolean; reason: string };
  parallelGroupId?: string;
  blocks?: Message[];
  rerankedMatches?: RerankedMatch[];
  kb_search_query?: string;
  retrievalCalls?: RetrievalCall[]; // Legacy - kept for backward compatibility
  toolCalls?: ToolCall[]; // New schema-based tool calls
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
