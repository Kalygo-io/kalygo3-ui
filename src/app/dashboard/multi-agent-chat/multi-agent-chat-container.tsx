"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuid } from "uuid";
import { agentsService, Agent } from "@/services/agentsService";
import {
  callSwarmCompletion,
  type SwarmPayload,
} from "@/services/callSwarmCompletion";
import { errorToast } from "@/shared/toasts/errorToast";
import { nanoid } from "@/shared/utils";
import {
  ArrowLeftIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { PaperAirplaneIcon, StopIcon } from "@heroicons/react/24/solid";
import { CustomizeCrewPanel } from "@/components/hierarchical/customize-crew-panel";
import { HierarchicalDrawer } from "@/components/hierarchical/drawer";
import { EmptyScreen } from "@/components/shared/chat/empty-screen";
import { ChatList } from "@/components/shared/chat/chat-list";
import { ResizableTextarea } from "@/components/shared/resizable-textarea";
import { useEnterSubmit } from "@/shared/hooks/use-enter-submit";
import type { Message } from "@/ts/types/Message";

const MAX_AGENTS = 3;
const DEFAULT_MODEL = "gpt-4o-mini";

function getAgentSystemPrompt(agent: Agent): string {
  const data = (
    agent.config as { data?: { systemPrompt?: string } } | undefined
  )?.data;
  return agent.systemPrompt ?? data?.systemPrompt ?? `You are ${agent.name}.`;
}

function getAgentModelName(agent: Agent): string {
  const data = (
    agent.config as { data?: { model?: { model?: string } } } | undefined
  )?.data;
  return data?.model?.model ?? DEFAULT_MODEL;
}

function buildSwarmFromAgents(agents: Agent[]): SwarmPayload {
  return {
    supervisor: { name: "supervisor", modelName: DEFAULT_MODEL },
    workers: agents.map((a) => ({
      agentName: a.name,
      agentDescription: a.description,
      systemPrompt: getAgentSystemPrompt(a),
      // modelName: getAgentModelName(a),
      modelName: "gpt-5-mini",
    })),
    outputMode: "last_message",
  };
}

export function MultiAgentChatContainer() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [isXl, setIsXl] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId] = useState(() => uuid());
  const [completionLoading, setCompletionLoading] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<AbortController | null>(
    null,
  );

  useEffect(() => {
    loadAgents();
  }, []);

  // Only show the slide-out drawer below xl; on xl we use the fixed aside only (avoid two panels)
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1280px)");
    const handler = () => setIsXl(mql.matches);
    handler();
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
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

  const handleDrawerClose = () => setDrawerOpen(false);
  const toggleDrawer = () => setDrawerOpen((prev) => !prev);
  const handleBack = () => router.push("/dashboard/agent-chat");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const prompt = input.trim();
      if (!prompt) return;
      if (selectedAgents.length === 0) {
        errorToast("Select 1–3 agents in the crew panel to continue.");
        return;
      }
      if (completionLoading) return;

      setInput("");
      if (currentRequest) currentRequest.abort();

      const humanMessage: Message = {
        id: nanoid(),
        content: prompt,
        role: "human",
        error: null,
      };
      setMessages((prev) => [...prev, humanMessage]);

      const abortController = new AbortController();
      setCurrentRequest(abortController);
      setCompletionLoading(true);

      const swarm = buildSwarmFromAgents(selectedAgents);
      const addMessage = (msg: Message) =>
        setMessages((prev) => [...prev, msg]);
      const editMessage = (
        id: string,
        update: { content?: string; error?: Message["error"] },
      ) =>
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, ...update } : m)),
        );

      try {
        await callSwarmCompletion(
          sessionId,
          prompt,
          swarm,
          { addMessage, editMessage, setLoading: setCompletionLoading },
          abortController,
        );
      } catch (err: unknown) {
        if ((err as Error).name === "AbortError") return;
        const message = err instanceof Error ? err.message : String(err);
        setCompletionLoading(false);
        setMessages((prev) => [
          ...prev,
          {
            id: nanoid(),
            content: message,
            role: "ai",
            error: { error: "Error", message },
          },
        ]);
      } finally {
        setCurrentRequest(null);
      }
    },
    [input, selectedAgents, completionLoading, currentRequest, sessionId],
  );

  const handleStop = () => {
    currentRequest?.abort();
  };

  const subtitle =
    selectedAgents.length === 0
      ? "Choose 1–3 agents in the panel to the right to get started."
      : selectedAgents.map((a) => a.name).join(", ");

  const { formRef, onKeyDown } = useEnterSubmit();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (completionLoading) return;
    onKeyDown(e);
  };

  return (
    <>
      {/* Full-bleed layout matching agent-chat session page */}
      <div
        className={`fixed inset-0 lg:pl-72 pt-16 flex flex-col overflow-hidden bg-black ${drawerOpen ? "xl:pr-96" : ""}`}
      >
        {/* Header bar - same as agent-chat session */}
        <div className="flex-shrink-0 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm px-4 py-3 flex items-center gap-4 z-10">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
            title="Back to agent selection"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-400" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-white truncate">
              Multi Agent Chat
            </h1>
            <p className="text-sm text-gray-400 line-clamp-1 truncate">
              {subtitle}
            </p>
          </div>
          {/* Toggle Customize Crew panel - always visible (open/close) */}
          <button
            onClick={toggleDrawer}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
            title={drawerOpen ? "Close crew panel" : "Customize crew"}
          >
            <InformationCircleIcon className="w-5 h-5 text-blue-400" />
          </button>
        </div>

        {/* Chat area - scrollable, same structure as agent-chat Chat */}
        <div className="flex-1 overflow-hidden min-h-0">
          <div className="h-full overflow-y-auto overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8 custom-scrollbar">
            <div className="pb-[200px]">
              {messages.length > 0 ? (
                <ChatList
                  messages={messages}
                  isCompletionLoading={completionLoading}
                />
              ) : (
                <EmptyScreen
                  content={
                    <>
                      <h1 className="text-center text-5xl leading-[1.5] font-semibold leading-12 text-ellipsis overflow-hidden text-white p-1">
                        {selectedAgents.length === 0
                          ? "Hierarchical Agent Chat"
                          : "Crew Chat"}
                      </h1>
                      <p className="text-center text-gray-400 mt-2">
                        {selectedAgents.length === 0
                          ? "Choose 1–3 agents in the panel to the right, then send a message to your crew."
                          : "Send message to your crew and get a response."}
                      </p>
                    </>
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed bottom panel - full width like agent-chat; drawer overlays it (z-[80]), does not shrink the form */}
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
                onKeyDown={handleKeyDown}
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
                disabled={completionLoading}
              />
              <div className="absolute bottom-2 right-2 flex items-center space-x-2">
                {completionLoading ? (
                  <button
                    type="button"
                    onClick={handleStop}
                    className="flex items-center justify-center w-8 h-8 rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors"
                    title="Stop"
                  >
                    <StopIcon className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim() || selectedAgents.length === 0}
                    className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white transition-colors"
                    title="Send message"
                  >
                    <PaperAirplaneIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
            <p className="text-gray-200 px-2 text-center text-xs leading-normal hidden sm:block">
              Made with ❤️ in Miami 🌴
            </p>
          </div>
        </div>
      </div>

      {/* Fixed aside: Customize Crew (visible on xl when drawerOpen) */}
      <aside
        className={`fixed top-16 bottom-0 right-0 w-96 overflow-y-auto border-l border-gray-700 bg-gray-900 z-[80] ${drawerOpen ? "hidden xl:block" : "hidden"}`}
      >
        <CustomizeCrewPanel
          agents={agents}
          selectedAgents={selectedAgents}
          loading={loading}
          onToggleAgent={toggleAgent}
          showCloseButton={false}
        />
      </aside>

      {/* Drawer: only on viewports below xl; on xl the fixed aside is used instead */}
      <HierarchicalDrawer
        open={drawerOpen && !isXl}
        onClose={handleDrawerClose}
        topOffset={64}
      >
        <CustomizeCrewPanel
          agents={agents}
          selectedAgents={selectedAgents}
          loading={loading}
          onToggleAgent={toggleAgent}
          onDone={handleDrawerClose}
          onClose={handleDrawerClose}
          showCloseButton={true}
        />
      </HierarchicalDrawer>
    </>
  );
}
