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
    <div className="my-4 rounded-xl border border-amber-500/30 bg-amber-950/20 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 bg-amber-900/20 border-b border-amber-500/20">
        <EnvelopeIcon className="h-5 w-5 text-amber-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-200">
            Email approval required
          </p>
          <p className="text-xs text-amber-400/70">
            Review the message below before it is sent
          </p>
        </div>
        {isResolved ? (
          resolvedStatus === "approved" ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-900/40 border border-green-500/30 text-xs font-medium text-green-400">
              <CheckCircleIcon className="h-3.5 w-3.5" />
              Sent
            </span>
          ) : resolvedStatus === "rejected" ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-900/40 border border-red-500/30 text-xs font-medium text-red-400">
              <XCircleIcon className="h-3.5 w-3.5" />
              Rejected
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-800/60 border border-gray-600/30 text-xs font-medium text-gray-400">
              <ClockIcon className="h-3.5 w-3.5" />
              Expired
            </span>
          )
        ) : (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-900/40 border border-amber-500/30 text-xs font-medium text-amber-300">
            <ClockIcon className="h-3.5 w-3.5" />
            Pending
          </span>
        )}
      </div>

      {/* Email preview */}
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-start gap-2.5">
          <UserIcon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">To</span>
            <p className="text-sm text-gray-200 break-all">{preview?.to_email}</p>
          </div>
        </div>

        <div className="border-t border-white/5 pt-3">
          <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Subject</span>
          <p className="text-sm font-medium text-gray-100 mt-0.5">{preview?.subject}</p>
        </div>

        <div className="border-t border-white/5 pt-3">
          <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Body</span>
          <pre className="mt-1.5 text-sm text-gray-300 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
            {preview?.body}
          </pre>
        </div>
      </div>

      {/* Actions */}
      {!isResolved && (
        <div className="flex items-center gap-3 px-5 py-3 bg-gray-900/30 border-t border-white/5">
          {error && (
            <p className="flex-1 text-xs text-red-400">{error}</p>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleReject}
              disabled={isLoading !== null}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium text-red-300 bg-red-900/20 hover:bg-red-900/40 border border-red-500/30 hover:border-red-400/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading === "reject" ? (
                <span className="h-3.5 w-3.5 rounded-full border-2 border-red-400/40 border-t-red-400 animate-spin" />
              ) : (
                <XCircleIcon className="h-3.5 w-3.5" />
              )}
              Reject
            </button>
            <button
              onClick={handleApprove}
              disabled={isLoading !== null}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium text-green-300 bg-green-900/20 hover:bg-green-900/40 border border-green-500/30 hover:border-green-400/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading === "approve" ? (
                <span className="h-3.5 w-3.5 rounded-full border-2 border-green-400/40 border-t-green-400 animate-spin" />
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
