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
    const resp = await fetch(
      `${process.env.NEXT_PUBLIC_AI_API_URL}/api/tool-approvals/?status=${status}`,
      { credentials: "include" },
    );
    if (!resp.ok) throw new Error(`Failed to list tool approvals: ${resp.status}`);
    return resp.json();
  }

  async approveToolApproval(
    approvalId: number,
    overrides?: { to_email?: string; subject?: string; body?: string },
  ): Promise<{ id: number; status: string; message: string }> {
    const resp = await fetch(
      `${process.env.NEXT_PUBLIC_AI_API_URL}/api/tool-approvals/${approvalId}/approve`,
      {
        method: "POST",
        credentials: "include",
        headers: overrides ? { "Content-Type": "application/json" } : undefined,
        body: overrides ? JSON.stringify(overrides) : undefined,
      },
    );
    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      throw new Error(body.detail || `Failed to approve: ${resp.status}`);
    }
    return resp.json();
  }

  async rejectToolApproval(
    approvalId: number,
  ): Promise<{ id: number; status: string; message: string }> {
    const resp = await fetch(
      `${process.env.NEXT_PUBLIC_AI_API_URL}/api/tool-approvals/${approvalId}/reject`,
      { method: "POST", credentials: "include" },
    );
    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      throw new Error(body.detail || `Failed to reject: ${resp.status}`);
    }
    return resp.json();
  }
}

export const toolApprovalsService = new ToolApprovalsService();
