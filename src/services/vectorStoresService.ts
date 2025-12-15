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
  namespace: string;
  filenames: string[] | null;
  comment: string | null;
  vectors_added: number | null;
  vectors_deleted: number | null;
  vectors_failed: number | null;
  error_message: string | null;
  error_code: string | null;
  batch_number: string | null;
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
    limit: number = 50
  ): Promise<IngestionLog[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/vector-stores/indexes/${encodeURIComponent(
        indexName
      )}/ingestion-logs?limit=${limit}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    return this.handleResponse<IngestionLog[]>(response);
  }
}

export const vectorStoresService = new VectorStoresService();
