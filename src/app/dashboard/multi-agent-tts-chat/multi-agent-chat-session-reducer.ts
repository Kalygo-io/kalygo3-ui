import type { Agent } from "@/services/agentsService";
import type { TtsProvider } from "@/shared/app-settings";
import type { Message } from "@/ts/types/Message";

/**
 * A single ElevenLabs playback item rendered in the bottom panel queue.
 */
export type ElevenLabsPlaybackItem = {
  id: string;
  agentName: string;
  text: string;
  status: "converting" | "ready" | "playing" | "error";
  audioUrl?: string;
};

/**
 * Progress for the current turn: streamed text length vs chars sent to TTS
 * (used to drive the progress bar).
 */
export interface TtsProgress {
  streamed: number;
  converted: number;
}

export type Action =
  // ——— Agent selection / landing ———
  | { type: "SET_AGENTS"; payload: Agent[] }
  | { type: "SET_SELECTED_AGENTS"; payload: Agent[] }
  | { type: "TOGGLE_AGENT"; payload: { agent: Agent; maxAgents: number } }
  | { type: "SET_LOADING"; payload: boolean }
  // ——— Conversation lifecycle ———
  | { type: "START_CONVERSATION"; payload: { sessionId: string } }
  | { type: "SET_IN_CONVERSATION"; payload: boolean }
  | { type: "SET_SESSION_ID"; payload: string }
  | { type: "SET_STATE_TOKEN"; payload: string | null }
  // ——— Messages ———
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "SET_MESSAGES"; payload: Message[] }
  | { type: "APPEND_CONTENT"; payload: { id: string; chunk: string } }
  | { type: "SET_CONTENT"; payload: { id: string; content: string } }
  | { type: "REMOVE_MESSAGE"; payload: { id: string } }
  // ——— Streaming / turn-taking ———
  | { type: "SET_COMPLETION_LOADING"; payload: boolean }
  | { type: "SET_CURRENT_SPEAKER"; payload: string | null }
  | { type: "SET_TTS_PROGRESS"; payload: TtsProgress }
  // ——— Input ———
  | { type: "SET_INPUT"; payload: string }
  // ——— Audio playback flags ———
  | { type: "SET_IS_AUDIO_STREAMING"; payload: boolean }
  | { type: "SET_IS_AUDIO_PLAYING"; payload: boolean }
  // ——— ElevenLabs queue ———
  | { type: "SET_ELEVENLABS_QUEUE"; payload: ElevenLabsPlaybackItem[] }
  | { type: "ELEVENLABS_ENQUEUE"; payload: ElevenLabsPlaybackItem }
  | { type: "ELEVENLABS_REMOVE"; payload: { id: string } }
  | {
      type: "ELEVENLABS_SET_AUDIO_URL";
      payload: { id: string; audioUrl: string };
    }
  | { type: "ELEVENLABS_CLEAR" }
  | { type: "ELEVENLABS_PROMOTE_HEAD" }
  | { type: "ELEVENLABS_HEAD_ENDED"; payload: { id: string } }
  // ——— UI: drawer + edit-swarm modal ———
  | { type: "SET_DRAWER_OPEN"; payload: boolean }
  | { type: "TOGGLE_DRAWER" }
  | { type: "SET_EDIT_SWARM_MODAL_OPEN"; payload: boolean }
  | { type: "SET_DRAFT_SWARM_AGENT_IDS"; payload: string[] }
  | {
      type: "TOGGLE_DRAFT_SWARM_AGENT";
      payload: { agentId: string; maxAgents: number };
    }
  // ——— Settings ———
  | { type: "SET_TTS_PROVIDER"; payload: TtsProvider };

export interface MultiAgentTtsChatState {
  // Agent selection / landing
  agents: Agent[];
  selectedAgents: Agent[];
  loading: boolean;
  // Conversation lifecycle
  inConversation: boolean;
  sessionId: string;
  stateToken: string | null;
  // Messages
  messages: Message[];
  // Streaming / turn-taking
  completionLoading: boolean;
  currentSpeaker: string | null;
  ttsProgress: TtsProgress;
  // Input
  input: string;
  // Audio playback flags
  isAudioStreaming: boolean;
  isAudioPlaying: boolean;
  // ElevenLabs queue
  elevenLabsQueue: ElevenLabsPlaybackItem[];
  // UI
  drawerOpen: boolean;
  isEditSwarmModalOpen: boolean;
  draftSwarmAgentIds: string[];
  // Settings
  ttsProvider: TtsProvider;
}

