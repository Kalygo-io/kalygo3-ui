import { apiDelete } from "./lib/api";

export interface DeleteVectorsResponse {
  success: boolean;
  deleted_count?: number;
  namespace: string;
  error?: string;
}

export async function callDeleteSimilaritySearchVectorsInNamespace(
  namespace: string
): Promise<DeleteVectorsResponse> {
  return apiDelete<DeleteVectorsResponse>(
    `/api/similarity-search/delete-vectors`,
    { namespace },
  );
}
