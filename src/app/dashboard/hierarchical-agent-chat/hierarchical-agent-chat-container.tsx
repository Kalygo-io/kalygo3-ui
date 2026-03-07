"use client";

import { useState, useEffect } from "react";
import { agentsService, Agent } from "@/services/agentsService";
import { errorToast } from "@/shared/toasts/errorToast";
import {
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { CustomizeCrewPanel } from "@/components/hierarchical/customize-crew-panel";
import { HierarchicalDrawer } from "@/components/hierarchical/drawer";

const MAX_AGENTS = 3;

export function HierarchicalAgentChatContainer() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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
        error instanceof Error ? error.message : "Failed to load agents"
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

  return (
    <>
      {/* Main content: padding-right on xl so content doesn't go under the aside */}
      <div className="xl:pr-96">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <UserGroupIcon className="h-8 w-8 text-blue-400" />
              <h1 className="text-3xl font-bold text-white">
                Hierarchical Agent Chat
              </h1>
            </div>
            <p className="text-gray-400">
              Chat with a room of agents. Customize the crew in the panel to
              the right (or open the panel on smaller screens).
            </p>
          </div>

          {/* Chat area */}
          <div className="flex flex-col min-h-[calc(100vh-12rem)] rounded-xl border border-gray-700/50 bg-gray-800/50 overflow-hidden">
            {selectedAgents.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-600 mb-4" />
                <p className="text-gray-400 text-lg mb-2">No agents selected</p>
                <p className="text-gray-500 text-sm mb-6 max-w-md">
                  Open the Customize Crew panel and choose 1–3 agents to chat
                  with in this room.
                </p>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="xl:hidden inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Cog6ToothIcon className="h-5 w-5" />
                  Open panel
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 p-3 border-b border-gray-700/50 bg-gray-900/50 flex-shrink-0">
                  <span className="text-sm text-gray-400 mr-2">
                    In this room:
                  </span>
                  {selectedAgents.map((agent) => (
                    <span
                      key={agent.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700/80 text-white text-sm font-medium"
                    >
                      {agent.name}
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="xl:hidden text-xs text-blue-400 hover:text-blue-300 ml-2"
                  >
                    Change
                  </button>
                  <span className="xl:inline hidden text-xs text-gray-500 ml-2">
                    (Edit in panel →)
                  </span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-0">
                  <p className="text-gray-500 text-sm">
                    Chat UI will go here. You have {selectedAgents.length} agent
                    {selectedAgents.length !== 1 ? "s" : ""} in the room.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Fixed aside: Customize Crew panel (visible on xl) */}
      <aside className="fixed inset-y-0 right-0 hidden w-96 overflow-y-auto border-l border-gray-700 bg-gray-800 shadow-xl xl:block pt-16">
        <CustomizeCrewPanel
          agents={agents}
          selectedAgents={selectedAgents}
          loading={loading}
          onToggleAgent={toggleAgent}
          showCloseButton={false}
        />
      </aside>

      {/* Floating cog: open drawer on smaller screens (xl:hidden) */}
      <div
        className="fixed top-20 right-4 z-10 xl:hidden"
        style={{ top: "5.5rem" }}
      >
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 hover:text-white transition-colors shadow-lg"
          title="Customize Crew"
          aria-label="Open Customize Crew panel"
        >
          <Cog6ToothIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Drawer: same Customize Crew content for smaller screens */}
      <HierarchicalDrawer
        open={drawerOpen}
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
