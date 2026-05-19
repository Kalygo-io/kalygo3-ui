"use client";

import { useEffect, useReducer, useState } from "react";
import {
  ChatContext,
  ChatDispatchContext,
} from "@/app/dashboard/agent-chat/chat-session-context";
import {
  chatReducer,
  initialState,
} from "@/app/dashboard/agent-chat/chat-session-reducer";
import { ChatList } from "@/components/agent-chat/chat-list";
import { PromptForm } from "@/components/agent-chat/prompt-form";
import { DrawerCloseButton } from "@/components/shared/drawer-close-button";
import { chatSessionService } from "@/services/chatSessionService";
import { errorToast } from "@/shared/toasts/errorToast";
import { SparklesIcon } from "@heroicons/react/24/outline";

interface ContactAgentDrawerProps {
  contactId: number;
  contactName: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Slide-out CRM assistant for a single contact.
 *
 * Notes:
 *  - It composes the reusable chat pieces (ChatList, PromptForm, ChatContext,
 *    reducer) directly rather than mounting <AgentChat>, because that wraps a
 *    viewport-fixed ChatPanel that does not fit a narrow drawer.
 *  - The session is bound to the contact (contactId in reducer state), so
 *    PromptForm streams via the contact-scoped endpoint automatically. No
 *    agent config / aside is shown — this agent is server-fixed.
 */
export function ContactAgentDrawer({
  contactId,
  contactName,
  isOpen,
  onClose,
}: ContactAgentDrawerProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolvedFor, setResolvedFor] = useState<number | null>(null);

  // Resolve (find-or-create) the contact-bound session lazily on first open.
  useEffect(() => {
    if (!isOpen || resolvedFor === contactId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        let session = await chatSessionService.findContactSession(contactId);
        if (!session) {
          session = await chatSessionService.createContactSession(
            contactId,
            `Assistant — ${contactName}`,
          );
        }
        const full = await chatSessionService.getSession(session.sessionId);
        if (cancelled) return;
        setSessionId(session.sessionId);
        setHistory(full?.chatHistory ?? []);
        setResolvedFor(contactId);
      } catch (e: any) {
        if (!cancelled) errorToast(e?.message || "Failed to open assistant");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, contactId, contactName, resolvedFor]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-[75] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed top-16 bottom-0 right-0 w-full sm:w-[420px] bg-gray-900 border-l border-gray-700 z-[80] transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <SparklesIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-white truncate">
                  CRM Assistant
                </h2>
                <p className="text-xs text-gray-400 truncate">{contactName}</p>
              </div>
            </div>
            <DrawerCloseButton onClose={onClose} />
          </div>

          <div className="flex-1 min-h-0">
            {loading || !sessionId ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-400 text-sm">Loading assistant…</div>
              </div>
            ) : (
              <DrawerChat
                key={sessionId}
                sessionId={sessionId}
                contactId={contactId}
                initialMessages={history}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function DrawerChat({
  sessionId,
  contactId,
  initialMessages,
}: {
  sessionId: string;
  contactId: number;
  initialMessages: any[];
}) {
  const [chat, dispatch] = useReducer(chatReducer, {
    ...initialState,
    sessionId,
    contactId,
  });
  const [input, setInput] = useState("");

  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      dispatch({ type: "SET_MESSAGES", payload: initialMessages });
    }
  }, [initialMessages]);

  // Abort any in-flight stream if the drawer chat unmounts.
  useEffect(() => {
    return () => {
      if (chat.currentRequest) {
        dispatch({ type: "ABORT_CURRENT_REQUEST" });
      }
    };
  }, [chat.currentRequest]);

  return (
    <ChatContext.Provider value={chat}>
      <ChatDispatchContext.Provider value={dispatch}>
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
            {chat.messages.length ? (
              <ChatList
                messages={chat.messages}
                isCompletionLoading={chat.completionLoading}
                currentTool={chat.currentTool}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <SparklesIcon className="w-8 h-8 text-blue-400/60 mb-3" />
                <p className="text-gray-300 text-sm">
                  Ask about this contact — read their details and activity, or
                  log a call, email, meeting, or note.
                </p>
              </div>
            )}
          </div>
          <div className="border-t border-gray-700 p-3 flex-shrink-0">
            <PromptForm
              input={input}
              setInput={setInput}
              sessionId={sessionId}
            />
          </div>
        </div>
      </ChatDispatchContext.Provider>
    </ChatContext.Provider>
  );
}
