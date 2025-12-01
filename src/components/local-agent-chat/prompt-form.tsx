"use client";

import * as React from "react";

import {
  ChatContext,
  ChatDispatchContext,
} from "@/app/dashboard/local-agent/chat-session-context";
import { useEnterSubmit } from "@/shared/hooks/use-enter-submit";
import { nanoid } from "@/shared/utils";
import { callLocalAgent } from "@/services/callLocalAgent";
import { ResizableTextarea } from "@/components/shared/resizable-textarea";
import { StopIcon, PaperAirplaneIcon } from "@heroicons/react/24/solid";

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

  const dispatch = React.useContext(ChatDispatchContext);
  const chatState = React.useContext(ChatContext);
  const isRequestInFlight = chatState.completionLoading;

  const handleStopRequest = () => {
    dispatch({ type: "ABORT_CURRENT_REQUEST" });
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
        try {
          e.preventDefault();

          setInput("");
          if (!prompt || isRequestInFlight) return;

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

          await callLocalAgent(sessionId, prompt, dispatch, abortController);

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
      <div className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-background">
        <ResizableTextarea
          ref={inputRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          placeholder="Send a message."
          className="bg-slate-50 block w-full rounded-md border-0 py-1.5 text-gray-200 bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 pr-12"
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
              disabled={!input.trim() || isRequestInFlight}
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
