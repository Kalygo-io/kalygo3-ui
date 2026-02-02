"use client";

import * as React from "react";

import {
  ChatContext,
  ChatDispatchContext,
} from "@/app/dashboard/agent-chat/chat-session-context";
import { useEnterSubmit } from "@/shared/hooks/use-enter-submit";
import { nanoid } from "@/shared/utils";
import { callAgent } from "@/services/callAgent";
import { ResizableTextarea } from "@/components/shared/resizable-textarea";
import {
  StopIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  XMarkIcon,
  DocumentIcon,
} from "@heroicons/react/24/solid";

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
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [attachedFiles, setAttachedFiles] = React.useState<File[]>([]);

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const pdfFiles = Array.from(files).filter(
        (file) => file.type === "application/pdf"
      );
      setAttachedFiles((prev) => [...prev, ...pdfFiles]);
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <form
      ref={formRef}
      onSubmit={async (e: any) => {
        const humanMessageId = nanoid();
        const prompt = input.trim();
        try {
          e.preventDefault();

          setInput("");
          const filesToSend = [...attachedFiles];
          setAttachedFiles([]);
          if ((!prompt && filesToSend.length === 0) || isRequestInFlight) return;

          if (!dispatch) {
            throw new Error("ChatDispatchContext is not available");
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
              content: prompt,
              role: "human",
              error: null,
            },
          });

          dispatch({
            type: "SET_COMPLETION_LOADING",
            payload: true,
          });

          // Get agentId from context
          const agentId = chatState.agentId;
          if (!agentId) {
            throw new Error("Agent ID is required");
          }
          await callAgent(agentId, sessionId, prompt, dispatch, abortController);

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
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".pdf,application/pdf"
        multiple
        className="hidden"
      />

      {/* Attached files display */}
      {attachedFiles.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-1.5 text-sm"
            >
              <DocumentIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-gray-200 truncate max-w-[150px]" title={file.name}>
                {file.name}
              </span>
              <span className="text-gray-400 text-xs">
                ({formatFileSize(file.size)})
              </span>
              <button
                type="button"
                onClick={() => handleRemoveFile(index)}
                className="text-gray-400 hover:text-red-400 transition-colors p-0.5"
                title="Remove file"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-background">
        <ResizableTextarea
          ref={inputRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          placeholder="Send a message."
          className="bg-slate-50 block w-full rounded-md border-0 py-1.5 text-gray-200 bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 pl-10 pr-12"
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
        {/* Attachment button - bottom left */}
        <div className="absolute bottom-2 left-2">
          <button
            type="button"
            onClick={handleAttachClick}
            disabled={isRequestInFlight}
            className="flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-gray-200 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Attach PDF file"
          >
            <PaperClipIcon className="w-5 h-5" />
          </button>
        </div>
        {/* Submit/Stop button - bottom right */}
        <div className="absolute bottom-2 right-2 flex items-center space-x-2">
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
              disabled={(!input.trim() && attachedFiles.length === 0) || isRequestInFlight}
              className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white transition-colors"
              title="Send message"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
