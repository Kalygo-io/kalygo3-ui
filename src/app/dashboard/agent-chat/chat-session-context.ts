import { createContext } from "react";

export interface ChatState {
  messages: any[];
  completionLoading: boolean;
  sessionId: string;
  currentTool: string;
  currentRequest: AbortController | null;
}

export const ChatContext = createContext<ChatState>({
  messages: [],
  completionLoading: false,
  sessionId: "",
  currentTool: "",
  currentRequest: null,
});

export const ChatDispatchContext = createContext<any>(null);
