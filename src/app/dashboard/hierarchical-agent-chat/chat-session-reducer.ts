import { v4 as uuid } from "uuid";
import { Message } from "@/ts/types/Message";
import type { SwarmPayload } from "@/services/callSwarmCompletion";

export type SwarmAction =
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "SET_MESSAGES"; payload: Message[] }
  | { type: "EDIT_MESSAGE"; payload: { id: string; content?: string; agentName?: string; error?: Message["error"] } }
  | { type: "SET_COMPLETION_LOADING"; payload: boolean }
  | { type: "SET_CURRENT_STREAMING_AGENT"; payload: string | null }
  | { type: "SET_SESSION_ID"; payload: string }
  | { type: "SET_AGENT_ID"; payload: string }
  | { type: "SET_WORKER_IDS"; payload: string[] }
  | { type: "SET_SWARM"; payload: SwarmPayload | null }
  | { type: "SET_CURRENT_REQUEST"; payload: AbortController | null }
  | { type: "ABORT_CURRENT_REQUEST" };

export interface SwarmChatState {
  messages: Message[];
  completionLoading: boolean;
  sessionId: string;
  agentId: string;
  workerIds: string[];
  /** Built from selected agents; sent in request body (no agent id in URL). */
  swarm: SwarmPayload | null;
  currentStreamingAgent: string | null;
  currentRequest: AbortController | null;
}

export const initialState: SwarmChatState = {
  messages: [],
  completionLoading: false,
  sessionId: uuid(),
  agentId: "",
  workerIds: [],
  swarm: null,
  currentStreamingAgent: null,
  currentRequest: null,
};

export function swarmChatReducer(state: SwarmChatState, action: SwarmAction): SwarmChatState {
  switch (action.type) {
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload] };
    case "SET_MESSAGES":
      return { ...state, messages: action.payload };
    case "EDIT_MESSAGE": {
      const idx = state.messages.findIndex((m) => m.id === action.payload.id);
      if (idx === -1) return state;
      const msg = state.messages[idx];
      return {
        ...state,
        messages: [
          ...state.messages.slice(0, idx),
          { ...msg, ...action.payload },
          ...state.messages.slice(idx + 1),
        ],
      };
    }
    case "SET_COMPLETION_LOADING":
      return { ...state, completionLoading: action.payload };
    case "SET_CURRENT_STREAMING_AGENT":
      return { ...state, currentStreamingAgent: action.payload };
    case "SET_SESSION_ID":
      return { ...state, sessionId: action.payload };
    case "SET_AGENT_ID":
      return { ...state, agentId: action.payload };
    case "SET_WORKER_IDS":
      return { ...state, workerIds: action.payload };
    case "SET_SWARM":
      return { ...state, swarm: action.payload };
    case "SET_CURRENT_REQUEST":
      return { ...state, currentRequest: action.payload };
    case "ABORT_CURRENT_REQUEST":
      if (state.currentRequest) state.currentRequest.abort();
      return { ...state, currentRequest: null, completionLoading: false, currentStreamingAgent: null };
    default:
      return state;
  }
}
