import React, { useState, useEffect } from "react";
import {
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  ChevronDownIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { DrawerCloseButton } from "@/components/shared/drawer-close-button";
import { ToolCall, RetrievalCall } from "@/ts/types/Message";
import { useCopyToClipboard } from "@/shared/hooks/use-copy-to-clipboard";

interface ToolCallsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  toolCalls?: ToolCall[]; // New schema-based tool calls
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

  // Use new toolCalls if available, otherwise fall back to legacy retrievalCalls
  const allToolCalls = toolCalls.length > 0 ? toolCalls : retrievalCalls;
  const isNewSchema = toolCalls.length > 0;

  // Expand all chunks by default when drawer opens or toolCalls change
  useEffect(() => {
    if (isOpen && allToolCalls.length > 0) {
      const allChunkKeys = new Set<string>();
      allToolCalls.forEach((call, toolCallIndex) => {
        if (isNewSchema) {
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
  }, [isOpen, allToolCalls, isNewSchema]);

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
    if (isNewSchema) {
      return result.metadata?.filename || 
             result.metadata?.source || 
             result.metadata?.file_name;
    } else {
      return result.filename;
    }
  };

  // Helper to get score (new schema uses score, legacy uses relevance_score)
  const getScore = (result: any): number => {
    if (isNewSchema) {
      return result.score || 0;
    } else {
      return result.relevance_score || 0;
    }
  };

  // Helper to get similarity score (legacy only)
  const getSimilarityScore = (result: any): number | undefined => {
    if (!isNewSchema) {
      return result.similarity_score;
    }
    return undefined;
  };

  // Calculate total chunks
  const totalChunks = allToolCalls.reduce((total, call) => {
    if (isNewSchema) {
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
                bases or performing calculations.
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
                    Total Chunks Retrieved:
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
                  const toolCall = call as ToolCall;
                  const retrievalCall = call as RetrievalCall;
                  
                  // Get results based on schema
                  const results = isNewSchema 
                    ? toolCall.results || []
                    : retrievalCall.reranked_results || [];
                  
                  // Get tool name
                  const toolName = isNewSchema 
                    ? toolCall.name || "Retrieval Call"
                    : "Retrieval Call";

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
                        <div className="flex items-start space-x-2">
                          <span className="text-blue-400 font-medium text-sm">
                            Query:
                          </span>
                          <span className="text-white text-sm bg-gray-800 p-2 rounded">
                            {isNewSchema ? toolCall.query : retrievalCall.query}
                          </span>
                        </div>
                        {(isNewSchema ? toolCall.namespace : retrievalCall.namespace) && (
                          <div className="flex items-start space-x-2 mt-2">
                            <span className="text-blue-400 font-medium text-sm">
                              Namespace:
                            </span>
                            <span className="text-white text-sm bg-gray-800 p-2 rounded">
                              {isNewSchema ? toolCall.namespace : retrievalCall.namespace}
                            </span>
                          </div>
                        )}
                        {isNewSchema && toolCall.index && (
                          <div className="flex items-start space-x-2 mt-2">
                            <span className="text-blue-400 font-medium text-sm">
                              Index:
                            </span>
                            <span className="text-white text-sm bg-gray-800 p-2 rounded">
                              {toolCall.index}
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
                                              Hide Chunk
                                            </>
                                          ) : (
                                            <>
                                              <ChevronDownIcon className="w-4 h-4 mr-1" />
                                              Show Chunk
                                            </>
                                          )}
                                        </button>
                                        <button
                                          onClick={() =>
                                            copyChunkContent(result.content)
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
                                          <div
                                            className="text-sm text-gray-300 leading-relaxed font-mono"
                                            style={{ whiteSpace: "pre-wrap" }}
                                          >
                                            {result.content}
                                          </div>
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
