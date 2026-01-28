import React, { useState, useEffect } from "react";
import {
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  ChevronDownIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { DrawerCloseButton } from "@/components/shared/drawer-close-button";
import { useCopyToClipboard } from "@/shared/hooks/use-copy-to-clipboard";

// Simplified tool call type for concierge chat
interface ConciergeToolCall {
  toolType?: string;
  toolName?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  startTime?: number;
  endTime?: number;
}

interface ConciergeToolCallsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  toolCalls?: ConciergeToolCall[];
}

export function ConciergeToolCallsDrawer({
  isOpen,
  onClose,
  toolCalls = [],
}: ConciergeToolCallsDrawerProps) {
  const [expandedToolCalls, setExpandedToolCalls] = useState<Set<number>>(
    new Set()
  );
  const { copyToClipboard } = useCopyToClipboard({ timeout: 2000 });

  // Expand all tool calls by default when drawer opens
  useEffect(() => {
    if (isOpen && toolCalls.length > 0) {
      setExpandedToolCalls(new Set(toolCalls.map((_, index) => index)));
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

  const formatToolType = (type: string | undefined): string => {
    if (!type || type === "unknown") return "Tool";
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

                {toolCalls.map((call, index) => {
                  const duration = formatDuration(call.startTime, call.endTime);
                  
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
                          <WrenchScrewdriverIcon className="w-5 h-5 text-purple-400" />
                          <h3 className="text-lg font-medium text-white">
                            {call.toolName || "Unknown Tool"}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-3">
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

                      {/* Tool Type */}
                      <div className="mb-3">
                        <div className="flex items-start space-x-2 mb-2">
                          <span className="text-purple-400 font-medium text-sm">
                            Tool Type:
                          </span>
                          <span className="text-white text-sm bg-gray-800 p-2 rounded">
                            {formatToolType(call.toolType)}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {expandedToolCalls.has(index) && (
                        <div className="mt-4 pt-4 border-t border-gray-600/30">
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
