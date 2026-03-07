"use client";

import React from "react";
import { SwarmChatContext, SwarmChatDispatchContext } from "@/app/dashboard/hierarchical-agent-chat/chat-session-context";
import { useEnterSubmit } from "@/shared/hooks/use-enter-submit";
import { nanoid } from "@/shared/utils";
import { callSwarmCompletion } from "@/services/callSwarmCompletion";
import { ResizableTextarea } from "@/components/shared/resizable-textarea";
import { StopIcon, PaperAirplaneIcon } from "@heroicons/react/24/solid";
import type { Message } from "@/ts/types/Message";

export function SwarmPromptForm() {
  const { formRef, onKeyDown } = useEnterSubmit();
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = React.useState("");
  const dispatch = React.useContext(SwarmChatDispatchContext);
  const state = React.useContext(SwarmChatContext);
  const isRequestInFlight = state.completionLoading;

  const handleStop = () => {
    dispatch?.({ type: "ABORT_CURRENT_REQUEST" });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isRequestInFlight) return;
    onKeyDown(e);
  };

  return (
    <form
      ref={formRef}
      onSubmit={async (e) => {
        e.preventDefault();
        const prompt = input.trim();
        if (!prompt || !dispatch || !state.sessionId || !state.swarm || isRequestInFlight) return;

        setInput("");
        if (state.currentRequest) dispatch({ type: "ABORT_CURRENT_REQUEST" });

        const abortController = new AbortController();
        dispatch({ type: "SET_CURRENT_REQUEST", payload: abortController });
        dispatch({ type: "SET_COMPLETION_LOADING", payload: true });

        const humanMessage: Message = {
          id: nanoid(),
          content: prompt,
          role: "human",
          error: null,
        };
        dispatch({ type: "ADD_MESSAGE", payload: humanMessage });

        try {
          await callSwarmCompletion(state.sessionId, prompt, state.swarm, dispatch, abortController);
        } catch (err: any) {
          if (err?.name === "AbortError") return;
          const errMsg = err?.message || String(err);
          dispatch({
            type: "ADD_MESSAGE",
            payload: {
              id: nanoid(),
              content: errMsg,
              role: "ai",
              error: { error: "Error", message: errMsg },
            },
          });
        } finally {
          dispatch({ type: "SET_COMPLETION_LOADING", payload: false });
          dispatch({ type: "SET_CURRENT_REQUEST", payload: null });
        }
      }}
    >
      <div className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-background">
        <ResizableTextarea
          ref={inputRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          placeholder="Send a message."
          className="block w-full rounded-md border-0 py-2.5 pr-12 text-gray-200 bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
          spellCheck={false}
          autoComplete="off"
          name="message"
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          minHeight={80}
          maxHeight={240}
          disabled={isRequestInFlight}
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
          {isRequestInFlight ? (
            <button
              type="button"
              onClick={handleStop}
              className="flex h-8 w-8 items-center justify-center rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors"
              title="Stop"
            >
              <StopIcon className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() || isRequestInFlight}
              className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white transition-colors"
              title="Send"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
