import { createContext } from "react";
import { SwarmChatState } from "./chat-session-reducer";

export const SwarmChatContext = createContext<SwarmChatState>({
  messages: [],
  completionLoading: false,
  sessionId: "",
  agentId: "",
  workerIds: [],
  swarm: null,
  currentStreamingAgent: null,
  currentRequest: null,
});

export const SwarmChatDispatchContext = createContext<React.Dispatch<import("./chat-session-reducer").SwarmAction> | null>(null);
