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
  /** Epoch-ms string of the most recent vector for this file, or null. */
  uploaded_at?: string | null;
  /** Uploader (email, falling back to user id), or null. */
  uploaded_by?: string | null;
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
  /** Owner of a shared knowledge base whose logs to read. */
  ownerAccountId?: number;
}

/** A knowledge base shared with the caller via access-group membership. */
export interface SharedVectorStore {
  owner_account_id: number;
  index_name: string;
  can_write: boolean;
}

/** An access group a knowledge base is shared with. */
export interface VectorStoreAccessGrant {
  id: number;
  owner_account_id: number;
  index_name: string;
  access_group_id: number;
  access_group_name: string;
  created_at: string;
}

/**
 * `ownerAccountId` is supplied only when operating on a SHARED knowledge base
 * (one owned by another account and granted to one of your access groups). Omit
 * it for your own knowledge bases. The backend resolves which account's Pinecone
 * key / storage / logs to use and enforces the member(read)/admin(write) rule.
 */
class VectorStoresService {
  private ownerQuery(
    ownerAccountId?: number,
  ): Record<string, string | number | boolean | undefined | null> {
    return ownerAccountId != null ? { owner_account_id: ownerAccountId } : {};
  }

  async listIndexes(): Promise<Index[]> {
    return apiGet<Index[]>(`/api/vector-stores/indexes`);
  }

  /** Knowledge bases shared with the caller, with the caller's write capability. */
  async listSharedVectorStores(): Promise<SharedVectorStore[]> {
    return apiGet<SharedVectorStore[]>(`/api/vector-stores/shared`);
  }

  async listNamespaces(indexName: string, ownerAccountId?: number): Promise<Namespace[]> {
    return apiGet<Namespace[]>(
      `/api/vector-stores/indexes/${encodeURIComponent(indexName)}/namespaces`,
      { query: this.ownerQuery(ownerAccountId) },
    );
  }

  /** Per-file vector counts for a namespace (live Pinecone scan). */
  async listNamespaceFiles(
    indexName: string,
    namespace: string,
    ownerAccountId?: number,
  ): Promise<NamespaceFilesResponse> {
    return apiGet<NamespaceFilesResponse>(
      `/api/vector-stores/indexes/${encodeURIComponent(
        indexName,
      )}/namespaces/${encodeURIComponent(namespace)}/files`,
      { query: this.ownerQuery(ownerAccountId) },
    );
  }

  async createIndex(data: CreateIndexRequest): Promise<Index> {
    return apiPost<Index>(`/api/vector-stores/indexes`, data);
  }

  async createNamespace(
    indexName: string,
    data: CreateNamespaceRequest,
    ownerAccountId?: number,
  ): Promise<Namespace> {
    return apiPost<Namespace>(
      `/api/vector-stores/indexes/${encodeURIComponent(indexName)}/namespaces`,
      data,
      { query: this.ownerQuery(ownerAccountId) },
    );
  }

  async uploadTextFile(
    indexName: string,
    namespace: string,
    file: File,
    comment?: string,
    batchNumber?: string,
    ownerAccountId?: number,
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("index_name", indexName);
    formData.append("namespace", namespace);
    if (comment) formData.append("comment", comment);
    if (batchNumber) formData.append("batch_number", batchNumber);
    if (ownerAccountId != null) formData.append("owner_account_id", String(ownerAccountId));

    return apiPost<UploadResponse>(`/api/vector-stores/upload-text`, formData);
  }

  async uploadCsvFile(
    indexName: string,
    namespace: string,
    file: File,
    comment?: string,
    batchNumber?: string,
    ownerAccountId?: number,
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("index_name", indexName);
    formData.append("namespace", namespace);
    if (comment) formData.append("comment", comment);
    if (batchNumber) formData.append("batch_number", batchNumber);
    if (ownerAccountId != null) formData.append("owner_account_id", String(ownerAccountId));

    return apiPost<UploadResponse>(`/api/vector-stores/upload-csv`, formData);
  }

  /**
   * Store the original PDF as the source document and queue reviewed Q&A pairs
   * for ingestion. The PDF is what lands in GCS; each resulting vector references
   * it in metadata so FAQ entries trace back to the source.
   */
  async uploadPdfFaq(
    indexName: string,
    namespace: string,
    pdfFile: File,
    pairs: { question: string; answer: string }[],
    comment?: string,
    batchNumber?: string,
    ownerAccountId?: number,
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", pdfFile);
    formData.append("index_name", indexName);
    formData.append("namespace", namespace);
    formData.append(
      "qna_pairs",
      JSON.stringify(pairs.map((p) => ({ q: p.question, a: p.answer })))
    );
    if (comment) formData.append("comment", comment);
    if (batchNumber) formData.append("batch_number", batchNumber);
    if (ownerAccountId != null) formData.append("owner_account_id", String(ownerAccountId));

    return apiPost<UploadResponse>(`/api/vector-stores/upload-pdf-faq`, formData);
  }

  async deleteNamespaceVectors(
    indexName: string,
    namespace: string,
    ownerAccountId?: number,
  ): Promise<void> {
    return apiDelete<void>(
      `/api/vector-stores/indexes/${encodeURIComponent(indexName)}/namespaces/${encodeURIComponent(namespace)}/vectors`,
      undefined,
      { query: this.ownerQuery(ownerAccountId) },
    );
  }

  /** Delete all vectors belonging to a single source file within a namespace. */
  async deleteFileVectors(
    indexName: string,
    namespace: string,
    filename: string,
    ownerAccountId?: number,
  ): Promise<void> {
    return apiDelete<void>(
      `/api/vector-stores/indexes/${encodeURIComponent(indexName)}/namespaces/${encodeURIComponent(namespace)}/file-vectors`,
      undefined,
      { query: { filename, ...this.ownerQuery(ownerAccountId) } },
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
          ...this.ownerQuery(options.ownerAccountId),
        },
      }
    );

    if (!data || typeof data !== "object" || !Array.isArray(data.logs)) {
      throw new Error("Invalid response format: logs is not an array");
    }

    return data;
  }

  // --- Sharing (knowledge base access grants) -------------------------------

  /** List the access groups a knowledge base is shared with. Index owner only. */
  async listVectorStoreGrants(indexName: string): Promise<VectorStoreAccessGrant[]> {
    return apiGet<VectorStoreAccessGrant[]>(`/api/vector-stores/grants`, {
      query: { index_name: indexName },
    });
  }

  /** Share one of your knowledge bases with an access group. */
  async grantVectorStoreAccess(
    indexName: string,
    accessGroupId: number,
  ): Promise<VectorStoreAccessGrant> {
    return apiPost<VectorStoreAccessGrant>(`/api/vector-stores/grants`, {
      index_name: indexName,
      accessGroupId,
    });
  }

  /** Revoke a knowledge-base grant by its id. */
  async revokeVectorStoreAccess(grantId: number): Promise<void> {
    return apiDelete<void>(`/api/vector-stores/grants/${grantId}`);
  }
}

export const vectorStoresService = new VectorStoresService();
