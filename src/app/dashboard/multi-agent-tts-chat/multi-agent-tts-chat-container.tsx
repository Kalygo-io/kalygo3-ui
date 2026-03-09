"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  agentsService,
  Agent,
  getAgentModelConfig,
  getAgentElevenLabsVoiceId,
} from "@/services/agentsService";
import {
  getAppSettings,
  setAppSettings,
  type TtsProvider,
} from "@/shared/app-settings";
import { errorToast } from "@/shared/toasts/errorToast";
import {
  SpeakerWaveIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/24/solid";
import { EmptyScreen } from "@/components/shared/chat/empty-screen";
import { ResizableTextarea } from "@/components/shared/resizable-textarea";
import { useEnterSubmit } from "@/shared/hooks/use-enter-submit";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { v4 as uuidv4 } from "uuid";
import { cn, nanoid } from "@/shared/utils";
import type { Message } from "@/ts/types/Message";
import {
  callSwarmTtsNextTurnStream,
  type SwarmPayload,
  type SwarmTtsNextTurnResponse,
} from "@/services/callSwarmTtsNextTurn";
import { SessionAgentsConfigPanel } from "@/components/multi-agent-tts/session-agents-config-panel";
import { StreamingAudioPlayer } from "@/components/tts-chat/streaming-audio-player";

const MAX_AGENTS = 10;
/** How many queued chunks to prefetch while current chunk is playing. */
const TTS_PREFETCH_DEPTH = 2;

type TtsQueueItem = {
  id: string;
  text: string;
  voiceId: string;
  segmentId: string;
};

type ElevenLabsPlaybackItem = {
  id: string;
  agentName: string;
  text: string;
  status: "converting" | "ready" | "playing" | "error";
  audioUrl?: string;
};

const getAgentColorFromName = (agentName: string): string => {
  let hash = 0;
  for (let i = 0; i < agentName.length; i++) {
    hash = agentName.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 70% 45%)`;
};

const getAgentInitial = (agentName?: string): string =>
  agentName?.trim().charAt(0).toUpperCase() || "A";

function buildSwarm(agents: Agent[]): SwarmPayload {
  return {
    supervisor: {
      name: "supervisor",
      // modelName: "gpt-4o-mini"
      modelName: "gpt-5.4",
    },
    workers: agents.map((a) => ({
      agentName: a.name,
      systemPrompt:
        (a.config?.data as { systemPrompt?: string } | undefined)
          ?.systemPrompt ?? "",
      modelName: getAgentModelConfig(a).model,
    })),
    outputMode: "last_message",
  };
}

export function MultiAgentTtsChatContainer() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [inConversation, setInConversation] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [stateToken, setStateToken] = useState<string | null>(null);
  const [completionLoading, setCompletionLoading] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isAudioStreaming, setIsAudioStreaming] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [elevenLabsQueue, setElevenLabsQueue] = useState<
    ElevenLabsPlaybackItem[]
  >([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ttsProvider, setTtsProvider] = useState<TtsProvider>("browser");
  /** Progress for current turn: streamed text length vs chars sent to TTS (for progress bar) */
  const [ttsProgress, setTtsProgress] = useState<{
    streamed: number;
    converted: number;
  }>({ streamed: 0, converted: 0 });
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const streamingMessageIdRef = useRef<string | null>(null);
  const ttsBufferRef = useRef<string>("");
  const ttsQueueRef = useRef<TtsQueueItem[]>([]);
  const isConvertingTtsRef = useRef<boolean>(false);
  const ttsTurnCompleteRef = useRef<boolean>(false);
  const streamedCharsRef = useRef(0);
  const convertedCharsRef = useRef(0);
  /** Cache of prefetched blobs by queue item id. */
  const ttsPrefetchedBlobsRef = useRef<Map<string, Blob>>(new Map());
  /** In-flight fetches by queue item id to dedupe API requests. */
  const ttsPrefetchPromisesRef = useRef<Map<string, Promise<Blob | null>>>(
    new Map(),
  );
  /** Resolve when ElevenLabs TTS queue has finished playing; used to wait before next turn */
  const ttsDrainedResolveRef = useRef<(() => void) | null>(null);
  const segmentCounterRef = useRef(0);
  const activeSegmentIdRef = useRef("segment-0");
  const playbackSegmentIdRef = useRef<string | null>(null);
  const awaitingSegmentDrainRef = useRef(false);
  const elevenLabsQueueRef = useRef<ElevenLabsPlaybackItem[]>([]);
  const activeElevenLabsAudioRef = useRef<HTMLAudioElement | null>(null);
  /** Queue for audio chunks that arrive before player is ready. */
  const audioChunkQueueRef = useRef<string[]>([]);
  const isAudioStreamingRef = useRef(false);
  const isAudioPlayingRef = useRef(false);
  /** Promise for current Browser TTS playback so we can await before next turn */
  const browserTtsPromiseRef = useRef<Promise<void> | null>(null);

  const { formRef, onKeyDown } = useEnterSubmit();

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    isAudioStreamingRef.current = isAudioStreaming;
  }, [isAudioStreaming]);

  useEffect(() => {
    isAudioPlayingRef.current = isAudioPlaying;
  }, [isAudioPlaying]);

  useEffect(() => {
    elevenLabsQueueRef.current = elevenLabsQueue;
  }, [elevenLabsQueue]);

  useEffect(() => {
    if (!isAudioStreaming) return;

    let attempts = 0;
    const maxAttempts = 100;
    const interval = setInterval(() => {
      attempts += 1;
      const player = (
        window as Window & {
          __streamingAudioPlayer?: { addAudioChunk?: (c: string) => void };
        }
      ).__streamingAudioPlayer;
      if (player?.addAudioChunk && audioChunkQueueRef.current.length > 0) {
        while (audioChunkQueueRef.current.length > 0) {
          const queuedChunk = audioChunkQueueRef.current.shift();
          if (queuedChunk) player.addAudioChunk(queuedChunk);
        }
      }
      if (
        attempts >= maxAttempts ||
        (player && audioChunkQueueRef.current.length === 0)
      ) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isAudioStreaming]);

  useEffect(() => {
    loadAgents();
  }, []);

  useEffect(() => {
    setTtsProvider(getAppSettings().ttsProvider);
  }, [inConversation]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await agentsService.listAgents();
      setAgents(data);
    } catch (error: unknown) {
      errorToast(
        error instanceof Error ? error.message : "Failed to load agents",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleAgent = (agent: Agent) => {
    setSelectedAgents((prev) => {
      const already = prev.some((a) => a.id === agent.id);
      if (already) return prev.filter((a) => a.id !== agent.id);
      if (prev.length >= MAX_AGENTS) return prev;
      return [...prev, agent];
    });
  };

  const handleStartConversation = () => {
    if (selectedAgents.length === 0) {
      errorToast("Select 1–3 agents to start.");
      return;
    }
    setSessionId(uuidv4());
    setMessages([]);
    setStateToken(null);
    setInConversation(true);
  };

  const handleBackToSelection = () => {
    setInConversation(false);
  };

  const fetchAndCacheTtsBlob = (item: TtsQueueItem): Promise<Blob | null> => {
    const cachedBlob = ttsPrefetchedBlobsRef.current.get(item.id);
    if (cachedBlob) return Promise.resolve(cachedBlob);
    const inFlight = ttsPrefetchPromisesRef.current.get(item.id);
    if (inFlight) return inFlight;

    const promise = fetchTtsBlob(item.text, item.voiceId)
      .then((blob) => {
        if (blob) {
          ttsPrefetchedBlobsRef.current.set(item.id, blob);
        }
        return blob;
      })
      .finally(() => {
        ttsPrefetchPromisesRef.current.delete(item.id);
      });

    ttsPrefetchPromisesRef.current.set(item.id, promise);
    return promise;
  };

  const prefetchUpcomingTtsChunks = () => {
    const upcoming = ttsQueueRef.current.slice(0, TTS_PREFETCH_DEPTH);
    for (const item of upcoming) {
      void fetchAndCacheTtsBlob(item);
    }
  };

  const canResolveTtsDrain = useCallback(
    () =>
      !isConvertingTtsRef.current &&
      !awaitingSegmentDrainRef.current &&
      ttsQueueRef.current.length === 0 &&
      elevenLabsQueueRef.current.length === 0 &&
      ttsPrefetchPromisesRef.current.size === 0 &&
      !isAudioStreamingRef.current &&
      !isAudioPlayingRef.current,
    [],
  );

  const maybeResolveTtsDrain = useCallback(() => {
    if (canResolveTtsDrain()) {
      ttsDrainedResolveRef.current?.();
      ttsDrainedResolveRef.current = null;
    }
  }, [canResolveTtsDrain]);

  useEffect(() => {
    maybeResolveTtsDrain();
  }, [elevenLabsQueue, isAudioPlaying, maybeResolveTtsDrain]);

  const pushAudioChunkToPlayer = useCallback((base64Audio: string) => {
    const player = (
      window as Window & {
        __streamingAudioPlayer?: { addAudioChunk?: (c: string) => void };
      }
    ).__streamingAudioPlayer;
    if (player?.addAudioChunk) {
      while (audioChunkQueueRef.current.length > 0) {
        const queuedChunk = audioChunkQueueRef.current.shift();
        if (queuedChunk) player.addAudioChunk(queuedChunk);
      }
      player.addAudioChunk(base64Audio);
      return;
    }
    audioChunkQueueRef.current.push(base64Audio);
  }, []);

  const startAudioStreaming = useCallback(() => {
    if (isAudioStreamingRef.current) return;
    audioChunkQueueRef.current = [];
    const player = (
      window as Window & { __streamingAudioPlayer?: { reset?: () => void } }
    ).__streamingAudioPlayer;
    player?.reset?.();
    setIsAudioStreaming(true);
  }, []);

  const endAudioStreaming = useCallback(() => {
    if (!isAudioStreamingRef.current) {
      maybeResolveTtsDrain();
      return;
    }
    const player = (
      window as Window & {
        __streamingAudioPlayer?: { addAudioChunk?: (c: string) => void };
      }
    ).__streamingAudioPlayer;
    if (player?.addAudioChunk) {
      while (audioChunkQueueRef.current.length > 0) {
        const queuedChunk = audioChunkQueueRef.current.shift();
        if (queuedChunk) player.addAudioChunk(queuedChunk);
      }
    }
    setIsAudioStreaming(false);
    maybeResolveTtsDrain();
  }, [maybeResolveTtsDrain]);

  const blobToBase64 = useCallback(async (blob: Blob): Promise<string> => {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }, []);

  const processTtsQueue = () => {
    if (isConvertingTtsRef.current || awaitingSegmentDrainRef.current) return;

    if (ttsQueueRef.current.length === 0) {
      if (
        ttsTurnCompleteRef.current &&
        ttsPrefetchPromisesRef.current.size === 0
      ) {
        endAudioStreaming();
      }
      return;
    }

    const current = ttsQueueRef.current.shift();
    if (!current) return;

    if (
      playbackSegmentIdRef.current &&
      playbackSegmentIdRef.current !== current.segmentId
    ) {
      if (isAudioStreamingRef.current || isAudioPlayingRef.current) {
        ttsQueueRef.current.unshift(current);
        awaitingSegmentDrainRef.current = true;
        endAudioStreaming();
        return;
      }
      playbackSegmentIdRef.current = null;
    }

    prefetchUpcomingTtsChunks();
    isConvertingTtsRef.current = true;
    playbackSegmentIdRef.current = current.segmentId;

    fetchAndCacheTtsBlob(current)
      .then(async (blob) => {
        if (!blob) return;
        ttsPrefetchedBlobsRef.current.delete(current.id);
        const base64Audio = await blobToBase64(blob);
        startAudioStreaming();
        pushAudioChunkToPlayer(base64Audio);
      })
      .finally(() => {
        isConvertingTtsRef.current = false;
        if (
          ttsTurnCompleteRef.current &&
          ttsQueueRef.current.length === 0 &&
          ttsPrefetchPromisesRef.current.size === 0
        ) {
          endAudioStreaming();
        } else {
          processTtsQueue();
        }
      });
  };

  /** Wait until the ElevenLabs TTS queue has finished playing. Resolves immediately if queue is already empty. */
  const waitForTtsQueueToFinish = (): Promise<void> => {
    if (canResolveTtsDrain()) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      ttsDrainedResolveRef.current = resolve;
    });
  };

  const flushTtsBuffer = (voiceId: string) => {
    const text = ttsBufferRef.current.trim();
    ttsBufferRef.current = "";
    if (text) {
      convertedCharsRef.current += text.length;
      setTtsProgress({
        streamed: streamedCharsRef.current,
        converted: convertedCharsRef.current,
      });
      const queueItem: TtsQueueItem = {
        id: nanoid(),
        text,
        voiceId,
        segmentId: activeSegmentIdRef.current,
      };
      ttsQueueRef.current.push(queueItem);
      prefetchUpcomingTtsChunks();
      processTtsQueue();
    }
  };

  const requestNextTurnStream = async (
    prompt?: string,
    token?: string | null,
  ): Promise<SwarmTtsNextTurnResponse> => {
    const swarm = buildSwarm(selectedAgents);
    const controller = new AbortController();
    abortRef.current = controller;
    const voiceIdForAgent = (name: string) => getVoiceIdForAgent(name);

    try {
      return await callSwarmTtsNextTurnStream(
        sessionId,
        swarm,
        { prompt, stateToken: token ?? stateToken },
        {
          onAgentStart: (agentName, routeReason) => {
            ttsTurnCompleteRef.current = false;
            segmentCounterRef.current += 1;
            activeSegmentIdRef.current = `segment-${segmentCounterRef.current}`;
            streamedCharsRef.current = 0;
            convertedCharsRef.current = 0;
            setTtsProgress({ streamed: 0, converted: 0 });
            const decisionMessage: Message = {
              id: nanoid(),
              content: `Moderator chose ${agentName}`,
              role: "ai",
              error: null,
              agentName: "Moderator",
              supervisorDecision: {
                chosenAgent: agentName,
                reason: routeReason ?? "",
              },
            };
            setMessages((prev) => [...prev, decisionMessage]);
            const newMessage: Message = {
              id: nanoid(),
              content: "",
              role: "ai",
              error: null,
              agentName,
            };
            streamingMessageIdRef.current = newMessage.id;
            setMessages((prev) => [...prev, newMessage]);
            setCurrentSpeaker(agentName);
            setCompletionLoading(false);
          },
          onStreamChunk: (agentName, chunk) => {
            const id = streamingMessageIdRef.current;
            if (!id) return;
            streamedCharsRef.current += chunk.length;
            setTtsProgress({
              streamed: streamedCharsRef.current,
              converted: convertedCharsRef.current,
            });
            setMessages((prev) =>
              prev.map((m) =>
                m.id === id ? { ...m, content: m.content + chunk } : m,
              ),
            );
          },
          onAgentEnd: () => {},
          onTurnResult: (result) => {
            ttsTurnCompleteRef.current = true;
            const id = streamingMessageIdRef.current;
            streamingMessageIdRef.current = null;
            if (id) {
              const trimmed = result.content?.trim() ?? "";
              if (trimmed) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === id ? { ...m, content: trimmed } : m,
                  ),
                );
              } else {
                setMessages((prev) => prev.filter((m) => m.id !== id));
              }
            }

            if (result.done) {
              const stopReason =
                result.finalReason?.trim() ||
                "No further agent turns were needed for this response.";
              const turnStopMessage: Message = {
                id: nanoid(),
                content: "Moderator ended this swarm turn",
                role: "ai",
                error: null,
                agentName: "Moderator",
                turnStopDecision: {
                  done: true,
                  reason: stopReason,
                },
              };
              setMessages((prev) => [...prev, turnStopMessage]);
            }

            setCurrentSpeaker(null);
            if (ttsProvider === "elevenlabs" && result.content?.trim()) {
              const agentName = result.agentName?.trim() || "Agent";
              const voiceId = voiceIdForAgent(agentName);
              convertedCharsRef.current = result.content.length;
              setTtsProgress({
                streamed: streamedCharsRef.current,
                converted: convertedCharsRef.current,
              });
              void enqueueElevenLabsPlayback(
                agentName,
                result.content,
                voiceId,
              );
            } else if (result.content?.trim()) {
              streamedCharsRef.current = result.content.length;
              convertedCharsRef.current = result.content.length;
              setTtsProgress({
                streamed: streamedCharsRef.current,
                converted: convertedCharsRef.current,
              });
              setIsAudioPlaying(true);
              browserTtsPromiseRef.current = speakWithWebSpeech(
                result.content,
              ).then(() => {
                setIsAudioPlaying(false);
              });
            } else {
              browserTtsPromiseRef.current = Promise.resolve();
            }
          },
        },
        controller.signal,
      );
    } finally {
      abortRef.current = null;
    }
  };

  const speakWithWebSpeech = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        resolve();
        return;
      }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
    });
  };

  /** Fetch TTS audio blob from API (used for playback and prefetch). */
  const fetchTtsBlob = useCallback(
    async (text: string, voiceId: string): Promise<Blob | null> => {
      try {
        const res = await fetch("/api/tts/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ text, voiceId }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          errorToast(err?.error ?? "TTS failed");
          return null;
        }
        return await res.blob();
      } catch (e) {
        errorToast(e instanceof Error ? e.message : "TTS failed");
        return null;
      }
    },
    [],
  );

  const clearElevenLabsQueue = useCallback(() => {
    setElevenLabsQueue((prev) => {
      for (const item of prev) {
        if (item.audioUrl) URL.revokeObjectURL(item.audioUrl);
      }
      return [];
    });
  }, []);

  const enqueueElevenLabsPlayback = useCallback(
    async (agentName: string, text: string, voiceId: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const id = nanoid();
      setElevenLabsQueue((prev) => [
        ...prev,
        { id, agentName, text: trimmed, status: "converting" },
      ]);

      const blob = await fetchTtsBlob(trimmed, voiceId);
      if (!blob) {
        setElevenLabsQueue((prev) => prev.filter((item) => item.id !== id));
        return;
      }

      const audioUrl = URL.createObjectURL(blob);
      setElevenLabsQueue((prev) => {
        const exists = prev.some((item) => item.id === id);
        if (!exists) {
          URL.revokeObjectURL(audioUrl);
          return prev;
        }
        return prev.map((item) =>
          item.id === id
            ? {
                ...item,
                audioUrl,
                status: item.status === "playing" ? "playing" : "ready",
              }
            : item,
        );
      });
    },
    [fetchTtsBlob],
  );

  const handleElevenLabsItemEnded = useCallback((itemId: string) => {
    setElevenLabsQueue((prev) => {
      const first = prev[0];
      if (first?.id !== itemId) return prev;
      if (first.audioUrl) URL.revokeObjectURL(first.audioUrl);
      return prev.slice(1);
    });
    setIsAudioPlaying(false);
  }, []);

  useEffect(() => {
    const first = elevenLabsQueue[0];
    if (!first) return;
    if (first.status === "ready") {
      setElevenLabsQueue((prev) =>
        prev.map((item, index) =>
          index === 0 && item.status === "ready"
            ? { ...item, status: "playing" }
            : item,
        ),
      );
    }
  }, [elevenLabsQueue]);

  useEffect(() => {
    return () => {
      for (const item of elevenLabsQueueRef.current) {
        if (item.audioUrl) URL.revokeObjectURL(item.audioUrl);
      }
    };
  }, []);

  const getVoiceIdForAgent = (agentName: string): string => {
    const agent = selectedAgents.find((a) => a.name === agentName);
    const voiceId = agent ? getAgentElevenLabsVoiceId(agent) : undefined;
    return voiceId ?? getAppSettings().elevenLabsVoiceId;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || completionLoading || selectedAgents.length === 0) return;
    setInput("");
    const userMessage: Message = {
      id: nanoid(),
      content: trimmed,
      role: "human",
      error: null,
    };
    setMessages((prev) => [...prev, userMessage]);
    setCompletionLoading(true);
    activeElevenLabsAudioRef.current?.pause();
    activeElevenLabsAudioRef.current = null;
    clearElevenLabsQueue();
    ttsBufferRef.current = "";
    ttsQueueRef.current = [];
    ttsTurnCompleteRef.current = false;
    segmentCounterRef.current = 0;
    activeSegmentIdRef.current = "segment-0";
    playbackSegmentIdRef.current = null;
    awaitingSegmentDrainRef.current = false;
    ttsPrefetchedBlobsRef.current.clear();
    ttsPrefetchPromisesRef.current.clear();
    audioChunkQueueRef.current = [];
    setIsAudioStreaming(false);
    setIsAudioPlaying(false);
    try {
      let token: string | null = null;
      let done = false;
      let first = true;
      do {
        const res = await requestNextTurnStream(
          first ? trimmed : undefined,
          first ? undefined : token,
        );
        first = false;
        token = res.stateToken;
        done = res.done;

        if (!done && token) {
          if (ttsProvider !== "elevenlabs") {
            await (browserTtsPromiseRef.current ?? Promise.resolve());
            browserTtsPromiseRef.current = null;
          }
          setStateToken(token);
          setCompletionLoading(true);
        } else {
          if (ttsProvider !== "elevenlabs") {
            await (browserTtsPromiseRef.current ?? Promise.resolve());
            browserTtsPromiseRef.current = null;
          }
          setStateToken(null);
        }
      } while (!done && token);
    } catch (err) {
      errorToast(err instanceof Error ? err.message : "Request failed");
      streamingMessageIdRef.current = null;
    } finally {
      setCompletionLoading(false);
      if (ttsProvider !== "elevenlabs") {
        setIsAudioPlaying(false);
      }
      setCurrentSpeaker(null);
      setTtsProgress({ streamed: 0, converted: 0 });
    }
  };

  const handleTtsStop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    activeElevenLabsAudioRef.current?.pause();
    activeElevenLabsAudioRef.current = null;
    clearElevenLabsQueue();
    ttsQueueRef.current = [];
    ttsBufferRef.current = "";
    ttsTurnCompleteRef.current = true;
    playbackSegmentIdRef.current = null;
    awaitingSegmentDrainRef.current = false;
    ttsPrefetchedBlobsRef.current.clear();
    ttsPrefetchPromisesRef.current.clear();
    isConvertingTtsRef.current = false;
    audioChunkQueueRef.current = [];
    const player = (
      window as Window & { __streamingAudioPlayer?: { reset?: () => void } }
    ).__streamingAudioPlayer;
    player?.reset?.();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsAudioPlaying(false);
    setIsAudioStreaming(false);
    setCurrentSpeaker(null);
    maybeResolveTtsDrain();
  };

  const handleBack = () => router.push("/dashboard/tts-chat");
  const toggleDrawer = () => setDrawerOpen((prev) => !prev);
  const handleDrawerClose = () => setDrawerOpen(false);

  const handleTtsProviderChange = (value: TtsProvider) => {
    if (value !== "elevenlabs") {
      activeElevenLabsAudioRef.current?.pause();
      activeElevenLabsAudioRef.current = null;
      clearElevenLabsQueue();
    }
    setTtsProvider(value);
    setAppSettings({ ttsProvider: value });
  };

  const subtitle =
    selectedAgents.length === 0
      ? `Select 1–${MAX_AGENTS} agents to have a voice conversation (e.g. historical figures).`
      : selectedAgents.map((a) => a.name).join(", ");

  const isSelected = (agent: Agent) =>
    selectedAgents.some((a) => a.id === agent.id);

  // ——— Selection view (landing) ———
  if (!inConversation) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <SpeakerWaveIcon className="h-8 w-8 text-purple-400" />
              <h1 className="text-3xl font-bold text-white">
                Multi-Agent TTS Chat
              </h1>
            </div>
            <p className="text-gray-400">
              Select 1–10 agents to have a voice conversation with your favorite
              characters (e.g. historical figures).
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12 text-gray-400">
              Loading agents...
            </div>
          ) : agents.length === 0 ? (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 text-center">
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-1">No agents found</p>
              <p className="text-gray-500 text-sm mb-4">
                Create your first agent to get started
              </p>
              <button
                onClick={() => router.push("/dashboard/agents/create")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                Create Agent
              </button>
            </div>
          ) : (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Select agents (1–{MAX_AGENTS})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {agents.map((agent) => {
                    const selected = isSelected(agent);
                    const atMax =
                      selectedAgents.length >= MAX_AGENTS && !selected;
                    return (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={() => toggleAgent(agent)}
                        disabled={atMax}
                        className={`p-4 rounded-lg border-2 transition-all text-left flex items-start gap-3 ${
                          selected
                            ? "border-purple-500 bg-purple-600/20"
                            : atMax
                              ? "border-gray-700 bg-gray-900/30 opacity-60 cursor-not-allowed"
                              : "border-gray-700 bg-gray-900/50 hover:border-gray-600 hover:bg-gray-900/70"
                        }`}
                      >
                        <div
                          className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center ${
                            selected
                              ? "border-purple-400 bg-purple-500"
                              : "border-gray-500"
                          }`}
                        >
                          {selected && (
                            <CheckIcon className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold mb-1">
                            {agent.name}
                          </h3>
                          {agent.config?.data?.systemPrompt && (
                            <p className="text-gray-400 text-sm line-clamp-2">
                              {agent.config.data.systemPrompt}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleStartConversation}
                    disabled={selectedAgents.length === 0}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                  >
                    Start voice conversation
                    <ArrowRightIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ——— Conversation view (chat + TTS) ———
  return (
    <>
      <div className="fixed inset-0 lg:pl-72 pt-16 flex flex-col overflow-hidden bg-black">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm px-4 py-3 flex items-center gap-3 sm:gap-4 z-10">
          <button
            onClick={handleBackToSelection}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
            title="Back to agent selection"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-400" />
          </button>
          <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
            <h1 className="text-base sm:text-lg font-semibold text-white truncate">
              Multi-Agent TTS Chat
            </h1>
            <SpeakerWaveIcon className="h-5 w-5 text-purple-400 flex-shrink-0" />
          </div>
          <p className="hidden sm:block text-sm text-gray-400 truncate max-w-[25%] lg:max-w-[35%]">
            {subtitle}
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <label htmlFor="tts-provider" className="sr-only">
              Text-to-speech engine
            </label>
            <select
              id="tts-provider"
              value={ttsProvider}
              onChange={(e) =>
                handleTtsProviderChange(e.target.value as TtsProvider)
              }
              className="rounded-lg border border-gray-600 bg-gray-900 text-white text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              title="Text-to-speech engine"
            >
              <option value="browser">Browser</option>
              <option value="elevenlabs">ElevenLabs</option>
            </select>
          </div>
          <button
            onClick={toggleDrawer}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
            title={
              drawerOpen ? "Close agent config" : "View agent configuration"
            }
            aria-label={
              drawerOpen ? "Close agent config" : "View agent configuration"
            }
          >
            <EyeIcon className="w-5 h-5 text-purple-400" />
          </button>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8 custom-scrollbar">
            <div className="pb-[200px] space-y-4 max-w-3xl mx-auto">
              {messages.length === 0 ? (
                <EmptyScreen
                  content={
                    <>
                      <h1 className="text-center text-5xl leading-[1.5] font-semibold text-white p-1">
                        Voice conversation
                      </h1>
                      <p className="text-center text-gray-400 mt-2">
                        Send a message and hear your agents respond with voice.
                      </p>
                    </>
                  }
                />
              ) : (
                messages.map((m) => {
                  if (m.role === "human") {
                    return (
                      <div key={m.id} className="flex justify-end">
                        <div className="rounded-2xl bg-purple-600/80 text-white px-4 py-2.5 max-w-[85%]">
                          <p className="text-sm whitespace-pre-wrap">
                            {m.content}
                          </p>
                        </div>
                      </div>
                    );
                  }
                  if (m.supervisorDecision) {
                    const reason = m.supervisorDecision.reason.trim();
                    const agentName = m.agentName || "Moderator";
                    return (
                      <div
                        key={m.id}
                        className="flex justify-start items-start gap-2.5"
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                          style={{
                            backgroundColor: getAgentColorFromName(agentName),
                          }}
                          title={agentName}
                          aria-label={`${agentName} avatar`}
                        >
                          {getAgentInitial(agentName)}
                        </div>
                        <div className="rounded-2xl bg-gray-800/80 border border-gray-600 text-gray-300 px-4 py-2 max-w-[85%]">
                          <p
                            className="text-xs font-medium mb-1"
                            style={{ color: getAgentColorFromName(agentName) }}
                          >
                            {agentName}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm">{m.content}</p>
                            <span
                              className={cn(
                                "inline-flex flex-shrink-0 rounded p-0.5 text-gray-500 hover:text-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500",
                                reason && "cursor-help",
                              )}
                              title={reason || undefined}
                              aria-label={
                                reason ? "Moderator reason" : undefined
                              }
                            >
                              <EyeIcon className="h-4 w-4" />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  if (m.turnStopDecision) {
                    const reason = m.turnStopDecision.reason.trim();
                    const agentName = m.agentName || "Moderator";
                    return (
                      <div
                        key={m.id}
                        className="flex justify-start items-start gap-2.5"
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                          style={{
                            backgroundColor: getAgentColorFromName(agentName),
                          }}
                          title={agentName}
                          aria-label={`${agentName} avatar`}
                        >
                          {getAgentInitial(agentName)}
                        </div>
                        <div className="rounded-2xl bg-gray-800/80 border border-gray-600 text-gray-300 px-4 py-2 max-w-[85%]">
                          <p
                            className="text-xs font-medium mb-1"
                            style={{ color: getAgentColorFromName(agentName) }}
                          >
                            {agentName}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm">{m.content}</p>
                            <span
                              className={cn(
                                "inline-flex flex-shrink-0 rounded p-0.5 text-gray-500 hover:text-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500",
                                reason && "cursor-help",
                              )}
                              title={reason || undefined}
                              aria-label={
                                reason ? "Turn stop reason" : undefined
                              }
                            >
                              <EyeIcon className="h-4 w-4" />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  const agentName = m.agentName || "Agent";
                  const agentColor = getAgentColorFromName(agentName);
                  return (
                    <div
                      key={m.id}
                      className="flex justify-start items-start gap-2.5"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                        style={{ backgroundColor: agentColor }}
                        title={agentName}
                        aria-label={`${agentName} avatar`}
                      >
                        {getAgentInitial(agentName)}
                      </div>
                      <div className="rounded-2xl bg-gray-800 border border-gray-700 text-gray-200 px-4 py-2.5 max-w-[85%]">
                        {m.agentName && (
                          <p
                            className="text-xs font-medium mb-1"
                            style={{ color: agentColor }}
                          >
                            {m.agentName}
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap">
                          {m.content}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              {currentSpeaker && (
                <p className="text-sm text-gray-500 italic">
                  {currentSpeaker} is speaking…
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed bottom panel aligned with Agent Chat prompt-form design */}
      <div
        className="fixed inset-x-0 bottom-0 w-full duration-300 ease-in-out animate-in z-[10]"
        style={{ zIndex: 10 }}
      >
        <div className="mx-auto lg:pl-72 lg:max-w-[calc(100%-18rem)]">
          <div className="mx-8 space-y-4 border-t bg-black border-gray-700 px-4 py-2 shadow-lg rounded-t-xl sm:border md:py-4">
            {inConversation &&
              (ttsProvider !== "elevenlabs" || elevenLabsQueue.length > 0) && (
                <div>
                  {ttsProvider === "elevenlabs" ? (
                    <div className="space-y-2">
                      {elevenLabsQueue.map((item, index) => {
                        const isHead = index === 0;
                        return (
                          <div
                            key={item.id}
                            className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl px-3 py-2"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-xs text-gray-300 truncate">
                                {item.agentName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.status === "converting"
                                  ? "Converting..."
                                  : isHead
                                    ? "Now playing"
                                    : "Queued"}
                              </p>
                            </div>
                            {item.audioUrl && isHead ? (
                              <audio
                                key={item.id}
                                ref={(el) => {
                                  if (isHead)
                                    activeElevenLabsAudioRef.current = el;
                                }}
                                controls
                                autoPlay
                                preload="auto"
                                className="w-full h-10 mt-2"
                                src={item.audioUrl}
                                onPlay={() => setIsAudioPlaying(true)}
                                onPause={() => setIsAudioPlaying(false)}
                                onEnded={() =>
                                  handleElevenLabsItemEnded(item.id)
                                }
                              />
                            ) : (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                {item.text}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <StreamingAudioPlayer
                      isStreaming={false}
                      isPlaying={isAudioPlaying}
                      onPlayingChange={(playing) => {
                        setIsAudioPlaying(playing);
                        if (!playing) maybeResolveTtsDrain();
                      }}
                      onStop={handleTtsStop}
                      className="min-h-[72px]"
                    />
                  )}
                </div>
              )}

            {/* Chat input */}
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-background"
            >
              <ResizableTextarea
                tabIndex={0}
                onKeyDown={onKeyDown}
                placeholder="Send a message."
                className="bg-slate-50 block w-full rounded-md border-0 py-1.5 text-gray-200 bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 pl-4 pr-12"
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                name="message"
                rows={3}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                minHeight={80}
                maxHeight={240}
              />
              <div className="absolute bottom-2 right-2 flex items-center space-x-2">
                <button
                  type="submit"
                  disabled={!input.trim() || completionLoading}
                  className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white transition-colors"
                  title="Send message"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                </button>
              </div>
            </form>
            <p className="text-gray-200 text-muted-foreground px-2 text-center text-xs leading-normal hidden sm:block">
              Made with ❤️ in Miami 🌴
            </p>
          </div>
        </div>
      </div>

      {/* Mobile overlay backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-[75] transition-opacity duration-300 lg:hidden",
          drawerOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={handleDrawerClose}
      />

      {/* Session agents drawer overlays chat (desktop + mobile) */}
      <aside
        className={cn(
          "fixed top-16 bottom-0 right-0 w-96 max-w-[92vw] overflow-y-auto border-l border-gray-700 bg-gray-900 z-[80]",
          "transform transition-transform duration-300 ease-in-out",
          drawerOpen ? "translate-x-0" : "translate-x-full",
        )}
        aria-label="Session agents configuration"
      >
        <SessionAgentsConfigPanel
          selectedAgents={selectedAgents}
          onClose={handleDrawerClose}
          showCloseButton={true}
        />
      </aside>
    </>
  );
}
