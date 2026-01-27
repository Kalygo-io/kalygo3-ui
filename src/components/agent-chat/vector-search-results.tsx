import React, { useState } from "react";
import {
  VectorSearchToolCall,
  VectorSearchWithRerankingToolCall,
} from "@/ts/types/ChatMessage";
import { MetadataCard } from "./metadata-cards";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import {
  formatScore,
  getToolTypeDisplayName,
  getFilenameFromMetadata,
} from "@/ts/utils/chat-message-helpers";

interface VectorSearchResultsProps {
  toolCall: VectorSearchToolCall | VectorSearchWithRerankingToolCall;
}

export function VectorSearchResults({ toolCall }: VectorSearchResultsProps) {
  const [expandedResults, setExpandedResults] = useState<Set<number>>(
    new Set()
  );

  const toggleResult = (index: number) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedResults(newExpanded);
  };

  const isReranking = toolCall.toolType === "vectorSearchWithReranking";

  return (
    <div className="space-y-4">
      {/* Tool Call Header */}
      <div className="bg-gray-800/50 border border-gray-600/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-white">
            {isReranking ? "🔄" : "🔍"} {getToolTypeDisplayName(toolCall.toolType)}
          </h3>
          <span className="text-xs text-gray-400">
            {toolCall.output.results.length} results
          </span>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-start space-x-2">
            <span className="text-blue-400 font-medium">Query:</span>
            <span className="text-white bg-gray-800 px-2 py-1 rounded">
              {toolCall.input.query}
            </span>
          </div>

          {toolCall.input.topK && (
            <div className="flex items-start space-x-2">
              <span className="text-blue-400 font-medium">Top K:</span>
              <span className="text-white">{toolCall.input.topK}</span>
            </div>
          )}

          <div className="flex items-start space-x-2">
            <span className="text-blue-400 font-medium">Namespace:</span>
            <span className="text-white">{toolCall.output.namespace}</span>
          </div>

          <div className="flex items-start space-x-2">
            <span className="text-blue-400 font-medium">Index:</span>
            <span className="text-white">{toolCall.output.index}</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-white">
          Retrieved Results ({toolCall.output.results.length})
        </h4>

        {toolCall.output.results.map((result, index) => (
          <div
            key={index}
            className="bg-gray-800/30 border border-gray-600/30 rounded-lg overflow-hidden"
          >
            {/* Result Header */}
            <button
              onClick={() => toggleResult(index)}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-400">#{index + 1}</span>
                <span className="text-sm font-medium text-white">
                  {getFilenameFromMetadata(result.metadata)}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-400">
                  Score: {formatScore(result.score)}
                </span>
                <ChevronDownIcon
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    expandedResults.has(index) ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>

            {/* Expanded Content */}
            {expandedResults.has(index) && (
              <div className="p-4 border-t border-gray-600/30">
                <MetadataCard metadata={result.metadata} score={result.score} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
