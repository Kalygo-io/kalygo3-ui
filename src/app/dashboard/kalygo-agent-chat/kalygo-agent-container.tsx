"use client";

import {
  ChatContext,
  ChatDispatchContext,
} from "@/app/dashboard/kalygo-agent-chat/chat-session-context";
import {
  chatReducer,
  initialState,
} from "@/app/dashboard/kalygo-agent-chat/chat-session-reducer";
import { Chat as KalygoAgentChat } from "@/components/kalygo-agent-chat/chat";
import { useReducer, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useChatSessions } from "@/shared/hooks/use-chat-sessions";
import { KALYGO_AGENT_CHAT_APP_ID } from "@/ts/types/ChatAppIds";

export function KalygoAgentContainer() {
  const [chat, dispatch] = useReducer(chatReducer, initialState);
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionCreatedRef = useRef(false);

  const sessionId = searchParams.get("session");

  // Handle current session deletion
  const handleCurrentSessionDeleted = useCallback(() => {
    // Reset chat state to initial state
    dispatch({ type: "SET_MESSAGES", payload: [] });
    dispatch({ type: "SET_SESSION_ID", payload: "" });

    router.push("/dashboard/tokenizers");
  }, [router]);

  const { createSession, getSession } = useChatSessions(
    handleCurrentSessionDeleted
  );

  // Cleanup effect to abort any ongoing requests when component unmounts
  useEffect(() => {
    return () => {
      if (chat.currentRequest) {
        dispatch({ type: "ABORT_CURRENT_REQUEST" });
      }
    };
  }, [chat.currentRequest]);

  useEffect(() => {
    async function asyncCode() {
      if (sessionId) {
        // Validate that sessionId is a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(sessionId)) {
          console.error("Invalid sessionId format:", sessionId);
          // Create a new session if the sessionId is invalid
          const newSession = await createSession(KALYGO_AGENT_CHAT_APP_ID);
          dispatch({ type: "SET_SESSION_ID", payload: newSession.sessionId });
          const url = new URL(window.location.href);
          url.searchParams.set("session", newSession.sessionId);
          window.history.replaceState({}, "", url.toString());
          return;
        }

        dispatch({ type: "SET_SESSION_ID", payload: sessionId });
        const session = await getSession(sessionId);
        if (session && session.chatHistory.length > 0) {
          dispatch({ type: "SET_MESSAGES", payload: session.chatHistory });
        } else if (session) {
          // Session exists but has no messages, this is fine
        } else {
          // Session not found, create a new one
          const newSession = await createSession(KALYGO_AGENT_CHAT_APP_ID);
          dispatch({ type: "SET_SESSION_ID", payload: newSession.sessionId });
          const url = new URL(window.location.href);
          url.searchParams.set("session", newSession.sessionId);
          window.history.replaceState({}, "", url.toString());
        }
      } else if (!sessionCreatedRef.current) {
        sessionCreatedRef.current = true;
        const newSession = await createSession(KALYGO_AGENT_CHAT_APP_ID);
        dispatch({ type: "SET_SESSION_ID", payload: newSession.sessionId });
        const url = new URL(window.location.href);
        url.searchParams.set("session", newSession.sessionId);
        window.history.replaceState({}, "", url.toString());
      }
    }

    asyncCode();
  }, [sessionId, createSession, getSession, dispatch]);

  return (
    <ChatContext.Provider value={chat}>
      <ChatDispatchContext.Provider value={dispatch}>
        <KalygoAgentChat />
      </ChatDispatchContext.Provider>
    </ChatContext.Provider>
  );
}
