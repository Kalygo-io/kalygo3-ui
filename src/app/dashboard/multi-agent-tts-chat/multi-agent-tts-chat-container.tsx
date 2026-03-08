"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { agentsService, Agent, getAgentModelConfig } from "@/services/agentsService";
import { errorToast } from "@/shared/toasts/errorToast";
import {
  SpeakerWaveIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/24/solid";
import { EmptyScreen } from "@/components/shared/chat/empty-screen";
import { StreamingAudioPlayer } from "@/components/tts-chat/streaming-audio-player";
import { ResizableTextarea } from "@/components/shared/resizable-textarea";
import { useEnterSubmit } from "@/shared/hooks/use-enter-submit";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { v4 as uuidv4 } from "uuid";
import { nanoid } from "@/shared/utils";
import type { Message } from "@/ts/types/Message";
import {
  callSwarmTtsNextTurn,
  type SwarmPayload,
} from "@/services/callSwarmTtsNextTurn";

const MAX_AGENTS = 3;

function buildSwarm(agents: Agent[]): SwarmPayload {
  return {
    supervisor: { name: "supervisor", modelName: "gpt-4o-mini" },
    workers: agents.map((a) => ({
      agentName: a.name,
      systemPrompt: (a.config?.data as { systemPrompt?: string } | undefined)?.systemPrompt ?? "",
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const { formRef, onKeyDown } = useEnterSubmit();

  useEffect(() => {
    loadAgents();
  }, []);

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

  const requestNextTurn = async (prompt?: string, token?: string | null) => {
    const swarm = buildSwarm(selectedAgents);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await callSwarmTtsNextTurn(
        sessionId,
        swarm,
        { prompt, stateToken: token ?? stateToken },
        controller.signal
      );
      return res;
    } finally {
      abortRef.current = null;
    }
  };

  const speakWithWebSpeech = (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
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
    try {
      let token: string | null = null;
      let done = false;
      let first = true;
      do {
        const res = await requestNextTurn(first ? trimmed : undefined, first ? undefined : token);
        first = false;
        token = res.stateToken;
        done = res.done;
        const aiMessage: Message = {
          id: nanoid(),
          content: res.content,
          role: "ai",
          error: null,
          agentName: res.agentName,
        };
        setMessages((prev) => [...prev, aiMessage]);
        setCurrentSpeaker(res.agentName);
        setCompletionLoading(false);
        setIsAudioStreaming(false);
        setIsAudioPlaying(true);
        await speakWithWebSpeech(res.content);
        setIsAudioPlaying(false);
        setCurrentSpeaker(null);
        if (!done && token) {
          setStateToken(token);
          setCompletionLoading(true);
        } else {
          setStateToken(null);
        }
      } while (!done && token);
    } catch (err) {
      errorToast(err instanceof Error ? err.message : "Request failed");
    } finally {
      setCompletionLoading(false);
      setIsAudioPlaying(false);
      setCurrentSpeaker(null);
    }
  };

  const handleBack = () => router.push("/dashboard/tts-chat");
  const toggleDrawer = () => setDrawerOpen((prev) => !prev);

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
              Select 1–3 agents to have a voice conversation with your favorite
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
    <div className="fixed inset-0 lg:pl-72 pt-16 flex flex-col overflow-hidden bg-black">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm px-4 py-3 flex items-center gap-4 z-10">
        <button
          onClick={handleBackToSelection}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
          title="Back to agent selection"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-400" />
        </button>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <h1 className="text-lg font-semibold text-white truncate">
            Multi-Agent TTS Chat
          </h1>
          <SpeakerWaveIcon className="h-5 w-5 text-purple-400 flex-shrink-0" />
        </div>
        <p className="text-sm text-gray-400 truncate max-w-[50%]">
          {subtitle}
        </p>
        <button
          onClick={toggleDrawer}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
          title="Crew info"
        >
          <InformationCircleIcon className="w-5 h-5 text-purple-400" />
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
              messages.map((m) =>
                m.role === "human" ? (
                  <div
                    key={m.id}
                    className="flex justify-end"
                  >
                    <div className="rounded-2xl bg-purple-600/80 text-white px-4 py-2.5 max-w-[85%]">
                      <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </div>
                ) : (
                  <div
                    key={m.id}
                    className="flex justify-start"
                  >
                    <div className="rounded-2xl bg-gray-800 border border-gray-700 text-gray-200 px-4 py-2.5 max-w-[85%]">
                      {m.agentName && (
                        <p className="text-xs font-medium text-purple-400 mb-1">
                          {m.agentName}
                        </p>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </div>
                )
              )
            )}
            {currentSpeaker && (
              <p className="text-sm text-gray-500 italic">
                {currentSpeaker} is speaking…
              </p>
            )}
          </div>
        </div>

        {/* TTS player placeholder bar */}
        <div className="flex-shrink-0 border-t border-gray-700 px-4 py-2">
          <StreamingAudioPlayer
            isStreaming={isAudioStreaming}
            isPlaying={isAudioPlaying}
            onPlayingChange={setIsAudioPlaying}
            onStop={() => {
              setIsAudioStreaming(false);
              setIsAudioPlaying(false);
            }}
            className="min-h-[72px]"
          />
        </div>
      </div>

      {/* Bottom prompt form */}
      <div
        className="fixed inset-x-0 bottom-0 w-full border-t bg-black border-gray-700 shadow-lg rounded-t-xl z-[10] lg:pl-72"
        style={{ zIndex: 10 }}
      >
        <div className="mx-auto lg:max-w-[calc(100%-18rem)]">
          <div className="mx-4 sm:mx-8 space-y-4 border-t border-gray-700 px-4 py-2 md:py-4">
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-background"
            >
              <ResizableTextarea
                tabIndex={0}
                onKeyDown={onKeyDown}
                placeholder="Send a message..."
                className="bg-slate-50 block w-full rounded-md border-0 py-1.5 text-gray-200 bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6 pl-4 pr-12"
                spellCheck={false}
                autoComplete="off"
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
                  className="flex items-center justify-center w-8 h-8 rounded-md bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white transition-colors"
                  title="Send message"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                </button>
              </div>
            </form>
            <p className="text-gray-200 px-2 text-center text-xs hidden sm:block">
              Made with ❤️ in Miami 🌴
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
