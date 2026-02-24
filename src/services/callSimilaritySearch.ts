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

  const url = new URL(
    `${process.env.NEXT_PUBLIC_AI_API_URL}/api/similarity-search/search`
  );
  if (namespace) {
    url.searchParams.set("namespace", namespace);
  }

  const resp = await fetch(url.toString(), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, top_k, similarity_threshold }),
  });

  if (!resp.ok) {
    throw new Error(`HTTP error status: ${resp.status}`);
  }

  return resp.json();
}
