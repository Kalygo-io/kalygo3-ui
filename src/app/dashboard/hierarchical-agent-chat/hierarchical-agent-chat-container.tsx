"use client";

import { useReducer, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { agentsService, Agent } from "@/services/agentsService";
import type { SwarmPayload } from "@/services/callSwarmCompletion";
import { SwarmChatContext, SwarmChatDispatchContext } from "./chat-session-context";
import { swarmChatReducer, initialState } from "./chat-session-reducer";
import { CustomizeCrewPanel } from "@/components/hierarchical/customize-crew-panel";
import { HierarchicalDrawer } from "@/components/hierarchical/drawer";
import { SwarmChatList } from "@/components/hierarchical-agent-chat/chat-list";
import { SwarmPromptForm } from "@/components/hierarchical-agent-chat/prompt-form";
import { EmptyScreen } from "@/components/shared/chat/empty-screen";
import { useScrollAnchor } from "@/shared/hooks/use-scroll-anchor";
import { errorToast } from "@/shared/toasts";
import { ArrowLeftIcon, InformationCircleIcon } from "@heroicons/react/24/outline";

const MAX_AGENTS = 3;
const DEFAULT_MODEL = "gpt-4o-mini";

function getAgentSystemPrompt(agent: Agent): string {
  const data = (agent.config as { data?: { systemPrompt?: string } } | undefined)?.data;
  return agent.systemPrompt ?? data?.systemPrompt ?? `You are ${agent.name}.`;
}

function getAgentModelName(agent: Agent): string {
  const data = (agent.config as { data?: { model?: { model?: string } } } | undefined)?.data;
  return data?.model?.model ?? DEFAULT_MODEL;
}

function buildSwarmFromAgents(agents: Agent[]): SwarmPayload {
  const director = {
    name: "Director",
    modelName: DEFAULT_MODEL,
    systemPrompt:
      "You are the director. Coordinate the workers to answer the user's request. Assign tasks and summarize results.",
  };
  const workers = agents.map((a) => ({
    agentName: a.name,
    agentDescription: a.description,
    systemPrompt: getAgentSystemPrompt(a),
    modelName: getAgentModelName(a),
  }));
  return { director, workers, maxLoops: 3 };
}

export function HierarchicalAgentChatContainer() {
  const router = useRouter();
  const [state, dispatch] = useReducer(swarmChatReducer, initialState);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isXl, setIsXl] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (state.currentRequest) state.currentRequest.abort();
    };
  }, [state.currentRequest]);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1280px)");
    const handler = () => setIsXl(mql.matches);
    handler();
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const list = await agentsService.listAgents();
        if (cancelled || !mounted.current) return;
        setAgents(list);
      } catch (e: unknown) {
        if (!cancelled) errorToast(e instanceof Error ? e.message : "Failed to load agents");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Sync selected crew to chat context: agentId/workerIds for UI; swarm for API (no agent id in path).
  useEffect(() => {
    if (selectedAgents.length === 0) {
      dispatch({ type: "SET_AGENT_ID", payload: "" });
      dispatch({ type: "SET_WORKER_IDS", payload: [] });
      dispatch({ type: "SET_SWARM", payload: null });
      return;
    }
    const ids = selectedAgents.map((a) => String(a.id));
    dispatch({ type: "SET_AGENT_ID", payload: ids[0] });
    dispatch({ type: "SET_WORKER_IDS", payload: ids });
    const swarm = buildSwarmFromAgents(selectedAgents);
    dispatch({ type: "SET_SWARM", payload: swarm });
  }, [selectedAgents]);

  const toggleAgent = (agent: Agent) => {
    setSelectedAgents((prev) => {
      const has = prev.some((a) => a.id === agent.id);
      if (has) return prev.filter((a) => a.id !== agent.id);
      if (prev.length >= MAX_AGENTS) return prev;
      return [...prev, agent];
    });
  };

  const toggleDrawer = () => setDrawerOpen((prev) => !prev);
  const handleDrawerClose = () => setDrawerOpen(false);
  const handleBack = () => router.push("/dashboard/agent-chat");

  const subtitle =
    selectedAgents.length === 0
      ? "Choose 1–3 agents in the panel to the right to get started."
      : selectedAgents.map((a) => a.name).join(", ");

  const { messagesRef, scrollRef, scrollToBottom } = useScrollAnchor();
  useEffect(() => {
    const t = setTimeout(() => scrollToBottom(), 100);
    return () => clearTimeout(t);
  }, [state.messages, state.currentStreamingAgent, scrollToBottom]);

  return (
    <SwarmChatContext.Provider value={state}>
      <SwarmChatDispatchContext.Provider value={dispatch}>
        {/* Full-bleed layout matching screenshot */}
        <div
          className={`fixed inset-0 lg:pl-72 pt-16 flex flex-col overflow-hidden bg-black ${drawerOpen ? "xl:pr-96" : ""}`}
        >
          {/* Header */}
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
                Hierarchical Agent Chat
              </h1>
              <p className="text-sm text-gray-400 line-clamp-1 truncate">
                {subtitle}
              </p>
            </div>
            <button
              onClick={toggleDrawer}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
              title={drawerOpen ? "Close crew panel" : "Customize crew"}
            >
              <InformationCircleIcon className="w-5 h-5 text-blue-400" />
            </button>
          </div>

          {/* Main content: empty state or messages */}
          <div className="flex-1 overflow-hidden min-h-0">
            <div className="h-full overflow-y-auto overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8 custom-scrollbar" ref={scrollRef}>
              <div className="pb-[200px]" ref={messagesRef}>
                {state.messages.length > 0 ? (
                  <>
                    {state.currentStreamingAgent && (
                      <div className="mx-auto max-w-2xl px-4 mb-2">
                        <span className="rounded-full bg-emerald-900/40 px-3 py-1 text-xs font-medium text-emerald-300">
                          {state.currentStreamingAgent} is typing...
                        </span>
                      </div>
                    )}
                    <SwarmChatList
                      messages={state.messages}
                      isCompletionLoading={state.completionLoading}
                      currentStreamingAgent={state.currentStreamingAgent}
                    />
                  </>
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

        {/* Bottom panel: prompt form (full-width overlay, not shrunk by drawer; matches Agent Chat) */}
        {selectedAgents.length >= 1 && (
          <div
            className="fixed inset-x-0 bottom-0 w-full border-t bg-black border-gray-700 shadow-lg rounded-t-xl z-[10] lg:pl-72"
          >
            <div className="mx-auto lg:max-w-[calc(100%-18rem)]">
              <div className="mx-4 sm:mx-8 space-y-4 border-t border-gray-700 px-4 py-2 md:py-4">
                <SwarmPromptForm />
                <p className="text-gray-200 px-2 text-center text-xs leading-normal hidden sm:block">
                  Made with ❤️ in Miami 🌴
                </p>
              </div>
            </div>
          </div>
        )}

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

        {/* Drawer for small screens */}
        <HierarchicalDrawer open={drawerOpen && !isXl} onClose={handleDrawerClose} topOffset={64}>
          <CustomizeCrewPanel
            agents={agents}
            selectedAgents={selectedAgents}
            loading={loading}
            onToggleAgent={toggleAgent}
            onDone={handleDrawerClose}
            onClose={handleDrawerClose}
            showCloseButton
          />
        </HierarchicalDrawer>
      </SwarmChatDispatchContext.Provider>
    </SwarmChatContext.Provider>
  );
}
