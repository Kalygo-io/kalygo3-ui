import { apiDelete } from "./lib/api";

export interface DeleteVectorsResponse {
  success: boolean;
  error?: string;
  deleted_count?: number;
}

export async function callDeleteRerankingVectorsInNamespace(
  namespace: string
): Promise<DeleteVectorsResponse> {
  return apiDelete<DeleteVectorsResponse>(
    `/api/reranking/delete-vectors`,
    { namespace },
  );
}
