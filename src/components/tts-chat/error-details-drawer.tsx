import React from "react";
import {
  ExclamationTriangleIcon,
  ClockIcon,
  CodeBracketIcon,
} from "@heroicons/react/24/outline";
import { DrawerCloseButton } from "@/components/shared/drawer-close-button";
import { ErrorDetails } from "@/ts/types/Message";
import { useCopyToClipboard } from "@/shared/hooks/use-copy-to-clipboard";

interface TtsChatErrorDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  error: ErrorDetails;
}

export function TtsChatErrorDetailsDrawer({
  isOpen,
  onClose,
  error,
}: TtsChatErrorDetailsDrawerProps) {
  const { copyToClipboard } = useCopyToClipboard({ timeout: 2000 });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-gray-900 border-l border-red-700/50 shadow-2xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-red-700/50 bg-red-900/10">
            <div className="flex items-center space-x-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
              <h2 className="text-xl font-semibold text-white">Error Details</h2>
            </div>
            <DrawerCloseButton onClose={onClose} />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Error Summary */}
            <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-red-400 mb-2 flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                {error.error}
              </h3>
              <p className="text-white text-sm leading-relaxed">
                An error occurred while processing your request. Details are
                provided below.
              </p>
            </div>

            {/* Timestamp */}
            {error.timestamp && (
              <div className="mb-6">
                <div className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
                  <ClockIcon className="w-4 h-4" />
                  <span>Error Occurred:</span>
                </div>
                <div className="text-white bg-gray-800/50 p-3 rounded border border-gray-600/50">
                  {new Date(error.timestamp).toLocaleString()}
                </div>
              </div>
            )}

            {/* Error Message */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-300">
                  Error Message
                </h4>
                <button
                  onClick={() => copyToClipboard(error.message)}
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
              <div className="bg-gray-800/50 p-4 rounded border border-red-700/30 overflow-x-auto">
                <pre className="text-sm text-red-300 leading-relaxed whitespace-pre-wrap font-mono">
                  {error.message}
                </pre>
              </div>
            </div>

            {/* Stack Trace */}
            {error.stack && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <CodeBracketIcon className="w-4 h-4 text-gray-400" />
                    <h4 className="text-sm font-medium text-gray-300">
                      Stack Trace
                    </h4>
                  </div>
                  <button
                    onClick={() => copyToClipboard(error.stack || "")}
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
                <div className="bg-gray-900/50 p-4 rounded border border-gray-600/30 overflow-x-auto">
                  <pre className="text-xs text-gray-400 leading-relaxed whitespace-pre font-mono">
                    {error.stack}
                  </pre>
                </div>
              </div>
            )}

            {/* Help Text */}
            <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-4">
              <h4 className="text-sm font-medium text-purple-400 mb-2">
                What to do next
              </h4>
              <ul className="text-sm text-gray-300 space-y-2 list-disc list-inside">
                <li>Check if the service is available and running</li>
                <li>Verify your network connection</li>
                <li>Try your request again in a few moments</li>
                <li>
                  If the problem persists, contact support with the error
                  details above
                </li>
              </ul>
            </div>

            {/* Full Error Object (for debugging) */}
            <details className="mt-6">
              <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
                View Raw Error Object (Developer Mode)
              </summary>
              <div className="mt-3 bg-gray-900/50 p-4 rounded border border-gray-600/30 overflow-x-auto">
                <pre className="text-xs text-gray-400 leading-relaxed whitespace-pre font-mono">
                  {JSON.stringify(error, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
