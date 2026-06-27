import { apiGet, apiPost, apiDelete } from "./lib/api";

export interface Index {
  name: string;
  dimension?: number;
  metric?: string;
  pods?: number;
  replicas?: number;
  pod_type?: string;
  status?: Record<string, any>;
}

export interface Namespace {
  namespace: string;
  vector_count?: number;
}

export interface NamespaceFile {
  filename: string;
  vector_count: number;
}

export interface NamespaceFilesResponse {
  index_name: string;
  namespace: string;
  total_vectors: number;
  scanned_vectors: number;
  truncated: boolean;
  source: "pinecone" | "ingestion_log";
  files: NamespaceFile[];
}

export interface CreateIndexRequest {
  name: string;
  dimension: number;
  metric?: string;
  pods?: number;
  replicas?: number;
  pod_type?: string;
}

export interface CreateNamespaceRequest {
  namespace: string;
}

export interface UploadResponse {
  success: boolean;
  message?: string;
  error?: string;
  log_id?: string;
  batch_number?: string;
  filename?: string;
  total_chunks_created?: number;
  successful_uploads?: number;
  failed_uploads?: number;
  namespace?: string;
  file_size_bytes?: number;
}

export interface IngestionLog {
  id: string;
  created_at: string;
  operation_type: string;
  status: string;
  account_id: number;
  provider: string;
  index_name: string;
  namespace: string | null;
  filenames: string[] | null;
  comment: string | null;
  vectors_added: number;
  vectors_deleted: number;
  vectors_failed: number;
  error_message: string | null;
  error_code: string | null;
  batch_number: string | null;
}

export interface IngestionLogsListResponse {
  logs: IngestionLog[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface IngestionLogsFilterOptions {
  index_name?: string;
  namespace?: string;
  operation_type?: string;
  status?: string;
  provider?: string;
  batch_number?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

class VectorStoresService {
  async listIndexes(): Promise<Index[]> {
    return apiGet<Index[]>(`/api/vector-stores/indexes`);
  }

  async listNamespaces(indexName: string): Promise<Namespace[]> {
    return apiGet<Namespace[]>(
      `/api/vector-stores/indexes/${encodeURIComponent(indexName)}/namespaces`
    );
  }

  /** Per-file vector counts for a namespace (live Pinecone scan). */
  async listNamespaceFiles(
    indexName: string,
    namespace: string,
  ): Promise<NamespaceFilesResponse> {
    return apiGet<NamespaceFilesResponse>(
      `/api/vector-stores/indexes/${encodeURIComponent(
        indexName,
      )}/namespaces/${encodeURIComponent(namespace)}/files`,
    );
  }

  async createIndex(data: CreateIndexRequest): Promise<Index> {
    return apiPost<Index>(`/api/vector-stores/indexes`, data);
  }

  async createNamespace(indexName: string, data: CreateNamespaceRequest): Promise<Namespace> {
    return apiPost<Namespace>(
      `/api/vector-stores/indexes/${encodeURIComponent(indexName)}/namespaces`,
      data
    );
  }

  async uploadTextFile(
    indexName: string,
    namespace: string,
    file: File,
    comment?: string,
    batchNumber?: string
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("index_name", indexName);
    formData.append("namespace", namespace);
    if (comment) formData.append("comment", comment);
    if (batchNumber) formData.append("batch_number", batchNumber);

    return apiPost<UploadResponse>(`/api/vector-stores/upload-text`, formData);
  }

  async uploadCsvFile(
    indexName: string,
    namespace: string,
    file: File,
    comment?: string,
    batchNumber?: string
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("index_name", indexName);
    formData.append("namespace", namespace);
    if (comment) formData.append("comment", comment);
    if (batchNumber) formData.append("batch_number", batchNumber);

    return apiPost<UploadResponse>(`/api/vector-stores/upload-csv`, formData);
  }

  async deleteNamespaceVectors(indexName: string, namespace: string): Promise<void> {
    return apiDelete<void>(
      `/api/vector-stores/indexes/${encodeURIComponent(indexName)}/namespaces/${encodeURIComponent(namespace)}/vectors`
    );
  }

  async getIngestionLogs(
    indexName: string,
    options: IngestionLogsFilterOptions = {}
  ): Promise<IngestionLogsListResponse> {
    const limit =
      typeof options.limit === "number" && !isNaN(options.limit)
        ? Math.max(1, Math.min(500, options.limit))
        : 50;
    const offset =
      typeof options.offset === "number" && !isNaN(options.offset)
        ? Math.max(0, options.offset)
        : 0;

    const data = await apiGet<IngestionLogsListResponse>(
      `/api/vector-stores/ingestion-logs`,
      {
        query: {
          index_name: indexName,
          namespace: options.namespace || undefined,
          operation_type: options.operation_type || undefined,
          status: options.status || undefined,
          provider: options.provider || undefined,
          batch_number: options.batch_number || undefined,
          start_date: options.start_date || undefined,
          end_date: options.end_date || undefined,
          limit,
          offset,
        },
      }
    );

    if (!data || typeof data !== "object" || !Array.isArray(data.logs)) {
      throw new Error("Invalid response format: logs is not an array");
    }

    return data;
  }
}

export const vectorStoresService = new VectorStoresService();
