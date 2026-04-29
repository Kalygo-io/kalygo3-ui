import { getAiApiBaseUrl, handleResponse } from "./lib/api";

const API_BASE_URL = getAiApiBaseUrl();

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
    const response = await fetch(`${API_BASE_URL}/api/vector-stores/indexes`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return handleResponse<Index[]>(response);
  }

  async listNamespaces(indexName: string): Promise<Namespace[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/vector-stores/indexes/${encodeURIComponent(indexName)}/namespaces`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );
    return handleResponse<Namespace[]>(response);
  }

  async createIndex(data: CreateIndexRequest): Promise<Index> {
    const response = await fetch(`${API_BASE_URL}/api/vector-stores/indexes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return handleResponse<Index>(response);
  }

  async createNamespace(indexName: string, data: CreateNamespaceRequest): Promise<Namespace> {
    const response = await fetch(
      `${API_BASE_URL}/api/vector-stores/indexes/${encodeURIComponent(indexName)}/namespaces`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      }
    );
    return handleResponse<Namespace>(response);
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

    const response = await fetch(`${API_BASE_URL}/api/vector-stores/upload-text`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    return handleResponse<UploadResponse>(response);
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

    const response = await fetch(`${API_BASE_URL}/api/vector-stores/upload-csv`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    return handleResponse<UploadResponse>(response);
  }

  async deleteNamespaceVectors(indexName: string, namespace: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/vector-stores/indexes/${encodeURIComponent(indexName)}/namespaces/${encodeURIComponent(namespace)}/vectors`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );
    return handleResponse<void>(response);
  }

  async getIngestionLogs(
    indexName: string,
    options: IngestionLogsFilterOptions = {}
  ): Promise<IngestionLogsListResponse> {
    const params = new URLSearchParams();
    params.append("index_name", indexName);
    if (options.namespace) params.append("namespace", options.namespace);
    if (options.operation_type) params.append("operation_type", options.operation_type);
    if (options.status) params.append("status", options.status);
    if (options.provider) params.append("provider", options.provider);
    if (options.batch_number) params.append("batch_number", options.batch_number);
    if (options.start_date) params.append("start_date", options.start_date);
    if (options.end_date) params.append("end_date", options.end_date);

    const limit =
      typeof options.limit === "number" && !isNaN(options.limit)
        ? Math.max(1, Math.min(500, options.limit))
        : 50;
    const offset =
      typeof options.offset === "number" && !isNaN(options.offset)
        ? Math.max(0, options.offset)
        : 0;
    params.append("limit", limit.toString());
    params.append("offset", offset.toString());

    const response = await fetch(
      `${API_BASE_URL}/api/vector-stores/ingestion-logs?${params.toString()}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );

    const data = await handleResponse<IngestionLogsListResponse>(response);

    if (!data || typeof data !== "object" || !Array.isArray(data.logs)) {
      throw new Error("Invalid response format: logs is not an array");
    }

    return data;
  }
}

export const vectorStoresService = new VectorStoresService();
