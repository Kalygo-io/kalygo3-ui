"use client";

import * as React from "react";

import {
  ChatContext,
  ChatDispatchContext,
} from "@/app/dashboard/tts-chat/chat-session-context";
import { useEnterSubmit } from "@/shared/hooks/use-enter-submit";
import { nanoid } from "@/shared/utils";
import { callTtsChatAgent } from "@/services/callTtsChatAgent";
import { ResizableTextarea } from "@/components/shared/resizable-textarea";
import { StopIcon, PaperAirplaneIcon } from "@heroicons/react/24/solid";

interface PromptFormProps {
  input: string;
  setInput: (value: string) => void;
  sessionId: string;
  onAudioChunk?: (base64Audio: string) => void;
  onAudioStart?: () => void;
  onAudioEnd?: () => void;
}

export function PromptForm({
  input,
  setInput,
  sessionId,
  onAudioChunk,
  onAudioStart,
  onAudioEnd,
}: PromptFormProps) {
  const { formRef, onKeyDown } = useEnterSubmit();
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const dispatch = React.useContext(ChatDispatchContext);
  const chatState = React.useContext(ChatContext);
  const isRequestInFlight = chatState.completionLoading || chatState.ttsLoading;

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
    dispatch?.({ type: "SET_COMPLETION_LOADING", payload: false });
    dispatch?.({ type: "SET_TTS_LOADING", payload: false });
    dispatch?.({ type: "SET_AUDIO_PLAYING", payload: false });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isRequestInFlight) {
      return;
    }
    onKeyDown(event);
  };

  return (
    <form
      ref={formRef}
      onSubmit={async (e: React.FormEvent) => {
        e.preventDefault();
        
        const humanMessageId = nanoid();
        const prompt = input.trim();

        if (!prompt || isRequestInFlight) return;

        if (!dispatch) {
          console.error("ChatDispatchContext is not available");
          return;
        }

        setInput("");

        // Abort any existing request
        if (chatState.currentRequest) {
          dispatch({ type: "ABORT_CURRENT_REQUEST" });
        }

        // Reset audio state
        dispatch({ type: "SET_AUDIO_PLAYING", payload: false });
        dispatch({ type: "SET_AUDIO_URL", payload: null });

        // Create new AbortController
        const abortController = new AbortController();
        dispatch({ type: "SET_CURRENT_REQUEST", payload: abortController });

        // Add human message
        dispatch({
          type: "ADD_MESSAGE",
          payload: {
            id: humanMessageId,
            content: prompt,
            role: "human",
            error: null,
          },
        });

        // Get agentId from context
        const agentId = chatState.agentId;
        if (!agentId) {
          dispatch({
            type: "EDIT_MESSAGE",
            payload: {
              id: humanMessageId,
              error: {
                error: "Configuration error",
                message: "Agent ID is required",
                timestamp: Date.now(),
              },
            },
          });
          return;
        }

        try {
          // Call the unified TTS chat endpoint
          await callTtsChatAgent(
            agentId,
            sessionId,
            prompt,
            dispatch,
            abortController,
            {
              onAudioChunk,
              onAudioStart,
              onAudioEnd,
            }
          );
        } catch (error: any) {
          if (error.name !== "AbortError") {
            console.error("TTS Chat call error:", error);
          }
        } finally {
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
          className="bg-slate-50 block w-full rounded-md border-0 py-1.5 text-gray-200 bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6 pr-12"
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
              className="flex items-center justify-center w-8 h-8 rounded-md bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white transition-colors"
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
