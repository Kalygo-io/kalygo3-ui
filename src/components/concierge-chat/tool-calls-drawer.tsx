import React, { useState, useEffect } from "react";
import {
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  ChevronDownIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { DrawerCloseButton } from "@/components/shared/drawer-close-button";
import { useCopyToClipboard } from "@/shared/hooks/use-copy-to-clipboard";

// Tool call types for concierge chat - flexible to handle multiple formats
interface VectorSearchResult {
  content?: string;
  score?: number;
  chunk_id?: string;
  metadata?: {
    filename?: string;
    source?: string;
    file_name?: string;
    content?: string;
    chunkId?: string;
    chunkNumber?: number;
    totalChunks?: number;
    chunkSizeTokens?: number;
    uploadTimestamp?: string;
    // QA metadata
    q?: string;
    a?: string;
    row_number?: number;
    user_id?: number;
    user_email?: string;
    upload_timestamp?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Flexible tool call type that can handle both v1 and v2 schemas
interface ConciergeToolCall {
  // V2 schema fields
  toolType?: string;
  toolName?: string;
  input?: {
    query?: string;
    topK?: number;
    [key: string]: unknown;
  };
  output?: {
    results?: VectorSearchResult[];
    namespace?: string;
    index?: string;
    [key: string]: unknown;
  };
  startTime?: number;
  endTime?: number;
  // V1 schema fields (from Message.ToolCall)
  name?: string;
  query?: string;
  namespace?: string;
  index?: string;
  results?: VectorSearchResult[];
  // Allow any additional fields
  [key: string]: unknown;
}

interface ConciergeToolCallsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  // Accept any array type for flexibility
  toolCalls?: ConciergeToolCall[] | unknown[];
}

// Type guards
function isQaMetadata(metadata: Record<string, unknown>): boolean {
  return "q" in metadata && "a" in metadata && "row_number" in metadata;
}

function isTextDocumentMetadata(metadata: Record<string, unknown>): boolean {
  return "chunkId" in metadata && "totalChunks" in metadata;
}

export function ConciergeToolCallsDrawer({
  isOpen,
  onClose,
  toolCalls = [],
}: ConciergeToolCallsDrawerProps) {
  const [expandedToolCalls, setExpandedToolCalls] = useState<Set<number>>(
    new Set()
  );
  const [expandedChunks, setExpandedChunks] = useState<Set<string>>(new Set());
  const { copyToClipboard } = useCopyToClipboard({ timeout: 2000 });

  // Expand all tool calls and chunks by default when drawer opens
  useEffect(() => {
    if (isOpen && toolCalls.length > 0) {
      // Expand all tool calls
      setExpandedToolCalls(new Set(toolCalls.map((_, index) => index)));
      
      // Expand all chunks
      const allChunkKeys = new Set<string>();
      toolCalls.forEach((rawCall, toolCallIndex) => {
        const call = rawCall as ConciergeToolCall;
        // Check both v1 and v2 schema locations for results
        const results = call.output?.results || call.results;
        if (results) {
          results.forEach((_, chunkIndex) => {
            allChunkKeys.add(`${toolCallIndex}-${chunkIndex}`);
          });
        }
      });
      setExpandedChunks(allChunkKeys);
    }
  }, [isOpen, toolCalls]);

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

  const formatToolType = (type: string | undefined): string => {
    if (!type || type === "unknown") return "Tool";
    if (type === "vectorSearch") return "Vector Search";
    if (type === "vectorSearchWithReranking") return "Vector Search with Reranking";
    return type
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const formatDuration = (start?: number, end?: number): string | null => {
    if (!start || !end) return null;
    const duration = end - start;
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
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

  const getFilename = (result: VectorSearchResult): string | undefined => {
    return (
      result.metadata?.filename ||
      result.metadata?.source ||
      result.metadata?.file_name
    );
  };

  const getContent = (result: VectorSearchResult): string => {
    return result.metadata?.content || result.content || "";
  };

  // Calculate total chunks
  const totalChunks = toolCalls.reduce<number>((total, rawCall) => {
    const call = rawCall as ConciergeToolCall;
    const results = call.output?.results || call.results;
    return total + (results?.length || 0);
  }, 0);

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-gray-900 border-l border-purple-700/50 shadow-2xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-purple-700/50">
            <div className="flex items-center space-x-3">
              <WrenchScrewdriverIcon className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">
                Tool Calls & References
              </h2>
            </div>
            <DrawerCloseButton onClose={onClose} />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Contextual Information */}
            <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
                <InformationCircleIcon className="w-5 h-5 text-purple-400 mr-2" />
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
                  <span className="text-purple-400 font-medium">
                    Tool Calls Made:
                  </span>
                  <span className="text-white">{toolCalls.length}</span>
                </div>
                {totalChunks > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-purple-400 font-medium">
                      Total Results Retrieved:
                    </span>
                    <span className="text-white">{totalChunks}</span>
                  </div>
                )}
              </div>
            </div>

            {toolCalls.length === 0 ? (
              <div className="text-center py-8">
                <DocumentTextIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">
                  No tool calls found for this message
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-white mb-3">
                  Tool Calls ({toolCalls.length})
                </h4>

                {toolCalls.map((rawCall, index) => {
                  // Cast to ConciergeToolCall to access properties
                  const call = rawCall as ConciergeToolCall;
                  
                  const duration = formatDuration(call.startTime, call.endTime);
                  
                  // Get results from either v2 schema (output.results) or v1 schema (results)
                  const results: VectorSearchResult[] = 
                    call.output?.results || 
                    call.results || 
                    [];
                  
                  // Get tool name from either schema
                  const toolName = call.toolName || call.name || "Unknown Tool";
                  
                  // Get tool type - check multiple sources
                  const toolType = call.toolType || 
                    (call.name?.includes("rerank") ? "vectorSearchWithReranking" : "vectorSearch");
                  
                  const isVectorSearch = toolType === "vectorSearch" || toolType === "vectorSearchWithReranking" || results.length > 0;
                  
                  return (
                    <div
                      key={index}
                      className="bg-gray-800/50 border border-gray-600/50 rounded-lg p-4"
                    >
                      {/* Tool Call Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-400">
                            #{index + 1}
                          </span>
                          {isVectorSearch ? (
                            <MagnifyingGlassIcon className="w-5 h-5 text-purple-400" />
                          ) : (
                            <WrenchScrewdriverIcon className="w-5 h-5 text-purple-400" />
                          )}
                          <h3 className="text-lg font-medium text-white">
                            {toolName}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-3">
                          {results.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-gray-400">Chunks:</span>
                              <span className="text-xs font-medium text-white">
                                {results.length}
                              </span>
                            </div>
                          )}
                          {duration && (
                            <span className="text-xs text-gray-400">
                              {duration}
                            </span>
                          )}
                          <button
                            onClick={() => toggleToolCallExpanded(index)}
                            className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center"
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

                      {/* Tool Type & Query - Always visible */}
                      <div className="mb-3">
                        <div className="flex items-start space-x-2 mb-2">
                          <span className="text-purple-400 font-medium text-sm">
                            Tool Type:
                          </span>
                          <span className="text-white text-sm bg-gray-800 p-2 rounded">
                            {formatToolType(toolType)}
                          </span>
                        </div>
                        
                        {/* Query - check both schemas */}
                        {(call.input?.query || call.query) && (
                          <div className="flex items-start space-x-2 mb-2">
                            <span className="text-purple-400 font-medium text-sm">
                              Query:
                            </span>
                            <span className="text-white text-sm bg-gray-800 p-2 rounded">
                              {call.input?.query || call.query}
                            </span>
                          </div>
                        )}

                        {/* Top K */}
                        {call.input?.topK && (
                          <div className="flex items-start space-x-2 mb-2">
                            <span className="text-purple-400 font-medium text-sm">
                              Top K:
                            </span>
                            <span className="text-white text-sm bg-gray-800 p-2 rounded">
                              {call.input.topK}
                            </span>
                          </div>
                        )}

                        {/* Namespace - check both schemas */}
                        {(call.output?.namespace || call.namespace) && (
                          <div className="flex items-start space-x-2 mb-2">
                            <span className="text-purple-400 font-medium text-sm">
                              Namespace:
                            </span>
                            <span className="text-white text-sm bg-gray-800 p-2 rounded">
                              {call.output?.namespace || call.namespace}
                            </span>
                          </div>
                        )}

                        {/* Index - check both schemas */}
                        {(call.output?.index || call.index) && (
                          <div className="flex items-start space-x-2">
                            <span className="text-purple-400 font-medium text-sm">
                              Index:
                            </span>
                            <span className="text-white text-sm bg-gray-800 p-2 rounded">
                              {call.output?.index || call.index}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Expanded Content - Results */}
                      {expandedToolCalls.has(index) && (
                        <div className="mt-4 pt-4 border-t border-gray-600/30">
                          {/* Vector Search Results */}
                          {results.length > 0 ? (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-300 mb-3">
                                Retrieved Chunks ({results.length})
                              </h4>
                              <div className="space-y-3">
                                {results.map((result, resultIndex) => {
                                  const filename = getFilename(result);
                                  const score = result.score || 0;
                                  const metadata = result.metadata;

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
                                              Relevance:
                                            </span>
                                            <span className="text-xs font-medium text-white">
                                              {(score * 100).toFixed(1)}%
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Filename */}
                                      {filename && (
                                        <div className="mb-3">
                                          <span
                                            className="text-sm font-medium text-purple-400 bg-purple-900/20 px-3 py-1 rounded-lg border border-purple-700/30 cursor-pointer hover:bg-purple-900/30 transition-colors"
                                            title={filename}
                                            onClick={() => copyToClipboard(filename)}
                                          >
                                            📃 {ellipsizeFilename(filename)}
                                          </span>
                                        </div>
                                      )}

                                      {/* Metadata Display */}
                                      {metadata && (
                                        <div className="mt-3 pt-3 border-t border-gray-600/30">
                                          <h5 className="text-xs font-medium text-gray-400 mb-2">
                                            Metadata
                                          </h5>
                                          <div className="space-y-1 text-xs">
                                            {isQaMetadata(metadata) ? (
                                              <>
                                                <div className="flex space-x-2">
                                                  <span className="text-gray-500">Row:</span>
                                                  <span className="text-gray-300">
                                                    {metadata.row_number}
                                                  </span>
                                                </div>
                                                <div className="flex space-x-2">
                                                  <span className="text-gray-500">User ID:</span>
                                                  <span className="text-gray-300">
                                                    {metadata.user_id}
                                                  </span>
                                                </div>
                                                <div className="flex space-x-2">
                                                  <span className="text-gray-500">Email:</span>
                                                  <span className="text-gray-300">
                                                    {metadata.user_email}
                                                  </span>
                                                </div>
                                                {metadata.upload_timestamp && (
                                                  <div className="flex space-x-2">
                                                    <span className="text-gray-500">Uploaded:</span>
                                                    <span className="text-gray-300">
                                                      {new Date(
                                                        parseInt(metadata.upload_timestamp)
                                                      ).toLocaleDateString()}
                                                    </span>
                                                  </div>
                                                )}
                                              </>
                                            ) : isTextDocumentMetadata(metadata) ? (
                                              <>
                                                <div className="flex space-x-2">
                                                  <span className="text-gray-500">Chunk:</span>
                                                  <span className="text-gray-300">
                                                    {metadata.chunkNumber} of{" "}
                                                    {metadata.totalChunks}
                                                  </span>
                                                </div>
                                                <div className="flex space-x-2">
                                                  <span className="text-gray-500">Chunk ID:</span>
                                                  <span className="text-gray-300">
                                                    {metadata.chunkId}
                                                  </span>
                                                </div>
                                                {metadata.chunkSizeTokens && (
                                                  <div className="flex space-x-2">
                                                    <span className="text-gray-500">Tokens:</span>
                                                    <span className="text-gray-300">
                                                      {metadata.chunkSizeTokens}
                                                    </span>
                                                  </div>
                                                )}
                                                {metadata.uploadTimestamp && (
                                                  <div className="flex space-x-2">
                                                    <span className="text-gray-500">Uploaded:</span>
                                                    <span className="text-gray-300">
                                                      {new Date(
                                                        parseInt(metadata.uploadTimestamp)
                                                      ).toLocaleDateString()}
                                                    </span>
                                                  </div>
                                                )}
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
                                          className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center"
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
                                            copyToClipboard(getContent(result))
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
                                          {metadata && isQaMetadata(metadata) ? (
                                            <div className="space-y-3">
                                              <div>
                                                <div className="text-xs font-medium text-purple-400 mb-1">
                                                  Question:
                                                </div>
                                                <div
                                                  className="text-sm text-gray-300 leading-relaxed"
                                                  style={{ whiteSpace: "pre-wrap" }}
                                                >
                                                  {metadata.q}
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
                                                  {metadata.a}
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
                            </div>
                          ) : (
                            /* No results - show raw input/output */
                            <div>
                              {/* Input */}
                              {call.input && Object.keys(call.input).length > 0 && (
                                <div className="mb-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-medium text-gray-300">
                                      Input
                                    </h4>
                                    <button
                                      onClick={() =>
                                        copyToClipboard(
                                          JSON.stringify(call.input, null, 2)
                                        )
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
                                  <div className="bg-gray-900/50 p-3 rounded border border-gray-600/30 overflow-x-auto">
                                    <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                                      {JSON.stringify(call.input, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              )}

                              {/* Output */}
                              {call.output && Object.keys(call.output).length > 0 && (
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-medium text-gray-300">
                                      Output
                                    </h4>
                                    <button
                                      onClick={() =>
                                        copyToClipboard(
                                          JSON.stringify(call.output, null, 2)
                                        )
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
                                  <div className="bg-gray-900/50 p-3 rounded border border-gray-600/30 overflow-x-auto max-h-96 overflow-y-auto">
                                    <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                                      {JSON.stringify(call.output, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              )}

                              {/* No input/output */}
                              {(!call.input || Object.keys(call.input).length === 0) &&
                                (!call.output || Object.keys(call.output).length === 0) && (
                                  <div className="text-center py-4 text-gray-400 text-sm">
                                    No input/output data available for this tool call
                                  </div>
                                )}
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

// ChevronUpIcon component
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
