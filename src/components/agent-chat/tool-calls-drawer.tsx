import React, { useState, useEffect } from "react";
import {
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  ChevronDownIcon,
  InformationCircleIcon,
  TableCellsIcon,
  CircleStackIcon,
} from "@heroicons/react/24/outline";
import { DrawerCloseButton } from "@/components/shared/drawer-close-button";
import { ToolCall, RetrievalCall } from "@/ts/types/Message";
import {
  VectorSearchToolCall,
  VectorSearchWithRerankingToolCall,
  DbReadToolCall,
  DbWriteToolCall,
  VectorSearchResult,
  TextDocumentMetadata,
  QaMetadata,
} from "@/ts/types/ChatMessage";
import { useCopyToClipboard } from "@/shared/hooks/use-copy-to-clipboard";

// Type guards
function isTextDocumentMetadata(
  metadata: TextDocumentMetadata | QaMetadata
): metadata is TextDocumentMetadata {
  return "chunkId" in metadata && "totalChunks" in metadata;
}

function isQaMetadata(
  metadata: TextDocumentMetadata | QaMetadata
): metadata is QaMetadata {
  return "q" in metadata && "a" in metadata && "row_number" in metadata;
}

function isVectorSearchToolCall(
  call: VectorSearchToolCall | VectorSearchWithRerankingToolCall
): call is VectorSearchToolCall {
  return call.toolType === "vectorSearch";
}

function isVectorSearchWithRerankingToolCall(
  call: VectorSearchToolCall | VectorSearchWithRerankingToolCall | DbReadToolCall
): call is VectorSearchWithRerankingToolCall {
  return call.toolType === "vectorSearchWithReranking";
}

function isDbReadToolCall(
  call: VectorSearchToolCall | VectorSearchWithRerankingToolCall | DbReadToolCall | DbWriteToolCall
): call is DbReadToolCall {
  return call.toolType === "dbRead";
}

function isDbWriteToolCall(
  call: VectorSearchToolCall | VectorSearchWithRerankingToolCall | DbReadToolCall | DbWriteToolCall
): call is DbWriteToolCall {
  return call.toolType === "dbWrite";
}

interface ToolCallsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  toolCalls?:
    | ToolCall[]
    | (VectorSearchToolCall | VectorSearchWithRerankingToolCall | DbReadToolCall | DbWriteToolCall)[]; // Support both old and new schema
  retrievalCalls?: RetrievalCall[]; // Legacy retrieval calls
}

