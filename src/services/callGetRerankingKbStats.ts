import { apiGet } from "./lib/api";

export interface KbStats {
  index_name: string;
  index_dimension: number;
  namespace: string;
  namespace_vector_count: number;
}

export async function callGetRerankingKbStats(): Promise<KbStats> {
  return apiGet<KbStats>(`/api/reranking/kb-stats`);
}