export function multiAgentChatReducer(
  state: MultiAgentTtsChatState,
  action: Action
): MultiAgentTtsChatState {
  switch (action.type) {
    case "SET_AGENTS": {
      return { ...state, agents: action.payload };
    }
    case "SET_SELECTED_AGENTS": {
      return { ...state, selectedAgents: action.payload };
    }
    case "TOGGLE_AGENT": {
      const { agent, maxAgents } = action.payload;
      const already = state.selectedAgents.some((a) => a.id === agent.id);
      if (already) {
        return {
          ...state,
          selectedAgents: state.selectedAgents.filter((a) => a.id !== agent.id),
        };
      }
      if (state.selectedAgents.length >= maxAgents) return state;
      return {
        ...state,
        selectedAgents: [...state.selectedAgents, agent],
      };
    }
    case "SET_LOADING": {
      return { ...state, loading: action.payload };
    }
    case "START_CONVERSATION": {
      return {
        ...state,
        sessionId: action.payload.sessionId,
        messages: [],
        stateToken: null,
        inConversation: true,
      };
    }
    case "SET_IN_CONVERSATION": {
      return { ...state, inConversation: action.payload };
    }
    case "SET_SESSION_ID": {
      return { ...state, sessionId: action.payload };
    }
    case "SET_STATE_TOKEN": {
      return { ...state, stateToken: action.payload };
    }
    case "ADD_MESSAGE": {
      return {
        ...state,
        messages: [...state.messages, { ...action.payload }],
      };
    }
    case "SET_MESSAGES": {
      return { ...state, messages: action.payload };
    }
    case "APPEND_CONTENT": {
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.payload.id
            ? { ...m, content: m.content + action.payload.chunk }
            : m
        ),
      };
    }
    case "SET_CONTENT": {
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.payload.id
            ? { ...m, content: action.payload.content }
            : m
        ),
      };
    }
    case "REMOVE_MESSAGE": {
      return {
        ...state,
        messages: state.messages.filter((m) => m.id !== action.payload.id),
      };
    }
    case "SET_COMPLETION_LOADING": {
      return { ...state, completionLoading: action.payload };
    }
    case "SET_CURRENT_SPEAKER": {
      return { ...state, currentSpeaker: action.payload };
    }
    case "SET_TTS_PROGRESS": {
      return { ...state, ttsProgress: action.payload };
    }
    case "SET_INPUT": {
      return { ...state, input: action.payload };
    }
    case "SET_IS_AUDIO_STREAMING": {
      return { ...state, isAudioStreaming: action.payload };
    }
    case "SET_IS_AUDIO_PLAYING": {
      return { ...state, isAudioPlaying: action.payload };
    }
    case "SET_ELEVENLABS_QUEUE": {
      return { ...state, elevenLabsQueue: action.payload };
    }
    case "ELEVENLABS_ENQUEUE": {
      return {
        ...state,
        elevenLabsQueue: [...state.elevenLabsQueue, action.payload],
      };
    }
    case "ELEVENLABS_REMOVE": {
      return {
        ...state,
        elevenLabsQueue: state.elevenLabsQueue.filter(
          (item) => item.id !== action.payload.id
        ),
      };
    }
    case "ELEVENLABS_SET_AUDIO_URL": {
      const { id, audioUrl } = action.payload;
      // Mirror original: if the item no longer exists, revoke the URL and bail.
      const exists = state.elevenLabsQueue.some((item) => item.id === id);
      if (!exists) {
        URL.revokeObjectURL(audioUrl);
        return state;
      }
      return {
        ...state,
        elevenLabsQueue: state.elevenLabsQueue.map((item) =>
          item.id === id
            ? {
                ...item,
                audioUrl,
                status: item.status === "playing" ? "playing" : "ready",
              }
            : item
        ),
      };
    }
    case "ELEVENLABS_CLEAR": {
      for (const item of state.elevenLabsQueue) {
        if (item.audioUrl) URL.revokeObjectURL(item.audioUrl);
      }
      return { ...state, elevenLabsQueue: [] };
    }
    case "ELEVENLABS_PROMOTE_HEAD": {
      // Promote a "ready" head item to "playing".
      const first = state.elevenLabsQueue[0];
      if (!first || first.status !== "ready") return state;
      return {
        ...state,
        elevenLabsQueue: state.elevenLabsQueue.map((item, index) =>
          index === 0 && item.status === "ready"
            ? { ...item, status: "playing" }
            : item
        ),
      };
    }
    case "ELEVENLABS_HEAD_ENDED": {
      const first = state.elevenLabsQueue[0];
      if (first?.id !== action.payload.id) return state;
      if (first.audioUrl) URL.revokeObjectURL(first.audioUrl);
      return { ...state, elevenLabsQueue: state.elevenLabsQueue.slice(1) };
    }
    case "SET_DRAWER_OPEN": {
      return { ...state, drawerOpen: action.payload };
    }
    case "TOGGLE_DRAWER": {
      return { ...state, drawerOpen: !state.drawerOpen };
    }
    case "SET_EDIT_SWARM_MODAL_OPEN": {
      return { ...state, isEditSwarmModalOpen: action.payload };
    }
    case "SET_DRAFT_SWARM_AGENT_IDS": {
      return { ...state, draftSwarmAgentIds: action.payload };
    }
    case "TOGGLE_DRAFT_SWARM_AGENT": {
      const { agentId, maxAgents } = action.payload;
      const isSelected = state.draftSwarmAgentIds.includes(agentId);
      if (isSelected) {
        return {
          ...state,
          draftSwarmAgentIds: state.draftSwarmAgentIds.filter(
            (id) => id !== agentId
          ),
        };
      }
      if (state.draftSwarmAgentIds.length >= maxAgents) return state;
      return {
        ...state,
        draftSwarmAgentIds: [...state.draftSwarmAgentIds, agentId],
      };
    }
    case "SET_TTS_PROVIDER": {
      return { ...state, ttsProvider: action.payload };
    }
    default: {
      throw Error("Unknown action type");
    }
  }
}

export const initialState: MultiAgentTtsChatState = {
  agents: [],
  selectedAgents: [],
  loading: true,
  inConversation: false,
  sessionId: "",
  stateToken: null,
  messages: [],
  completionLoading: false,
  currentSpeaker: null,
  ttsProgress: { streamed: 0, converted: 0 },
  input: "",
  isAudioStreaming: false,
  isAudioPlaying: false,
  elevenLabsQueue: [],
  drawerOpen: false,
  isEditSwarmModalOpen: false,
  draftSwarmAgentIds: [],
  ttsProvider: "browser",
};