export function ToolCallsDrawer({
  isOpen,
  onClose,
  toolCalls = [],
  retrievalCalls = [],
}: ToolCallsDrawerProps) {
  const [expandedToolCalls, setExpandedToolCalls] = useState<Set<number>>(
    new Set()
  );
  const [expandedChunks, setExpandedChunks] = useState<Set<string>>(new Set());
  const { copyToClipboard } = useCopyToClipboard({ timeout: 2000 });

  // Detect which schema is being used
  const isV2Schema =
    toolCalls.length > 0 &&
    toolCalls[0] &&
    "toolType" in toolCalls[0] &&
    (toolCalls[0] as any).toolType !== undefined;
  
  const isLegacyNewSchema = 
    toolCalls.length > 0 &&
    !isV2Schema;
  
  // Use new toolCalls if available, otherwise fall back to legacy retrievalCalls
  const allToolCalls = toolCalls.length > 0 ? toolCalls : retrievalCalls;
  const isNewSchema = isLegacyNewSchema; // Keep backward compatibility with existing logic

  // Expand all chunks by default when drawer opens or toolCalls change
  useEffect(() => {
    if (isOpen && allToolCalls.length > 0) {
      const allChunkKeys = new Set<string>();
      allToolCalls.forEach((call, toolCallIndex) => {
        if (isV2Schema) {
          // V2 schema: call.output.results
          const v2Call = call as
            | VectorSearchToolCall
            | VectorSearchWithRerankingToolCall;
          if (v2Call.output?.results) {
            v2Call.output.results.forEach((_, chunkIndex) => {
              allChunkKeys.add(`${toolCallIndex}-${chunkIndex}`);
            });
          }
        } else if (isNewSchema) {
          // New schema: call.results
          const toolCall = call as ToolCall;
          if (toolCall.results) {
            toolCall.results.forEach((_, chunkIndex) => {
              allChunkKeys.add(`${toolCallIndex}-${chunkIndex}`);
            });
          }
        } else {
          // Legacy schema: call.reranked_results
          const retrievalCall = call as RetrievalCall;
          if (retrievalCall.reranked_results) {
            retrievalCall.reranked_results.forEach((_, chunkIndex) => {
              allChunkKeys.add(`${toolCallIndex}-${chunkIndex}`);
            });
          }
        }
      });
      setExpandedChunks(allChunkKeys);
    }
  }, [isOpen, allToolCalls, isNewSchema, isV2Schema]);

  if (!isOpen) return null;

  const toggleToolCallExpanded = (index: number) => {
    const newExpanded = new Set(expandedToolCalls);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedToolCalls(newExpanded);
  };

  const toggleChunkExpanded = (toolCallIndex: number, chunkIndex: number) => {
    const key = `${toolCallIndex}-${chunkIndex}`;
    const newExpanded = new Set(expandedChunks);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedChunks(newExpanded);
  };

  const copyChunkContent = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      console.log("Chunk content copied to clipboard");
    } catch (err) {
      console.error("Failed to copy chunk content:", err);
    }
  };

  const ellipsizeFilename = (filename: string, maxLength: number = 30) => {
    if (filename.length <= maxLength) return filename;
    const extension = filename.substring(filename.lastIndexOf("."));
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf("."));
    const maxNameLength = maxLength - extension.length - 3;
    if (maxNameLength <= 0) {
      return "..." + extension;
    }
    return nameWithoutExt.substring(0, maxNameLength) + "..." + extension;
  };

  // Helper to get filename from metadata (new schema) or result (legacy)
  const getFilename = (result: any): string | undefined => {
    if (isV2Schema || isNewSchema) {
      return (
        result.metadata?.filename ||
        result.metadata?.source ||
        result.metadata?.file_name
      );
    } else {
      return result.filename;
    }
  };

  // Helper to get score (new schema uses score, legacy uses relevance_score)
  const getScore = (result: any): number => {
    if (isV2Schema || isNewSchema) {
      return result.score || 0;
    } else {
      return result.relevance_score || 0;
    }
  };

  // Helper to get similarity score (legacy only)
  const getSimilarityScore = (result: any): number | undefined => {
    if (!isNewSchema && !isV2Schema) {
      return result.similarity_score;
    }
    return undefined;
  };

  // Helper to get content from result
  const getContent = (result: any): string => {
    if (isV2Schema) {
      return result.metadata?.content || result.content || "";
    } else {
      return result.content || "";
    }
  };

  // Calculate total chunks/rows
  const totalChunks = allToolCalls.reduce((total, call) => {
    if (isV2Schema) {
      // Check if it's a dbRead tool
      if (isDbReadToolCall(call as any)) {
        const dbCall = call as DbReadToolCall;
        return total + (dbCall.output?.rows?.length || 0);
      }
      // Check if it's a dbWrite tool
      if (isDbWriteToolCall(call as any)) {
        const dbWriteCall = call as DbWriteToolCall;
        return total + (dbWriteCall.output?.success ? 1 : 0);
      }
      const v2Call = call as
        | VectorSearchToolCall
        | VectorSearchWithRerankingToolCall;
      return total + (v2Call.output?.results?.length || 0);
    } else if (isNewSchema) {
      const toolCall = call as ToolCall;
      return total + (toolCall.results?.length || 0);
    } else {
      const retrievalCall = call as RetrievalCall;
      return total + (retrievalCall.reranked_results?.length || 0);
    }
  }, 0);

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-gray-900 border-l border-gray-700 shadow-2xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <WrenchScrewdriverIcon className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">
                Tool Calls & References
              </h2>
            </div>
            <DrawerCloseButton onClose={onClose} />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Contextual Information */}
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
                <InformationCircleIcon className="w-5 h-5 text-blue-400 mr-2" />
                What You&apos;re Looking At
              </h3>
              <p className="text-white text-sm leading-relaxed mb-3">
                These are the tool calls made by the agent to retrieve
                information and generate its response. Each tool call represents
                a specific action the agent took, such as searching knowledge
                bases, querying databases, or performing calculations.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-blue-400 font-medium">
                    Tool Calls Made:
                  </span>
                  <span className="text-white">{allToolCalls.length}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-blue-400 font-medium">
                    Total Results Retrieved:
                  </span>
                  <span className="text-white">{totalChunks}</span>
                </div>
              </div>
            </div>

            {allToolCalls.length === 0 ? (
              <div className="text-center py-8">
                <DocumentTextIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">
                  No tool calls found for this message
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-white mb-3">
                  Tool Calls ({allToolCalls.length})
                </h4>

                {allToolCalls.map((call, index) => {
                  // Check for dbRead tool first (v2 schema)
                  if (isV2Schema && isDbReadToolCall(call as any)) {
                    const dbCall = call as DbReadToolCall;
                    return (
                      <DbReadToolCallCard
                        key={index}
                        index={index}
                        toolCall={dbCall}
                        isExpanded={expandedToolCalls.has(index)}
                        onToggleExpand={() => toggleToolCallExpanded(index)}
                        copyToClipboard={copyToClipboard}
                      />
                    );
                  }

                  // Check for dbWrite tool (v2 schema)
                  if (isV2Schema && isDbWriteToolCall(call as any)) {
                    const dbWriteCall = call as DbWriteToolCall;
                    return (
                      <DbWriteToolCallCard
                        key={index}
                        index={index}
                        toolCall={dbWriteCall}
                        isExpanded={expandedToolCalls.has(index)}
                        onToggleExpand={() => toggleToolCallExpanded(index)}
                        copyToClipboard={copyToClipboard}
                      />
                    );
                  }

                  const v2Call = call as
                    | VectorSearchToolCall
                    | VectorSearchWithRerankingToolCall;
                  const toolCall = call as ToolCall;
                  const retrievalCall = call as RetrievalCall;

                  // Get results based on schema
                  let results: any[] = [];
                  if (isV2Schema) {
                    results = v2Call.output?.results || [];
                  } else if (isNewSchema) {
                    results = toolCall.results || [];
                  } else {
                    results = retrievalCall.reranked_results || [];
                  }

                  // Get tool name
                  let toolName = "Retrieval Call";
                  if (isV2Schema) {
                    toolName = v2Call.toolName || "Vector Search";
                  } else if (isNewSchema) {
                    toolName = toolCall.name || "Retrieval Call";
                  }

                  // Get tool type for v2 schema
                  const toolType = isV2Schema ? v2Call.toolType : undefined;

                  return (
                    <div
                      key={index}
                      className="bg-gray-800/50 border border-gray-600/50 rounded-lg p-4"
                    >
                      {/* Tool Call Header with Expand/Collapse */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-400">
                            #{index + 1}
                          </span>
                          <DocumentTextIcon className="w-5 h-5 text-blue-400" />
                          <h3 className="text-lg font-medium text-white">
                            {toolName}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-400">Chunks:</span>
                            <span className="text-xs font-medium text-white">
                              {results.length}
                            </span>
                          </div>
                          <button
                            onClick={() => toggleToolCallExpanded(index)}
                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center"
                          >
                            {expandedToolCalls.has(index) ? (
                              <>
                                <ChevronUpIcon className="w-4 h-4 mr-1" />
                                Hide Details
                              </>
                            ) : (
                              <>
                                <ChevronDownIcon className="w-4 h-4 mr-1" />
                                Show Details
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Query, Namespace, and Index - Always visible */}
                      <div className="mb-3">
                        {/* Tool Type (v2 schema only) */}
                        {isV2Schema && toolType && (
                          <div className="flex items-start space-x-2 mb-2">
                            <span className="text-blue-400 font-medium text-sm">
                              Tool Type:
                            </span>
                            <span className="text-white text-sm bg-gray-800 p-2 rounded">
                              {toolType === "vectorSearch"
                                ? "Vector Search"
                                : toolType === "vectorSearchWithReranking"
                                ? "Vector Search with Reranking"
                                : toolType === "dbRead"
                                ? "Database Query"
                                : toolType === "dbWrite"
                                ? "Database Write"
                                : toolType === "unknown"
                                ? "Unknown Tool"
                                : toolType}
                            </span>
                          </div>
                        )}
                        
                        {/* Query */}
                        <div className="flex items-start space-x-2">
                          <span className="text-blue-400 font-medium text-sm">
                            Query:
                          </span>
                          <span className="text-white text-sm bg-gray-800 p-2 rounded">
                            {isV2Schema
                              ? v2Call.input?.query
                              : isNewSchema
                              ? toolCall.query
                              : retrievalCall.query}
                          </span>
                        </div>

                        {/* Top K (v2 schema only) */}
                        {isV2Schema && v2Call.input?.topK && (
                          <div className="flex items-start space-x-2 mt-2">
                            <span className="text-blue-400 font-medium text-sm">
                              Top K:
                            </span>
                            <span className="text-white text-sm bg-gray-800 p-2 rounded">
                              {v2Call.input.topK}
                            </span>
                          </div>
                        )}

                        {/* Namespace */}
                        {((isV2Schema && v2Call.output?.namespace) ||
                          (isNewSchema && toolCall.namespace) ||
                          (!isNewSchema && !isV2Schema && retrievalCall.namespace)) && (
                          <div className="flex items-start space-x-2 mt-2">
                            <span className="text-blue-400 font-medium text-sm">
                              Namespace:
                            </span>
                            <span className="text-white text-sm bg-gray-800 p-2 rounded">
                              {isV2Schema
                                ? v2Call.output.namespace
                                : isNewSchema
                                ? toolCall.namespace
                                : retrievalCall.namespace}
                            </span>
                          </div>
                        )}

                        {/* Index */}
                        {((isV2Schema && v2Call.output?.index) ||
                          (isNewSchema && toolCall.index)) && (
                          <div className="flex items-start space-x-2 mt-2">
                            <span className="text-blue-400 font-medium text-sm">
                              Index:
                            </span>
                            <span className="text-white text-sm bg-gray-800 p-2 rounded">
                              {isV2Schema ? v2Call.output.index : toolCall.index}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Expanded Content */}
                      {expandedToolCalls.has(index) && (
                        <div className="mt-4 pt-4 border-t border-gray-600/30">
                          {/* Results Section */}
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-300 mb-3">
                              Retrieved Chunks ({results.length})
                            </h4>
                            {results.length === 0 ? (
                              <div className="text-center py-4 text-gray-400 text-sm">
                                No chunks retrieved for this tool call
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {results.map((result, resultIndex) => {
                                  const filename = getFilename(result);
                                  const score = getScore(result);
                                  const similarityScore = getSimilarityScore(result);

                                  return (
                                    <div
                                      key={resultIndex}
                                      className="bg-gray-800/30 border border-gray-600/30 rounded-lg p-3"
                                    >
                                      {/* Chunk Header */}
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-2">
                                          <span className="text-sm text-gray-400">
                                            #{resultIndex + 1}
                                          </span>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                          <div className="flex items-center space-x-1">
                                            <span className="text-xs text-gray-400">
                                              {isNewSchema ? "Score" : "Relevance"}:
                                            </span>
                                            <span className="text-xs font-medium text-white">
                                              {(score * 100).toFixed(1)}%
                                            </span>
                                          </div>
                                          {similarityScore !== undefined && (
                                            <div className="flex items-center space-x-1">
                                              <span className="text-xs text-gray-400">
                                                Similarity:
                                              </span>
                                              <span className="text-xs font-medium text-blue-400">
                                                {(similarityScore * 100).toFixed(1)}%
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Filename */}
                                      {filename && (
                                        <div className="mb-3">
                                          <span
                                            className="text-sm font-medium text-blue-400 bg-blue-900/20 px-3 py-1 rounded-lg border border-blue-700/30 cursor-pointer hover:bg-blue-900/30 transition-colors"
                                            title={filename}
                                            onClick={() => copyToClipboard(filename)}
                                          >
                                            📃 {ellipsizeFilename(filename)}
                                          </span>
                                        </div>
                                      )}

                                      {/* Metadata Display for v2 schema */}
                                      {isV2Schema && result.metadata && (
                                        <div className="mt-3 pt-3 border-t border-gray-600/30">
                                          <h5 className="text-xs font-medium text-gray-400 mb-2">
                                            Metadata
                                          </h5>
                                          <div className="space-y-1 text-xs">
                                            {isQaMetadata(result.metadata) ? (
                                              <>
                                                <div className="flex space-x-2">
                                                  <span className="text-gray-500">Row:</span>
                                                  <span className="text-gray-300">
                                                    {result.metadata.row_number}
                                                  </span>
                                                </div>
                                                <div className="flex space-x-2">
                                                  <span className="text-gray-500">User ID:</span>
                                                  <span className="text-gray-300">
                                                    {result.metadata.user_id}
                                                  </span>
                                                </div>
                                                <div className="flex space-x-2">
                                                  <span className="text-gray-500">Email:</span>
                                                  <span className="text-gray-300">
                                                    {result.metadata.user_email}
                                                  </span>
                                                </div>
                                                <div className="flex space-x-2">
                                                  <span className="text-gray-500">Uploaded:</span>
                                                  <span className="text-gray-300">
                                                    {new Date(
                                                      parseInt(result.metadata.upload_timestamp)
                                                    ).toLocaleDateString()}
                                                  </span>
                                                </div>
                                              </>
                                            ) : isTextDocumentMetadata(result.metadata) ? (
                                              <>
                                                <div className="flex space-x-2">
                                                  <span className="text-gray-500">Chunk:</span>
                                                  <span className="text-gray-300">
                                                    {result.metadata.chunkNumber} of{" "}
                                                    {result.metadata.totalChunks}
                                                  </span>
                                                </div>
                                                <div className="flex space-x-2">
                                                  <span className="text-gray-500">Chunk ID:</span>
                                                  <span className="text-gray-300">
                                                    {result.metadata.chunkId}
                                                  </span>
                                                </div>
                                                <div className="flex space-x-2">
                                                  <span className="text-gray-500">Tokens:</span>
                                                  <span className="text-gray-300">
                                                    {result.metadata.chunkSizeTokens}
                                                  </span>
                                                </div>
                                                <div className="flex space-x-2">
                                                  <span className="text-gray-500">Uploaded:</span>
                                                  <span className="text-gray-300">
                                                    {new Date(
                                                      parseInt(result.metadata.uploadTimestamp)
                                                    ).toLocaleDateString()}
                                                  </span>
                                                </div>
                                                {/* Display custom YAML front matter fields */}
                                                {Object.keys(result.metadata)
                                                  .filter((key) => key.startsWith("file_"))
                                                  .map((key) => (
                                                    <div key={key} className="flex space-x-2">
                                                      <span className="text-gray-500">
                                                        {key.replace("file_", "").replace(/_/g, " ")}:
                                                      </span>
                                                      <span className="text-gray-300">
                                                        {String(result.metadata[key])}
                                                      </span>
                                                    </div>
                                                  ))}
                                              </>
                                            ) : null}
                                          </div>
                                        </div>
                                      )}

                                      {/* Actions */}
                                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-600/30">
                                        <button
                                          onClick={() =>
                                            toggleChunkExpanded(index, resultIndex)
                                          }
                                          className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center"
                                        >
                                          {expandedChunks.has(
                                            `${index}-${resultIndex}`
                                          ) ? (
                                            <>
                                              <ChevronUpIcon className="w-4 h-4 mr-1" />
                                              Hide Content
                                            </>
                                          ) : (
                                            <>
                                              <ChevronDownIcon className="w-4 h-4 mr-1" />
                                              Show Content
                                            </>
                                          )}
                                        </button>
                                        <button
                                          onClick={() =>
                                            copyChunkContent(getContent(result))
                                          }
                                          className="text-xs text-gray-400 hover:text-gray-300 transition-colors flex items-center space-x-1"
                                        >
                                          <svg
                                            className="w-3 h-3"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                            />
                                          </svg>
                                          <span>Copy</span>
                                        </button>
                                      </div>

                                      {/* Chunk Content - Only shown when expanded */}
                                      {expandedChunks.has(
                                        `${index}-${resultIndex}`
                                      ) && (
                                        <div className="mt-3 bg-gray-900/50 p-3 rounded border border-gray-600/30 overflow-x-auto">
                                          <div className="text-xs text-gray-500 mb-2 flex items-center">
                                            <ChevronDownIcon className="w-3 h-3 mr-1" />
                                            Full Content
                                          </div>
                                          {isV2Schema &&
                                          result.metadata &&
                                          isQaMetadata(result.metadata) ? (
                                            <div className="space-y-3">
                                              <div>
                                                <div className="text-xs font-medium text-blue-400 mb-1">
                                                  Question:
                                                </div>
                                                <div
                                                  className="text-sm text-gray-300 leading-relaxed"
                                                  style={{ whiteSpace: "pre-wrap" }}
                                                >
                                                  {result.metadata.q}
                                                </div>
                                              </div>
                                              <div>
                                                <div className="text-xs font-medium text-green-400 mb-1">
                                                  Answer:
                                                </div>
                                                <div
                                                  className="text-sm text-gray-300 leading-relaxed"
                                                  style={{ whiteSpace: "pre-wrap" }}
                                                >
                                                  {result.metadata.a}
                                                </div>
                                              </div>
                                            </div>
                                          ) : (
                                            <div
                                              className="text-sm text-gray-300 leading-relaxed font-mono"
                                              style={{ whiteSpace: "pre-wrap" }}
                                            >
                                              {getContent(result)}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Message (legacy only) */}
                          {!isNewSchema && retrievalCall.message && (
                            <div className="mt-4 pt-4 border-t border-gray-600/30">
                              <h4 className="text-sm font-medium text-gray-300 mb-2">
                                Tool Message:
                              </h4>
                              <p className="text-gray-200 text-sm bg-gray-800/50 p-3 rounded border border-gray-600/50">
                                {retrievalCall.message}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Database Read Tool Call Card Component
interface DbReadToolCallCardProps {
  index: number;
  toolCall: DbReadToolCall;
  isExpanded: boolean;
  onToggleExpand: () => void;
  copyToClipboard: (text: string) => void;
}

function DbReadToolCallCard({
  index,
  toolCall,
  isExpanded,
  onToggleExpand,
  copyToClipboard,
}: DbReadToolCallCardProps) {
  const rows = toolCall.output?.rows || [];
  const columns = toolCall.output?.columns || 
    (rows.length > 0 ? Object.keys(rows[0]) : []);
  const tableName = toolCall.input?.table || toolCall.output?.table || "Unknown Table";

  // Format table name for display
  const formatTableName = (name: string) => 
    name.split("_").map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(" ");

  // Format cell value for display
  const formatCellValue = (value: unknown): string => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  // Truncate long values
  const truncateValue = (value: string, maxLength: number = 50): string => {
    if (value.length <= maxLength) return value;
    return value.substring(0, maxLength) + "...";
  };

  return (
    <div className="bg-gray-800/50 border border-gray-600/50 rounded-lg p-4">
      {/* Tool Call Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">#{index + 1}</span>
          <CircleStackIcon className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-medium text-white">
            {toolCall.toolName || "Database Query"}
          </h3>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-400">Rows:</span>
            <span className="text-xs font-medium text-white">{rows.length}</span>
          </div>
          <button
            onClick={onToggleExpand}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center"
          >
            {isExpanded ? (
              <>
                <ChevronUpIcon className="w-4 h-4 mr-1" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDownIcon className="w-4 h-4 mr-1" />
                Show Details
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tool Type & Table */}
      <div className="mb-3">
        <div className="flex items-start space-x-2 mb-2">
          <span className="text-green-400 font-medium text-sm">Tool Type:</span>
          <span className="text-white text-sm bg-gray-800 p-2 rounded">
            Database Query
          </span>
        </div>
        <div className="flex items-start space-x-2">
          <span className="text-green-400 font-medium text-sm">Table:</span>
          <span className="text-white text-sm bg-gray-800 p-2 rounded flex items-center">
            <TableCellsIcon className="w-4 h-4 mr-2 text-green-400" />
            {formatTableName(tableName)}
          </span>
        </div>
        {toolCall.input?.limit && (
          <div className="flex items-start space-x-2 mt-2">
            <span className="text-green-400 font-medium text-sm">Limit:</span>
            <span className="text-white text-sm bg-gray-800 p-2 rounded">
              {toolCall.input.limit}
            </span>
          </div>
        )}
        {toolCall.input?.columns && toolCall.input.columns.length > 0 && (
          <div className="flex items-start space-x-2 mt-2">
            <span className="text-green-400 font-medium text-sm">Columns:</span>
            <span className="text-white text-sm bg-gray-800 p-2 rounded">
              {toolCall.input.columns.join(", ")}
            </span>
          </div>
        )}
        {toolCall.input?.filters && Object.keys(toolCall.input.filters).length > 0 && (
          <div className="flex items-start space-x-2 mt-2">
            <span className="text-green-400 font-medium text-sm">Filters:</span>
            <span className="text-white text-sm bg-gray-800 p-2 rounded font-mono">
              {JSON.stringify(toolCall.input.filters)}
            </span>
          </div>
        )}
      </div>

      {/* Expanded Content - Results Table */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-600/30">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-300">
              Query Results ({rows.length} rows)
            </h4>
            <button
              onClick={() => copyToClipboard(JSON.stringify(rows, null, 2))}
              className="text-xs text-gray-400 hover:text-gray-300 transition-colors flex items-center space-x-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy JSON</span>
            </button>
          </div>

          {rows.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-sm">
              No rows returned from this query
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-800/50 border-b border-gray-600/30">
                    {columns.map((col, colIndex) => (
                      <th
                        key={colIndex}
                        className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                      >
                        {col.replace(/_/g, " ")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {rows.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className="hover:bg-gray-700/20 transition-colors"
                    >
                      {columns.map((col, colIndex) => {
                        const value = formatCellValue(row[col]);
                        const isTruncated = value.length > 50;
                        return (
                          <td
                            key={colIndex}
                            className="px-3 py-2 text-gray-300 whitespace-nowrap"
                            title={isTruncated ? value : undefined}
                          >
                            {truncateValue(value)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Row Details - Show full JSON for each row */}
          <details className="mt-4">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
              View Raw Data (JSON)
            </summary>
            <div className="mt-2 bg-gray-900/50 p-3 rounded border border-gray-600/30 overflow-x-auto">
              <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap">
                {JSON.stringify(rows, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

// Database Write Tool Call Card Component
interface DbWriteToolCallCardProps {
  index: number;
  toolCall: DbWriteToolCall;
  isExpanded: boolean;
  onToggleExpand: () => void;
  copyToClipboard: (text: string) => void;
}

function DbWriteToolCallCard({
  index,
  toolCall,
  isExpanded,
  onToggleExpand,
  copyToClipboard,
}: DbWriteToolCallCardProps) {
  const tableName = toolCall.input?.table || toolCall.output?.table || "Unknown Table";
  const success = toolCall.output?.success ?? false;
  const insertedRecord = toolCall.output?.record;
  const insertedId = toolCall.output?.insertedId;
  const error = toolCall.output?.error;

  // Format table name for display
  const formatTableName = (name: string) =>
    name.split("_").map((word) =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(" ");

  // PencilSquareIcon component (inline to avoid import issues)
  const PencilSquareIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );

  return (
    <div className="bg-gray-800/50 border border-gray-600/50 rounded-lg p-4">
      {/* Tool Call Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">#{index + 1}</span>
          <PencilSquareIcon className="w-5 h-5 text-orange-400" />
          <h3 className="text-lg font-medium text-white">
            {toolCall.toolName || "Database Write"}
          </h3>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
              success 
                ? "bg-green-600/20 text-green-400 border border-green-500/40"
                : "bg-red-600/20 text-red-400 border border-red-500/40"
            }`}>
              {success ? "Success" : "Failed"}
            </span>
          </div>
          <button
            onClick={onToggleExpand}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center"
          >
            {isExpanded ? (
              <>
                <ChevronUpIcon className="w-4 h-4 mr-1" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDownIcon className="w-4 h-4 mr-1" />
                Show Details
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tool Type & Table */}
      <div className="mb-3">
        <div className="flex items-start space-x-2 mb-2">
          <span className="text-orange-400 font-medium text-sm">Tool Type:</span>
          <span className="text-white text-sm bg-gray-800 p-2 rounded">
            Database Write
          </span>
        </div>
        <div className="flex items-start space-x-2">
          <span className="text-orange-400 font-medium text-sm">Table:</span>
          <span className="text-white text-sm bg-gray-800 p-2 rounded flex items-center">
            <TableCellsIcon className="w-4 h-4 mr-2 text-orange-400" />
            {formatTableName(tableName)}
          </span>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-600/30">
          {/* Input Data */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-300">Input Data</h4>
              <button
                onClick={() => copyToClipboard(JSON.stringify(toolCall.input?.data || {}, null, 2))}
                className="text-xs text-gray-400 hover:text-gray-300 transition-colors flex items-center space-x-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy</span>
              </button>
            </div>
            <div className="bg-gray-900/50 p-3 rounded border border-gray-600/30 overflow-x-auto">
              <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                {JSON.stringify(toolCall.input?.data || {}, null, 2)}
              </pre>
            </div>
          </div>

          {/* Output */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Result</h4>
            
            {error ? (
              <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {insertedId && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 text-sm">Inserted ID:</span>
                    <span className="text-green-400 text-sm font-mono bg-gray-800 px-2 py-1 rounded">
                      {insertedId}
                    </span>
                  </div>
                )}
                
                {insertedRecord && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">Inserted Record:</span>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(insertedRecord, null, 2))}
                        className="text-xs text-gray-400 hover:text-gray-300 transition-colors flex items-center space-x-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>Copy</span>
                      </button>
                    </div>
                    <div className="bg-gray-900/50 p-3 rounded border border-gray-600/30 overflow-x-auto">
                      <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                        {JSON.stringify(insertedRecord, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {!insertedId && !insertedRecord && success && (
                  <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3">
                    <p className="text-green-400 text-sm">Record inserted successfully</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Add missing ChevronUpIcon
const ChevronUpIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 15l7-7 7 7"
    />
  </svg>
);
