import { apiGet } from "./lib/api";

export interface KbStats {
  index_name: string;
  namespace: string;
  index_dimension: number;
  index_metric: string;
  index_pods: number;
  index_replicas: number;
  index_shards: number;
  total_vector_count: number;
  namespaces: Record<string, any>;
  namespace_vector_count: number;
  error?: string;
}

export async function callGetSimilaritySearchKbStats(): Promise<KbStats> {
  return apiGet<KbStats>(`/api/similarity-search/kb-stats`);
}
