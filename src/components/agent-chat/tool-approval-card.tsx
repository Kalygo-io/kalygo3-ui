"use client";

import { useState } from "react";
import { useContext } from "react";
import {
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { ChatDispatchContext } from "@/app/dashboard/agent-chat/chat-session-context";
import { toolApprovalsService } from "@/services/toolApprovalsService";
import type { ToolApprovalMessage } from "@/ts/types/Message";

interface Props {
  toolApproval: ToolApprovalMessage;
}

export function ToolApprovalCard({ toolApproval }: Props) {
  const dispatch = useContext(ChatDispatchContext);
  const [isLoading, setIsLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { approvalId, preview, resolvedStatus } = toolApproval;

  const handleApprove = async () => {
    setIsLoading("approve");
    setError(null);
    try {
      await toolApprovalsService.approveToolApproval(approvalId);
      dispatch({
        type: "RESOLVE_TOOL_APPROVAL",
        payload: { approvalId, resolvedStatus: "approved" },
      });
    } catch (err: any) {
      setError(err.message || "Failed to approve");
    } finally {
      setIsLoading(null);
    }
  };

  const handleReject = async () => {
    setIsLoading("reject");
    setError(null);
    try {
      await toolApprovalsService.rejectToolApproval(approvalId);
      dispatch({
        type: "RESOLVE_TOOL_APPROVAL",
        payload: { approvalId, resolvedStatus: "rejected" },
      });
    } catch (err: any) {
      setError(err.message || "Failed to reject");
    } finally {
      setIsLoading(null);
    }
  };

  const isResolved = !!resolvedStatus;

  return (
    <div className="my-4 rounded-xl border border-amber-600 bg-gray-850 shadow-xl overflow-hidden" style={{ backgroundColor: "#1e2130" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-amber-600/50" style={{ backgroundColor: "#78350f" }}>
        <EnvelopeIcon className="h-5 w-5 text-white shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">
            Email approval required
          </p>
          <p className="text-xs text-amber-200">
            Review the message below before it is sent
          </p>
        </div>
        {isResolved ? (
          resolvedStatus === "approved" ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-700 border border-green-500 text-xs font-semibold text-white">
              <CheckCircleIcon className="h-3.5 w-3.5" />
              Sent
            </span>
          ) : resolvedStatus === "rejected" ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-700 border border-red-500 text-xs font-semibold text-white">
              <XCircleIcon className="h-3.5 w-3.5" />
              Rejected
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-600 border border-gray-400 text-xs font-semibold text-white">
              <ClockIcon className="h-3.5 w-3.5" />
              Expired
            </span>
          )
        ) : (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-600 border border-amber-400 text-xs font-semibold text-white">
            <ClockIcon className="h-3.5 w-3.5" />
            Pending
          </span>
        )}
      </div>

      {/* Email preview */}
      <div className="px-5 py-4 divide-y divide-gray-600">
        <div className="flex items-start gap-2.5 pb-3">
          <UserIcon className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <span className="block text-xs text-gray-300 uppercase tracking-wider font-bold mb-0.5">To</span>
            <p className="text-sm text-white break-all">{preview?.to_email}</p>
          </div>
        </div>

        <div className="py-3">
          <span className="block text-xs text-gray-300 uppercase tracking-wider font-bold mb-0.5">Subject</span>
          <p className="text-sm font-medium text-white">{preview?.subject}</p>
        </div>

        <div className="pt-3">
          <span className="block text-xs text-gray-300 uppercase tracking-wider font-bold mb-0.5">Body</span>
          <pre className="text-sm text-gray-100 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
            {preview?.body}
          </pre>
        </div>
      </div>

      {/* Actions */}
      {!isResolved && (
        <div className="flex items-center gap-3 px-5 py-3 bg-gray-700 border-t border-gray-600">
          {error && (
            <p className="flex-1 text-xs text-red-400">{error}</p>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleReject}
              disabled={isLoading !== null}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-700 hover:bg-red-600 border border-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading === "reject" ? (
                <span className="h-3.5 w-3.5 rounded-full border-2 border-red-200/40 border-t-red-200 animate-spin" />
              ) : (
                <XCircleIcon className="h-3.5 w-3.5" />
              )}
              Reject
            </button>
            <button
              onClick={handleApprove}
              disabled={isLoading !== null}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-green-700 hover:bg-green-600 border border-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading === "approve" ? (
                <span className="h-3.5 w-3.5 rounded-full border-2 border-green-200/40 border-t-green-200 animate-spin" />
              ) : (
                <CheckCircleIcon className="h-3.5 w-3.5" />
              )}
              Send Email
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
