import { createContext } from "react";

export interface ChatState {
  messages: any[];
  completionLoading: boolean;
  sessionId: string;
  currentTool: string;
  currentRequest: AbortController | null;
  agentId?: string;
  // When set, the chat is bound to a CRM contact and streams via the
  // contact-scoped endpoint instead of a user-selected agent.
  contactId?: number;
}

export const ChatContext = createContext<ChatState>({
  messages: [],
  completionLoading: false,
  sessionId: "",
  currentTool: "",
  currentRequest: null,
  agentId: undefined,
  contactId: undefined,
});

export const ChatDispatchContext = createContext<any>(null);
