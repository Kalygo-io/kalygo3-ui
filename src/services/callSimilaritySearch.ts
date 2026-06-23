import { apiPost } from "./lib/api";

export interface SimilaritySearchResultMetadata {
  prompt_id: number;
  account_id: number;
  name: string;
  description: string;
  content: string;
  type: string;
}

export interface SimilaritySearchResult {
  metadata: SimilaritySearchResultMetadata;
  score: number;
}

export interface SimilaritySearchResponse {
  success: boolean;
  results: SimilaritySearchResult[];
  error?: string;
}

export interface SimilaritySearchParams {
  query: string;
  top_k?: number;
  similarity_threshold?: number;
  namespace?: string;
}

export async function callSimilaritySearch(
  params: SimilaritySearchParams
): Promise<SimilaritySearchResponse> {
  const { query, top_k = 5, similarity_threshold = 0, namespace } = params;

  return apiPost<SimilaritySearchResponse>(
    `/api/similarity-search/search`,
    { query, top_k, similarity_threshold },
    { query: { namespace } },
  );
}
