"use client";

import * as React from "react";

import {
  ChatContext,
  ChatDispatchContext,
} from "@/app/dashboard/agent-chat/chat-session-context";
import { useEnterSubmit } from "@/shared/hooks/use-enter-submit";
import { nanoid } from "@/shared/utils";
import { callAgent, callContactAgent } from "@/services/callAgent";
import type { ChatAttachment } from "@/services/callAgent";
import { uploadChatFile, GcsCredentialMissingError } from "@/services/uploadChatFile";
import { errorToast } from "@/shared/toasts/errorToast";
import { ResizableTextarea } from "@/components/shared/resizable-textarea";
import { StopIcon, PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { ArrowsPointingOutIcon, XMarkIcon, PaperClipIcon } from "@heroicons/react/24/outline";

const ACCEPTED_FILE_TYPES = ".pdf,.png,.jpg,.jpeg,.txt,.csv,.md";

export function PromptForm({
  input,
  setInput,
  sessionId,
}: {
  input: string;
  setInput: (value: string) => void;
  sessionId: string;
}) {
  const { formRef, onKeyDown } = useEnterSubmit();
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const expandedRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = React.useState(false);
  const [attachedFile, setAttachedFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);

  const dispatch = React.useContext(ChatDispatchContext);
  const chatState = React.useContext(ChatContext);
  const isRequestInFlight = chatState.completionLoading;

  if (!dispatch) {
    console.error("ChatDispatchContext is not provided");
    return (
      <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg text-red-400 text-sm">
        Chat context is not available. Please refresh the page.
      </div>
    );
  }

  const handleStopRequest = () => {
    if (dispatch) {
      dispatch({ type: "ABORT_CURRENT_REQUEST" });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Don't allow Enter submission if request is in flight
    if (isRequestInFlight) {
      return;
    }
    onKeyDown(event);
  };

  return (
    <form
      ref={formRef}
      onSubmit={async (e: any) => {
        const humanMessageId = nanoid();
        const prompt = input.trim();
        const fileToSend = attachedFile;
        try {
          e.preventDefault();

          if ((!prompt && !fileToSend) || isRequestInFlight || uploading) return;
          setInput("");

          if (!dispatch) {
            throw new Error("ChatDispatchContext is not available");
          }

          // Step 1: persist the attachment to the account's GCS bucket first.
          // A missing-credential 400 aborts the send with a clear prompt.
          let attachment: ChatAttachment | undefined;
          if (fileToSend) {
            setUploading(true);
            try {
              const ref = await uploadChatFile(fileToSend, sessionId);
              attachment = {
                file: fileToSend,
                gcsBucket: ref.gcs_bucket,
                gcsFilePath: ref.gcs_file_path,
              };
            } catch (uploadError: any) {
              setUploading(false);
              setInput(prompt); // restore the prompt so the user can retry
              if (uploadError instanceof GcsCredentialMissingError) {
                errorToast(uploadError.message);
              } else {
                errorToast(uploadError?.message || "Failed to upload file");
              }
              return;
            }
            setUploading(false);
            setAttachedFile(null);
          }

          // Abort any existing request
          if (chatState.currentRequest) {
            dispatch({ type: "ABORT_CURRENT_REQUEST" });
          }

          // Create new AbortController for this request
          const abortController = new AbortController();
          dispatch({ type: "SET_CURRENT_REQUEST", payload: abortController });

          dispatch({
            type: "ADD_MESSAGE",
            payload: {
              id: humanMessageId,
              content: fileToSend ? `${prompt}\n\n📎 ${fileToSend.name}`.trim() : prompt,
              role: "human",
              error: null,
            },
          });

          dispatch({
            type: "SET_COMPLETION_LOADING",
            payload: true,
          });

          // Contact-scoped chat streams via the dedicated endpoint (the agent
          // is server-fixed; no agentId). Otherwise stream the selected agent.
          if (chatState.contactId != null) {
            await callContactAgent(sessionId, prompt, dispatch, abortController, attachment);
          } else {
            const agentId = chatState.agentId;
            if (!agentId) {
              throw new Error("Agent ID is required");
            }
            await callAgent(agentId, sessionId, prompt, dispatch, abortController, attachment);
          }

          dispatch({
            type: "SET_COMPLETION_LOADING",
            payload: false,
          });
          dispatch({ type: "SET_CURRENT_REQUEST", payload: null });
        } catch (error: any) {
          dispatch({
            type: "SET_COMPLETION_LOADING",
            payload: false,
          });
          dispatch({ type: "SET_CURRENT_REQUEST", payload: null });

          if (error.name === "AbortError") {
            // Don't show error for cancelled requests
            return;
          }

          dispatch({
            type: "EDIT_MESSAGE",
            payload: {
              id: humanMessageId,
              error: error,
            },
          });
          console.error(error);
        }
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          setAttachedFile(file);
          // Reset so selecting the same file again re-triggers onChange.
          e.target.value = "";
        }}
      />

      {attachedFile && (
        <div className="mb-2 flex items-center gap-2 w-fit max-w-full rounded-md bg-gray-700/70 border border-gray-600 px-2 py-1 text-sm text-gray-200">
          <PaperClipIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
          <span className="truncate max-w-[16rem]">{attachedFile.name}</span>
          {uploading && <span className="text-xs text-gray-400">uploading…</span>}
          <button
            type="button"
            onClick={() => setAttachedFile(null)}
            disabled={uploading}
            className="flex-shrink-0 text-gray-400 hover:text-white disabled:opacity-50"
            title="Remove attachment"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-background">
        <ResizableTextarea
          ref={inputRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          placeholder="Send a message."
          className="bg-slate-50 block w-full rounded-md border-0 py-1.5 text-gray-200 bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 pl-4 pr-20"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          name="message"
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          minHeight={80}
          maxHeight={240}
          disabled={isRequestInFlight}
        />
        <div className="absolute bottom-2 right-2 flex items-center space-x-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isRequestInFlight || uploading}
            className="flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Attach a file"
          >
            <PaperClipIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            title="Expand editor"
          >
            <ArrowsPointingOutIcon className="w-4 h-4" />
          </button>
          {isRequestInFlight ? (
            <button
              type="button"
              onClick={handleStopRequest}
              className="flex items-center justify-center w-8 h-8 rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors"
              title="Stop request"
            >
              <StopIcon className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={(!input.trim() && !attachedFile) || isRequestInFlight || uploading}
              className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white transition-colors"
              title="Send message"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setExpanded(false)}
          />
          <div className="relative bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col" style={{ height: "70vh" }}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
              <h3 className="text-sm font-medium text-gray-300">Compose Message</h3>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 p-4 overflow-hidden">
              <textarea
                ref={expandedRef}
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Write your prompt here..."
                className="w-full h-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 sm:text-sm resize-none"
                spellCheck={false}
                disabled={isRequestInFlight}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && input.trim() && !isRequestInFlight) {
                    setExpanded(false);
                    formRef.current?.requestSubmit();
                  }
                }}
              />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-700">
              <p className="text-xs text-gray-500">
                {navigator.platform?.includes("Mac") ? "⌘" : "Ctrl"}+Enter to send
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="px-3 py-1.5 text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={!input.trim() || isRequestInFlight}
                  onClick={() => {
                    setExpanded(false);
                    formRef.current?.requestSubmit();
                  }}
                  className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
