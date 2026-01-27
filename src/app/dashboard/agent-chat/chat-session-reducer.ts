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
    };

export function chatReducer(
  state: {
    messages: Message[];
    completionLoading: boolean;
    sessionId: string;
    currentTool: string;
    currentRequest: AbortController | null;
    agentId?: string;
  },
  action: Action
) {
  switch (action.type) {
    case "ADD_MESSAGE": {
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            ...action.payload, // Preserve all fields including toolCalls, retrievalCalls, etc.
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
      if (state.currentRequest) {
        state.currentRequest.abort();
      }
      return {
        ...state,
        currentRequest: null,
        completionLoading: false,
      };
    }
    case "SET_AGENT_ID": {
      return {
        ...state,
        agentId: action.payload,
      };
    }
    default: {
      throw Error("Unknown action type");
    }
  }
}

export const initialState: {
  messages: Message[];
  completionLoading: boolean;
  sessionId: string;
  currentTool: string;
  currentRequest: AbortController | null;
  agentId?: string;
} = {
  messages: [],
  completionLoading: false,
  sessionId: uuid(),
  currentTool: "",
  currentRequest: null,
  agentId: undefined,
};
