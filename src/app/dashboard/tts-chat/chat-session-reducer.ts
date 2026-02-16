import { v4 as uuid } from "uuid";
import { Message, ErrorDetails } from "@/ts/types/Message";

export type Action =
  | {
      type: "ADD_MESSAGE";
      payload: Message;
    }
  | {
      type: "SET_MESSAGES";
      payload: Message[];
    }
  | {
      type: "SET_COMPLETION_LOADING";
      payload: boolean;
    }
  | {
      type: "EDIT_MESSAGE";
      payload: {
        id: string;
        role?: "human" | "ai";
        content?: string;
        error?: ErrorDetails | null;
        retrievalCalls?: any[];
        toolCalls?: any[];
      };
    }
  | {
      type: "SET_CURRENT_TOOL";
      payload: string;
    }
  | {
      type: "SET_SESSION_ID";
      payload: string;
    }
  | {
      type: "SET_CURRENT_REQUEST";
      payload: AbortController | null;
    }
  | {
      type: "ABORT_CURRENT_REQUEST";
    }
  | {
      type: "SET_AGENT_ID";
      payload: string;
    }
  | {
      type: "SET_TTS_LOADING";
      payload: boolean;
    }
  | {
      type: "SET_TTS_REQUEST";
      payload: AbortController | null;
    }
  | {
      type: "SET_AUDIO_URL";
      payload: string | null;
    }
  | {
      type: "SET_AUDIO_PLAYING";
      payload: boolean;
    };

export interface TtsChatState {
  messages: Message[];
  completionLoading: boolean;
  sessionId: string;
  currentTool: string;
  currentRequest: AbortController | null;
  agentId?: string;
  // TTS-specific state
  ttsLoading: boolean;
  ttsRequest: AbortController | null;
  audioUrl: string | null;
  audioPlaying: boolean;
}

export function chatReducer(
  state: TtsChatState,
  action: Action
): TtsChatState {
  switch (action.type) {
    case "ADD_MESSAGE": {
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            ...action.payload,
          },
        ],
      };
    }
    case "SET_MESSAGES": {
      return {
        ...state,
        messages: action.payload,
      };
    }
    case "EDIT_MESSAGE": {
      const index = state.messages.findIndex((m) => m.id === action.payload.id);

      return {
        ...state,
        messages: [
          ...state.messages.slice(0, index),
          {
            ...state.messages[index],
            ...action.payload,
          },
          ...state.messages.slice(index + 1),
        ],
      };
    }
    case "SET_COMPLETION_LOADING": {
      return {
        ...state,
        completionLoading: action.payload,
      };
    }
    case "SET_CURRENT_TOOL": {
      return {
        ...state,
        currentTool: action.payload,
      };
    }
    case "SET_SESSION_ID": {
      return {
        ...state,
        sessionId: action.payload,
      };
    }
    case "SET_CURRENT_REQUEST": {
      return {
        ...state,
        currentRequest: action.payload,
      };
    }
    case "ABORT_CURRENT_REQUEST": {
      // Abort both agent request and TTS request
      if (state.currentRequest) {
        state.currentRequest.abort();
      }
      if (state.ttsRequest) {
        state.ttsRequest.abort();
      }
      return {
        ...state,
        currentRequest: null,
        ttsRequest: null,
        completionLoading: false,
        ttsLoading: false,
      };
    }
    case "SET_AGENT_ID": {
      return {
        ...state,
        agentId: action.payload,
      };
    }
    case "SET_TTS_LOADING": {
      return {
        ...state,
        ttsLoading: action.payload,
      };
    }
    case "SET_TTS_REQUEST": {
      return {
        ...state,
        ttsRequest: action.payload,
      };
    }
    case "SET_AUDIO_URL": {
      // Revoke previous URL if exists
      if (state.audioUrl && action.payload !== state.audioUrl) {
        URL.revokeObjectURL(state.audioUrl);
      }
      return {
        ...state,
        audioUrl: action.payload,
      };
    }
    case "SET_AUDIO_PLAYING": {
      return {
        ...state,
        audioPlaying: action.payload,
      };
    }
    default: {
      throw Error("Unknown action type");
    }
  }
}

export const initialState: TtsChatState = {
  messages: [],
  completionLoading: false,
  sessionId: uuid(),
  currentTool: "",
  currentRequest: null,
  agentId: undefined,
  // TTS state
  ttsLoading: false,
  ttsRequest: null,
  audioUrl: null,
  audioPlaying: false,
};
