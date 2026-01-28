"use client";

import * as React from "react";

import {
  ChatContext,
  ChatDispatchContext,
} from "@/app/dashboard/concierge-chat/chat-session-context";
import { useEnterSubmit } from "@/shared/hooks/use-enter-submit";
import { nanoid } from "@/shared/utils";
import { callConciergeAgent, fetchTTS } from "@/services/callConciergeAgent";
import { ResizableTextarea } from "@/components/shared/resizable-textarea";
import { StopIcon, PaperAirplaneIcon } from "@heroicons/react/24/solid";

interface PromptFormProps {
  input: string;
  setInput: (value: string) => void;
  sessionId: string;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export function PromptForm({
  input,
  setInput,
  sessionId,
  audioRef,
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
      // Also stop audio if playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      dispatch({ type: "SET_AUDIO_PLAYING", payload: false });
    }
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
      onSubmit={async (e: any) => {
        const humanMessageId = nanoid();
        const prompt = input.trim();
        try {
          e.preventDefault();

          setInput("");
          if (!prompt || isRequestInFlight) return;

          if (!dispatch) {
            throw new Error("ChatDispatchContext is not available");
          }

          // Abort any existing request
          if (chatState.currentRequest) {
            dispatch({ type: "ABORT_CURRENT_REQUEST" });
          }

          // Stop any playing audio
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
          dispatch({ type: "SET_AUDIO_PLAYING", payload: false });
          dispatch({ type: "SET_AUDIO_URL", payload: null });

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

          // Step 1: Call the agent and get the response
          const { finalContent } = await callConciergeAgent(
            agentId,
            sessionId,
            prompt,
            dispatch,
            abortController
          );

          dispatch({
            type: "SET_COMPLETION_LOADING",
            payload: false,
          });
          dispatch({ type: "SET_CURRENT_REQUEST", payload: null });

          // Step 2: If we have content, send it to TTS
          if (finalContent && finalContent.trim()) {
            const ttsAbortController = new AbortController();
            try {
              const audioUrl = await fetchTTS(
                finalContent,
                dispatch,
                ttsAbortController
              );

              // Auto-play the audio
              if (audioRef.current && audioUrl) {
                audioRef.current.src = audioUrl;
                audioRef.current.play().catch((err) => {
                  console.warn("Auto-play failed:", err);
                });
                dispatch({ type: "SET_AUDIO_PLAYING", payload: true });
              }
            } catch (ttsError) {
              if (
                ttsError instanceof Error &&
                ttsError.name === "AbortError"
              ) {
                console.log("TTS request aborted");
              } else {
                console.error("TTS error:", ttsError);
                // Don't throw - TTS failure shouldn't break the chat
              }
            }
          }
        } catch (error: any) {
          dispatch({
            type: "SET_COMPLETION_LOADING",
            payload: false,
          });
          dispatch({ type: "SET_CURRENT_REQUEST", payload: null });
          dispatch({ type: "SET_TTS_LOADING", payload: false });
          dispatch({ type: "SET_TTS_REQUEST", payload: null });

          if (error.name === "AbortError") {
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
