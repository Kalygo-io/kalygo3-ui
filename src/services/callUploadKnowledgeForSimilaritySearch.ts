import { apiPost } from "./lib/api";

export interface UploadResponse {
  filename: string;
  total_chunks_created: number;
  successful_uploads: number;
  failed_uploads: number;
  namespace: string;
  file_size_bytes: number;
  success: boolean;
  error?: string;
}

export async function callUploadKnowledgeForSimilaritySearch(
  file: File
): Promise<UploadResponse> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    return await apiPost<UploadResponse>(
      "/api/similarity-search/upload-single",
      formData
    );
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}
