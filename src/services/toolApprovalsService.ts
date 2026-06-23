import { apiGet, apiPost } from "./lib/api";

export interface ToolApprovalPreview {
  to_email: string;
  subject: string;
  body: string;
}

export interface PendingToolApproval {
  id: number;
  account_id: number;
  agent_id: number | null;
  chat_session_id: number | null;
  tool_type: string;
  status: "pending" | "approved" | "rejected" | "expired";
  payload: Record<string, any>;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

class ToolApprovalsService {
  async listToolApprovals(status = "pending"): Promise<PendingToolApproval[]> {
    return apiGet<PendingToolApproval[]>(`/api/tool-approvals/`, {
      query: { status },
    });
  }

  async approveToolApproval(
    approvalId: number,
    overrides?: { to_email?: string; subject?: string; body?: string },
  ): Promise<{ id: number; status: string; message: string }> {
    return apiPost<{ id: number; status: string; message: string }>(
      `/api/tool-approvals/${approvalId}/approve`,
      overrides,
    );
  }

  async previewToolApproval(
    approvalId: number,
    overrides?: { subject?: string; html_body?: string },
  ): Promise<{ id: number; status: string; message: string }> {
    return apiPost<{ id: number; status: string; message: string }>(
      `/api/tool-approvals/${approvalId}/preview`,
      overrides,
    );
  }

  async rejectToolApproval(
    approvalId: number,
  ): Promise<{ id: number; status: string; message: string }> {
    return apiPost<{ id: number; status: string; message: string }>(
      `/api/tool-approvals/${approvalId}/reject`,
    );
  }
}

export const toolApprovalsService = new ToolApprovalsService();
