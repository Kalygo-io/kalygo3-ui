"use client";
import React, { useState } from "react";
import { WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import { DrawerCloseButton } from "@/components/shared/drawer-close-button";
import { RetrievalCall } from "@/ts/types/Message";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ToolCallsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** v2 schema tool calls from the agent (current format) */
  toolCalls?: any[];
  /** Legacy retrieval calls (kept for backward-compat with old sessions) */
  retrievalCalls?: RetrievalCall[];
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────

export function ToolCallsDrawer({
  isOpen,
  onClose,
  toolCalls = [],
  retrievalCalls = [],
}: ToolCallsDrawerProps) {
  if (!isOpen) return null;

  // Merge: current-format tool calls take precedence; fall back to legacy.
  const calls: any[] =
    toolCalls.length > 0
      ? toolCalls
      : retrievalCalls.map((rc) => ({ _legacy: true, ...rc }));

  return (
    <div className="fixed inset-0 top-16 z-[70] overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-gray-900 border-l border-gray-700 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <WrenchScrewdriverIcon className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">
              Tool Calls
              {calls.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({calls.length})
                </span>
              )}
            </h2>
          </div>
          <DrawerCloseButton onClose={onClose} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {calls.length === 0 ? (
            <p className="text-gray-400 text-center py-12">
              No tool calls for this message.
            </p>
          ) : (
            calls.map((call, i) => (
              <ToolCallCard key={i} index={i} call={call} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────

function ToolCallCard({ index, call }: { index: number; call: any }) {
  if (call._pending) return <PendingCard index={index} call={call} />;
  if (call._legacy) return <LegacyCard index={index} call={call} />;

  switch (call.toolType) {
    case "vectorSearch":
    case "vectorSearchWithReranking":
      return <VectorSearchCard index={index} call={call} />;
    case "dbTableRead":
      return <DbReadCard index={index} call={call} />;
    case "dbTableWrite":
      return <DbWriteCard index={index} call={call} />;
    case "sendTxtEmailWithSes":
    case "sendHtmlEmailWithSes":
      return <EmailCard index={index} call={call} />;
    case "custom":
      return <CustomCard index={index} call={call} />;
    default:
      return <GenericCard index={index} call={call} />;
  }
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function CardShell({
  index,
  typeLabel,
  typeColor,
  toolName,
  badge,
  children,
}: {
  index: number;
  typeLabel: string;
  typeColor: string;
  toolName: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-800/50 border border-gray-600/50 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-gray-500 flex-shrink-0">#{index + 1}</span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${typeColor}`}
          >
            {typeLabel}
          </span>
          <span className="text-sm font-semibold text-white font-mono truncate">
            {toolName}
          </span>
        </div>
        {badge && <div className="flex-shrink-0">{badge}</div>}
      </div>
      {children}
    </div>
  );
}

/** A collapsible block that renders its value as pretty-printed JSON. */
function JsonBlock({
  label,
  data,
  defaultOpen = false,
}: {
  label: string;
  data: unknown;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
      >
        <span>{open ? "▲" : "▶"}</span>
        <span>{label}</span>
      </button>
      {open && (
        <pre className="mt-2 text-xs text-gray-300 bg-gray-900/60 border border-gray-700 rounded p-3 overflow-x-auto whitespace-pre-wrap max-h-96">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-gray-500 flex-shrink-0 w-20 text-xs uppercase tracking-wide pt-0.5">
        {label}
      </span>
      <span className="text-white break-words min-w-0">{value as any}</span>
    </div>
  );
}

function SuccessBadge({ success }: { success: boolean | undefined }) {
  if (success == null) return null;
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded ${
        success
          ? "bg-green-600/20 text-green-400 border border-green-500/40"
          : "bg-red-600/20 text-red-400 border border-red-500/40"
      }`}
    >
      {success ? "Success" : "Failed"}
    </span>
  );
}

// ─── Pending (tool is still running) ─────────────────────────────────────────

function PendingCard({ index, call }: { index: number; call: any }) {
  return (
    <CardShell
      index={index}
      typeLabel="Running…"
      typeColor="bg-yellow-500/20 text-yellow-400"
      toolName={call.toolName ?? "unknown_tool"}
      badge={
        <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
      }
    >
      {call.input && Object.keys(call.input).length > 0 && (
        <JsonBlock label="Input" data={call.input} defaultOpen />
      )}
    </CardShell>
  );
}

// ─── Vector Search (plain + reranked) ────────────────────────────────────────

function VectorSearchCard({ index, call }: { index: number; call: any }) {
  const results: any[] = call.output?.results ?? [];
  const isRerank = call.toolType === "vectorSearchWithReranking";

  return (
    <CardShell
      index={index}
      typeLabel={isRerank ? "Vector Search + Rerank" : "Vector Search"}
      typeColor="bg-blue-500/20 text-blue-400"
      toolName={call.toolName}
      badge={
        <span className="text-xs text-gray-400">
          {results.length} result{results.length !== 1 ? "s" : ""}
        </span>
      }
    >
      <div className="space-y-1.5">
        <Row label="Query" value={call.input?.query} />
        {call.input?.topK != null && <Row label="Top K" value={call.input.topK} />}
        <Row label="Namespace" value={call.output?.namespace} />
        <Row label="Index" value={call.output?.index} />
      </div>

      {results.length > 0 && <VectorResultsList results={results} />}
    </CardShell>
  );
}

function VectorResultsList({ results }: { results: any[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? results : results.slice(0, 3);

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 uppercase tracking-wide">
        Results ({results.length})
      </p>
      <div className="space-y-1.5">
        {visible.map((r, i) => (
          <VectorResult key={i} result={r} number={i + 1} />
        ))}
      </div>
      {results.length > 3 && (
        <button
          onClick={() => setShowAll((s) => !s)}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          {showAll
            ? "▲ Show fewer"
            : `▶ Show all ${results.length} results`}
        </button>
      )}
    </div>
  );
}

function VectorResult({ result, number }: { result: any; number: number }) {
  const [open, setOpen] = useState(false);
  const meta = result.metadata ?? {};
  const score =
    typeof result.score === "number"
      ? `${(result.score * 100).toFixed(1)}%`
      : null;
  const isQA = "q" in meta && "a" in meta;
  const content: string = meta.content || result.content || "";

  return (
    <div className="bg-gray-900/50 border border-gray-700/50 rounded p-2.5 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-gray-500">#{number}</span>
          {meta.filename && (
            <span className="text-xs text-blue-300 bg-blue-900/20 px-1.5 py-0.5 rounded truncate max-w-[180px]">
              {meta.filename}
            </span>
          )}
        </div>
        {score && (
          <span className="text-xs text-green-400 font-mono flex-shrink-0">
            {score}
          </span>
        )}
      </div>

      {/* Preview */}
      {isQA ? (
        <div className="space-y-1">
          <p className="text-xs text-gray-400">
            <span className="font-medium text-gray-300">Q:</span> {meta.q}
          </p>
          {open && (
            <p className="text-xs text-gray-300">
              <span className="font-medium">A:</span> {meta.a}
            </p>
          )}
        </div>
      ) : content ? (
        <p className="text-xs text-gray-400 leading-relaxed">
          {open ? content : content.slice(0, 140) + (content.length > 140 ? "…" : "")}
        </p>
      ) : null}

      {(isQA || content) && (
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          {open ? "▲ Collapse" : "▶ Expand"}
        </button>
      )}
    </div>
  );
}

// ─── DB Read ──────────────────────────────────────────────────────────────────

function DbReadCard({ index, call }: { index: number; call: any }) {
  const rows: any[] = call.output?.rows ?? call.output?.results ?? [];
  const table = call.input?.table ?? call.output?.table ?? "";

  return (
    <CardShell
      index={index}
      typeLabel="DB Read"
      typeColor="bg-green-500/20 text-green-400"
      toolName={call.toolName}
      badge={
        <span className="text-xs text-gray-400">
          {rows.length} row{rows.length !== 1 ? "s" : ""}
        </span>
      }
    >
      <div className="space-y-1.5">
        <Row label="Table" value={table} />
        {call.input?.limit != null && <Row label="Limit" value={call.input.limit} />}
        {call.input?.filters && Object.keys(call.input.filters).length > 0 && (
          <Row label="Filters" value={JSON.stringify(call.input.filters)} />
        )}
      </div>
      {rows.length > 0 && <JsonBlock label="Results" data={rows} />}
    </CardShell>
  );
}

// ─── DB Write ─────────────────────────────────────────────────────────────────

function DbWriteCard({ index, call }: { index: number; call: any }) {
  const table = call.input?.table ?? call.output?.table ?? "";

  return (
    <CardShell
      index={index}
      typeLabel="DB Write"
      typeColor="bg-orange-500/20 text-orange-400"
      toolName={call.toolName}
      badge={<SuccessBadge success={call.output?.success} />}
    >
      <div className="space-y-1.5">
        <Row label="Table" value={table} />
        {call.output?.error && (
          <Row label="Error" value={call.output.error} />
        )}
        {call.output?.insertedId != null && (
          <Row label="Inserted ID" value={String(call.output.insertedId)} />
        )}
      </div>
      {call.input?.data && Object.keys(call.input.data).length > 0 && (
        <JsonBlock label="Input Data" data={call.input.data} />
      )}
    </CardShell>
  );
}

// ─── Send Email ───────────────────────────────────────────────────────────────

function EmailCard({ index, call }: { index: number; call: any }) {
  return (
    <CardShell
      index={index}
      typeLabel="Send Email"
      typeColor="bg-pink-500/20 text-pink-400"
      toolName={call.toolName}
      badge={<SuccessBadge success={call.output?.success} />}
    >
      <div className="space-y-1.5">
        <Row label="To" value={call.input?.to} />
        <Row label="Subject" value={call.input?.subject} />
        {call.output?.messageId && (
          <Row label="Message ID" value={call.output.messageId} />
        )}
        {call.output?.error && <Row label="Error" value={call.output.error} />}
      </div>
      {call.input?.body && (
        <JsonBlock label="Body" data={call.input.body} />
      )}
    </CardShell>
  );
}

// ─── Custom (generic action tool) ────────────────────────────────────────────

function CustomCard({ index, call }: { index: number; call: any }) {
  return (
    <CardShell
      index={index}
      typeLabel="Custom Tool"
      typeColor="bg-purple-500/20 text-purple-400"
      toolName={call.toolName}
    >
      <JsonBlock label="Input" data={call.input} />
      <JsonBlock label="Output" data={call.output} />
    </CardShell>
  );
}

// ─── Legacy (old RetrievalCall format) ───────────────────────────────────────

function LegacyCard({ index, call }: { index: number; call: any }) {
  const results: any[] = call.reranked_results ?? call.similarity_results ?? [];
  return (
    <CardShell
      index={index}
      typeLabel="Retrieval"
      typeColor="bg-blue-500/20 text-blue-400"
      toolName="vector_search"
      badge={
        <span className="text-xs text-gray-400">
          {results.length} result{results.length !== 1 ? "s" : ""}
        </span>
      }
    >
      <Row label="Query" value={call.query} />
      <Row label="Namespace" value={call.namespace} />
      {results.length > 0 && <JsonBlock label="Results" data={results} />}
    </CardShell>
  );
}

// ─── Generic fallback ─────────────────────────────────────────────────────────

function GenericCard({ index, call }: { index: number; call: any }) {
  const name = call.toolName ?? call.name ?? "Unknown Tool";
  const type = call.toolType ?? "unknown";
  return (
    <CardShell
      index={index}
      typeLabel={type}
      typeColor="bg-gray-500/20 text-gray-400"
      toolName={name}
    >
      <JsonBlock label="Details" data={call} defaultOpen />
    </CardShell>
  );
}
