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
  metric?: string; // cosine, euclidean, or dotproduct
  pods?: number;
  replicas?: number;
  pod_type?: string;
}

export interface CreateNamespaceRequest {
  namespace: string;
}

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
  operation_type?: string; // INGEST, DELETE, UPDATE
  status?: string; // SUCCESS, FAILED, PARTIAL, PENDING
  provider?: string;
  batch_number?: string;
  start_date?: string; // ISO format datetime
  end_date?: string; // ISO format datetime
  limit?: number; // 1-500, default 50
  offset?: number; // default 0
}

const API_BASE_URL = process.env.NEXT_PUBLIC_AI_API_URL;

class VectorStoresService {
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Request failed: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  async listIndexes(): Promise<Index[]> {
    const response = await fetch(`${API_BASE_URL}/api/vector-stores/indexes`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    return this.handleResponse<Index[]>(response);
  }

  async listNamespaces(indexName: string): Promise<Namespace[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/vector-stores/indexes/${encodeURIComponent(
        indexName
      )}/namespaces`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    return this.handleResponse<Namespace[]>(response);
  }

  async createIndex(data: CreateIndexRequest): Promise<Index> {
    const response = await fetch(`${API_BASE_URL}/api/vector-stores/indexes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    return this.handleResponse<Index>(response);
  }

  async createNamespace(
    indexName: string,
    data: CreateNamespaceRequest
  ): Promise<Namespace> {
    const response = await fetch(
      `${API_BASE_URL}/api/vector-stores/indexes/${encodeURIComponent(
        indexName
      )}/namespaces`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      }
    );

    return this.handleResponse<Namespace>(response);
  }

  async uploadTextFile(
    indexName: string,
    namespace: string,
    file: File
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("namespace", namespace);

    const response = await fetch(
      `${API_BASE_URL}/api/vector-stores/indexes/${encodeURIComponent(
        indexName
      )}/ingest/text`,
      {
        method: "POST",
        body: formData,
        credentials: "include",
      }
    );

    return this.handleResponse<UploadResponse>(response);
  }

  async uploadCsvFile(
    indexName: string,
    namespace: string,
    file: File
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("namespace", namespace);

    const response = await fetch(
      `${API_BASE_URL}/api/vector-stores/indexes/${encodeURIComponent(
        indexName
      )}/ingest/csv`,
      {
        method: "POST",
        body: formData,
        credentials: "include",
      }
    );

    return this.handleResponse<UploadResponse>(response);
  }

  async getIngestionLogs(
    indexName: string,
    options: IngestionLogsFilterOptions = {}
  ): Promise<IngestionLogsListResponse> {
    // Build query parameters
    const params = new URLSearchParams();

    // Always filter by index_name
    params.append("index_name", indexName);

    // Add optional filters
    if (options.namespace) {
      params.append("namespace", options.namespace);
    }
    if (options.operation_type) {
      params.append("operation_type", options.operation_type);
    }
    if (options.status) {
      params.append("status", options.status);
    }
    if (options.provider) {
      params.append("provider", options.provider);
    }
    if (options.batch_number) {
      params.append("batch_number", options.batch_number);
    }
    if (options.start_date) {
      params.append("start_date", options.start_date);
    }
    if (options.end_date) {
      params.append("end_date", options.end_date);
    }

    // Pagination - ensure values are numbers and not NaN
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
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    return this.handleResponse<IngestionLogsListResponse>(response);
  }
}

export const vectorStoresService = new VectorStoresService();
