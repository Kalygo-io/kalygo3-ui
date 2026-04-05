"use client";

import { useState } from "react";
import { useContext } from "react";
import {
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  PencilIcon,
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

  const { approvalId, toolType, preview, resolvedStatus } = toolApproval;

  const isHtmlTool = toolType === "sendHtmlEmailWithSes";

  // Editable copies — initialised from the agent-composed preview
  const [toEmail, setToEmail] = useState(preview?.to_email ?? "");
  const [subject, setSubject] = useState(preview?.subject ?? "");
  // HTML tools store the body as html_body; plain-text tools use body
  const [htmlBody, setHtmlBody] = useState(preview?.html_body ?? "");
  const [body, setBody] = useState(preview?.body ?? "");

  const [showHtmlPreview, setShowHtmlPreview] = useState(isHtmlTool);

  const isResolved = !!resolvedStatus;

  const handleApprove = async () => {
    setIsLoading("approve");
    setError(null);
    try {
      // Send overrides only when the user actually changed something
      const overrides: Record<string, string | undefined> = {
        to_email: toEmail !== preview?.to_email ? toEmail : undefined,
        subject: subject !== preview?.subject ? subject : undefined,
      };
      if (isHtmlTool) {
        overrides.html_body = htmlBody !== (preview?.html_body ?? "") ? htmlBody : undefined;
      } else {
        overrides.body = body !== (preview?.body ?? "") ? body : undefined;
      }
      const hasOverrides = Object.values(overrides).some((v) => v !== undefined);
      await toolApprovalsService.approveToolApproval(
        approvalId,
        hasOverrides ? overrides : undefined,
      );
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

  const fieldBase =
    "w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed resize-none";

  return (
    <div
      className="my-4 rounded-xl border border-amber-600 shadow-xl overflow-hidden"
      style={{ backgroundColor: "#1e2130" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-3.5 border-b border-amber-600/50"
        style={{ backgroundColor: "#78350f" }}
      >
        <EnvelopeIcon className="h-5 w-5 shrink-0" style={{ color: "#ffffff" }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: "#ffffff" }}>
            Email approval required
          </p>
          <p className="text-xs" style={{ color: "#fde68a" }}>
            {isResolved
              ? "This request has been resolved."
              : "Review and optionally edit the message below before it is sent."}
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
            <PencilIcon className="h-3.5 w-3.5" />
            Pending
          </span>
        )}
      </div>

      {/* Editable email fields */}
      <div className="px-5 py-4 space-y-4">
        {/* From — read-only */}
        {preview?.from_email && (
          <div>
            <label className="flex items-center gap-1.5 text-xs text-gray-400 uppercase tracking-wider font-bold mb-1.5">
              <EnvelopeIcon className="h-3.5 w-3.5 text-amber-400" />
              From
            </label>
            <p className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300 font-mono">
              {preview.from_email}
            </p>
          </div>
        )}

        {/* To */}
        <div>
          <label className="flex items-center gap-1.5 text-xs text-gray-400 uppercase tracking-wider font-bold mb-1.5">
            <UserIcon className="h-3.5 w-3.5 text-amber-400" />
            To
          </label>
          <input
            type="email"
            value={toEmail}
            onChange={(e) => setToEmail(e.target.value)}
            disabled={isResolved}
            className={fieldBase}
          />
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-1.5">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={isResolved}
            className={fieldBase}
          />
        </div>

        {/* Template + variables — shown for HTML template tools */}
        {isHtmlTool && (preview?.template_name || preview?.variables) && (
          <div className="rounded-lg border border-indigo-700/40 bg-indigo-900/10 overflow-hidden">
            {/* Template name row */}
            {preview.template_name && (
              <div className="flex items-center gap-2 px-3 py-2 border-b border-indigo-700/30 bg-indigo-900/20">
                <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Template</span>
                <span className="text-xs text-indigo-200 font-semibold">{preview.template_name}</span>
              </div>
            )}
            {/* Variables table */}
            {preview.variables && Object.keys(preview.variables).length > 0 && (
              <div className="px-3 py-2.5">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Variables</p>
                <div className="space-y-1.5">
                  {Object.entries(preview.variables).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-[140px_1fr] gap-2 items-start">
                      <span className="text-xs font-mono text-indigo-400 bg-indigo-900/30 px-1.5 py-0.5 rounded truncate">
                        {`{{${key}}}`}
                      </span>
                      <span className="text-xs text-gray-300 break-words leading-relaxed">{String(value) || <em className="text-gray-600">empty</em>}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Body / HTML preview */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold">
              {isHtmlTool ? "HTML Body" : "Body"}
            </label>
            {isHtmlTool && htmlBody && (
              <button
                type="button"
                onClick={() => setShowHtmlPreview((v) => !v)}
                className="text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
              >
                {showHtmlPreview ? "Edit source" : "Preview"}
              </button>
            )}
          </div>

          {isHtmlTool ? (
            showHtmlPreview && htmlBody ? (
              <iframe
                srcDoc={htmlBody}
                title="HTML email preview"
                sandbox="allow-same-origin"
                className="w-full rounded-lg border border-gray-700 bg-white"
                style={{ minHeight: "400px", maxHeight: "600px" }}
              />
            ) : (
              <textarea
                value={htmlBody}
                onChange={(e) => setHtmlBody(e.target.value)}
                disabled={isResolved}
                rows={10}
                className={fieldBase + " font-mono text-xs"}
                placeholder="HTML email body…"
              />
            )
          ) : (
            <>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={isResolved}
                rows={8}
                className={fieldBase}
              />
              {!body.trim() && !isResolved && (
                <p className="mt-1.5 text-xs text-gray-500 italic">
                  Body not included in preview — the agent&apos;s generated content will be sent as-is.
                </p>
              )}
            </>
          )}

          {/* Template metadata badge */}
          {preview?.template_name && (
            <p className="mt-1.5 text-xs text-amber-400/80">
              Template: <span className="font-semibold">{preview.template_name}</span>
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      {!isResolved && (
        <div className="flex items-center gap-3 px-5 py-3 bg-gray-700/60 border-t border-gray-600">
          {error && <p className="flex-1 text-xs text-red-400">{error}</p>}
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
              disabled={isLoading !== null || !toEmail.trim() || !subject.trim()}
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
