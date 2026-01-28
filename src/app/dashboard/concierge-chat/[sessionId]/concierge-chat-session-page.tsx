"use client";

import { useReducer, useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChatContext,
  ChatDispatchContext,
} from "@/app/dashboard/concierge-chat/chat-session-context";
import {
  chatReducer,
  initialState,
} from "@/app/dashboard/concierge-chat/chat-session-reducer";
import { Chat as ConciergeChat } from "@/components/concierge-chat/chat";
import { agentsService, Agent } from "@/services/agentsService";
import { chatSessionService } from "@/services/chatSessionService";
import { errorToast, successToast } from "@/shared/toasts";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  SpeakerWaveIcon,
} from "@heroicons/react/24/outline";
import { clearSessionMessages } from "@/services/clearSessionMessages";
import { cn } from "@/shared/utils";

interface ConciergeChatSessionPageProps {
  sessionId: string;
}

export function ConciergeChatSessionPage({
  sessionId,
}: ConciergeChatSessionPageProps) {
  const router = useRouter();
  const [chat, dispatch] = useReducer(chatReducer, {
    ...initialState,
    sessionId: sessionId,
  });
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Load session and agent details
  useEffect(() => {
    async function loadSessionAndAgent() {
      try {
        setLoadingSession(true);

        // Load session data
        const session = await chatSessionService.getSession(sessionId);
        if (!session) {
          errorToast("Session not found");
          router.push("/dashboard/concierge-chat");
          return;
        }

        // Set session ID and messages
        dispatch({ type: "SET_SESSION_ID", payload: sessionId });
        if (session.chatHistory && session.chatHistory.length > 0) {
          dispatch({ type: "SET_MESSAGES", payload: session.chatHistory });
        }

        // Load agent data using agentId from session
        if (session.agentId) {
          const agentData = await agentsService.getAgent(
            session.agentId.toString()
          );
          setAgent(agentData);
          dispatch({
            type: "SET_AGENT_ID",
            payload: session.agentId.toString(),
          });
        } else {
          errorToast("Session has no associated agent");
          router.push("/dashboard/concierge-chat");
          return;
        }
      } catch (error: any) {
        errorToast(error.message || "Failed to load session");
        router.push("/dashboard/concierge-chat");
      } finally {
        setLoadingSession(false);
      }
    }

    loadSessionAndAgent();
  }, [sessionId, router]);

  // Cleanup effect to abort any ongoing requests when component unmounts
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    return () => {
      // Only abort on unmount, not on every state change
      dispatch({ type: "ABORT_CURRENT_REQUEST" });
    };
  }, []); // Empty deps - only run cleanup on unmount

  const handleBack = useCallback(() => {
    router.push("/dashboard/concierge-chat");
  }, [router]);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleResetChat = async () => {
    if (!chat.sessionId) {
      errorToast("No active session to reset");
      return;
    }

    if (!dispatch) {
      errorToast("Chat context not available");
      return;
    }

    if (isResetting) return;

    // Confirm with user
    if (
      !confirm(
        "Are you sure you want to clear all messages in this chat session? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsResetting(true);
    try {
      // Clear messages from API
      await clearSessionMessages(chat.sessionId);

      // Clear messages from UI state
      dispatch({ type: "SET_MESSAGES", payload: [] });
      // Also clear any audio
      dispatch({ type: "SET_AUDIO_URL", payload: null });
      dispatch({ type: "SET_AUDIO_PLAYING", payload: false });

      successToast("Chat session cleared successfully");
    } catch (error) {
      console.error("Error clearing session messages:", error);
      errorToast(
        `Failed to clear chat session: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsResetting(false);
    }
  };

  // Helper function to ellipsize system prompt
  const ellipsizeSystemPrompt = (prompt: string): string => {
    if (prompt.length <= 40) return prompt;
    return prompt.substring(0, 37) + "...";
  };

  if (loadingSession) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading session...</div>
      </div>
    );
  }

  if (!agent) {
    return null;
  }

  return (
    <ChatContext.Provider value={chat}>
      <ChatDispatchContext.Provider value={dispatch}>
        <div className="fixed inset-0 lg:pl-72 pt-16 flex flex-col overflow-hidden bg-black">
          {/* Header with agent name, system prompt, and action buttons */}
          <div className="flex-shrink-0 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm px-4 py-3 flex items-center gap-4 z-10">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
              title="Back to agent selection"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-400" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-white truncate">
                  {agent.name}
                </h1>
                <SpeakerWaveIcon className="h-5 w-5 text-purple-400 flex-shrink-0" />
              </div>
              {agent.config?.data?.systemPrompt && (
                <p
                  className="text-sm text-gray-400 line-clamp-1 truncate"
                  title={agent.config.data.systemPrompt}
                >
                  {ellipsizeSystemPrompt(agent.config.data.systemPrompt)}
                </p>
              )}
            </div>
            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Reset Chat Button */}
              {chat.messages.length > 0 && (
                <button
                  onClick={handleResetChat}
                  disabled={isResetting}
                  className="p-2 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                  title="Reset chat session"
                >
                  <ArrowPathIcon
                    className={cn(
                      "w-5 h-5 text-red-400",
                      isResetting && "animate-spin"
                    )}
                  />
                </button>
              )}

              {/* Toggle Contextual Aside Button */}
              <button
                onClick={toggleDrawer}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="View agent configuration"
              >
                <InformationCircleIcon className="w-5 h-5 text-purple-400" />
              </button>
            </div>
          </div>
          {/* Chat interface - Takes remaining space */}
          <div className="flex-1 overflow-hidden min-h-0">
            <ConciergeChat
              agent={agent}
              isDrawerOpen={isDrawerOpen}
              setIsDrawerOpen={setIsDrawerOpen}
            />
          </div>
        </div>
      </ChatDispatchContext.Provider>
    </ChatContext.Provider>
  );
}
