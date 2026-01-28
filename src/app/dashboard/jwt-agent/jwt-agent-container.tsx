"use client";

import {
  ChatContext,
  ChatDispatchContext,
} from "@/app/dashboard/jwt-agent/chat-session-context";
import {
  chatReducer,
  initialState,
} from "@/app/dashboard/jwt-agent/chat-session-reducer";
import { Chat as JwtAgentChat } from "@/components/jwt-agent-chat/chat";
import { useReducer, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useChatSessions } from "@/shared/hooks/use-chat-sessions";
import { JWT_AGENT_CHAT_APP_ID } from "@/ts/types/ChatAppIds";

export function JwtAgentContainer() {
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

    router.push("/dashboard/jwt-agent");
  }, [router]);

  const { createSession, getSession } = useChatSessions({
    onCurrentSessionDeleted: handleCurrentSessionDeleted,
  });

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
        dispatch({ type: "SET_SESSION_ID", payload: sessionId });
        const session = await getSession(sessionId);
        if (session && session.chatHistory.length > 0) {
          dispatch({ type: "SET_MESSAGES", payload: session.chatHistory });
        } else if (session) {
          // Session exists but has no messages, this is fine
        } else {
          // TODO: Session creation now requires agentId - this component needs updating
          console.warn("JwtAgentContainer: Session not found, but no agentId available to create one");
        }
      } else if (!sessionCreatedRef.current) {
        sessionCreatedRef.current = true;
        // TODO: Session creation now requires agentId - this component needs updating
        console.warn("JwtAgentContainer: No session, but no agentId available to create one");
      }
    }

    asyncCode();
  }, [sessionId, createSession, getSession]);

  return (
    <ChatContext.Provider value={chat}>
      <ChatDispatchContext.Provider value={dispatch}>
        <JwtAgentChat />
      </ChatDispatchContext.Provider>
    </ChatContext.Provider>
  );
}
