export interface Message {
  id: string;
  content: string;
  role: "human" | "ai";
  error: any;
  parallelGroupId?: string;
  blocks?: Message[];
  rerankedMatches?: RerankedMatch[];
  kb_search_query?: string;
  retrievalCalls?: RetrievalCall[]; // Legacy - kept for backward compatibility
  toolCalls?: ToolCall[]; // New schema-based tool calls
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
