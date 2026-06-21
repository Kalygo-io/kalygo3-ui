import { getAiApiBaseUrl } from "./lib/api";

const API_BASE_URL = getAiApiBaseUrl();

export interface ChatFileRef {
  gcs_bucket: string;
  gcs_file_path: string;
  filename: string;
  content_type?: string;
  size: number;
}

/**
 * Thrown when the account has not configured Google Cloud Storage credentials.
 * The chat UI uses this to prompt the user to add credentials rather than
 * showing a generic error.
 */
export class GcsCredentialMissingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GcsCredentialMissingError";
  }
}

/**
 * Upload a chat attachment to the account's GCS bucket (ai-api). Returns a GCS
 * reference to forward to the completion-api stream. Throws
 * GcsCredentialMissingError on the 400 "configure GCS credentials" response.
 */
export async function uploadChatFile(file: File, sessionId?: string): Promise<ChatFileRef> {
  const formData = new FormData();
  formData.append("file", file);
  if (sessionId) formData.append("session_id", sessionId);

  const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const text = await response.text();
    let detail = `Upload failed: ${response.status}`;
    try {
      const json = JSON.parse(text);
      detail = json.detail || json.message || detail;
    } catch {
      if (text) detail = text;
    }
    // 400 is the "no GCS credential configured" gate from the backend.
    if (response.status === 400) {
      throw new GcsCredentialMissingError(detail);
    }
    throw new Error(detail);
  }

  return response.json();
}
