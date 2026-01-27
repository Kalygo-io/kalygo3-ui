import React from "react";
import { TextDocumentMetadata, QaMetadata } from "@/ts/types/ChatMessage";
import {
  isQaMetadata,
  formatTimestamp,
  formatTimestampWithTime,
  formatScore,
  formatCustomFieldName,
  getCustomFields,
} from "@/ts/utils/chat-message-helpers";

interface QACardProps extends QaMetadata {
  score?: number;
}

interface DocumentCardProps extends TextDocumentMetadata {
  score?: number;
}

export function QACard(props: QACardProps) {
  return (
    <div className="bg-gray-800/30 border border-gray-600/30 rounded-lg p-4">
      <div className="space-y-3">
        {/* Score */}
        {props.score !== undefined && (
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400">Relevance Score:</span>
            <span className="text-xs font-medium text-white">
              {formatScore(props.score)}
            </span>
          </div>
        )}

        {/* Question */}
        <div>
          <div className="text-xs font-medium text-blue-400 mb-2">Question:</div>
          <div className="text-sm text-gray-300 leading-relaxed bg-gray-900/50 p-3 rounded">
            {props.q}
          </div>
        </div>

        {/* Answer */}
        <div>
          <div className="text-xs font-medium text-green-400 mb-2">Answer:</div>
          <div className="text-sm text-gray-300 leading-relaxed bg-gray-900/50 p-3 rounded">
            {props.a}
          </div>
        </div>

        {/* Metadata */}
        <div className="pt-3 border-t border-gray-600/30">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Source:</span>
              <span className="text-gray-300 ml-2">{props.filename}</span>
            </div>
            <div>
              <span className="text-gray-500">Row:</span>
              <span className="text-gray-300 ml-2">{props.row_number}</span>
            </div>
            <div>
              <span className="text-gray-500">User:</span>
              <span className="text-gray-300 ml-2">{props.user_email}</span>
            </div>
            <div>
              <span className="text-gray-500">Uploaded:</span>
              <span className="text-gray-300 ml-2">
                {formatTimestamp(props.upload_timestamp)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DocumentCard(props: DocumentCardProps) {
  return (
    <div className="bg-gray-800/30 border border-gray-600/30 rounded-lg p-4">
      <div className="space-y-3">
        {/* Header with Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-blue-400">
              📄 {props.filename}
            </span>
          </div>
          {props.score !== undefined && (
            <span className="text-xs font-medium text-white">
              {formatScore(props.score)}
            </span>
          )}
        </div>

        {/* Chunk Information */}
        <div className="flex items-center space-x-4 text-xs">
          <div>
            <span className="text-gray-500">Chunk:</span>
            <span className="text-gray-300 ml-2">
              {props.chunkNumber} of {props.totalChunks}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Tokens:</span>
            <span className="text-gray-300 ml-2">{props.chunkSizeTokens}</span>
          </div>
          <div>
            <span className="text-gray-500">ID:</span>
            <span className="text-gray-300 ml-2">{props.chunkId}</span>
          </div>
        </div>

        {/* Content */}
        <div className="mt-3 bg-gray-900/50 p-3 rounded border border-gray-600/30">
          <div
            className="text-sm text-gray-300 leading-relaxed font-mono"
            style={{ whiteSpace: "pre-wrap" }}
          >
            {props.content}
          </div>
        </div>

        {/* Custom YAML front matter fields */}
        {Object.entries(getCustomFields(props)).map(([key, value]) => (
          <div key={key} className="text-xs">
            <span className="text-gray-500">{formatCustomFieldName(key)}:</span>
            <span className="text-gray-300 ml-2">{String(value)}</span>
          </div>
        ))}

        {/* Upload timestamp */}
        <div className="pt-3 border-t border-gray-600/30 text-xs text-gray-500">
          Uploaded: {formatTimestampWithTime(props.uploadTimestamp)}
        </div>
      </div>
    </div>
  );
}

// Component to automatically render the correct card type
interface MetadataCardProps {
  metadata: TextDocumentMetadata | QaMetadata;
  score?: number;
}

export function MetadataCard({ metadata, score }: MetadataCardProps) {
  if ("q" in metadata && "a" in metadata) {
    return <QACard {...metadata} score={score} />;
  } else {
    return <DocumentCard {...metadata} score={score} />;
  }
}
