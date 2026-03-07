"use client";

import { Agent } from "@/services/agentsService";
import { CheckIcon } from "@heroicons/react/24/outline";
import { DrawerCloseButton } from "@/components/shared/drawer-close-button";

const MAX_AGENTS = 3;

export interface CustomizeCrewPanelProps {
  agents: Agent[];
  selectedAgents: Agent[];
  loading: boolean;
  onToggleAgent: (agent: Agent) => void;
  onDone?: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export function CustomizeCrewPanel({
  agents,
  selectedAgents,
  loading,
  onToggleAgent,
  onDone,
  onClose,
  showCloseButton = false,
}: CustomizeCrewPanelProps) {
  const isSelected = (agent: Agent) =>
    selectedAgents.some((a) => a.id === agent.id);

  return (
    <div className="flex h-full flex-col divide-y divide-gray-700">
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">
            Customize Crew
          </h2>
          {showCloseButton && onClose && (
            <DrawerCloseButton onClose={onClose} />
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-400 mb-4">
            Choose 1–3 agents to chat with in this room. Customize the crew from
            the panel or drawer.
          </p>
          {loading ? (
            <p className="text-gray-500 text-sm">Loading agents…</p>
          ) : agents.length === 0 ? (
            <p className="text-gray-500 text-sm">No agents available.</p>
          ) : (
            <ul className="space-y-2">
              {agents.map((agent) => {
                const selected = isSelected(agent);
                const atMax =
                  selectedAgents.length >= MAX_AGENTS && !selected;
                const systemPrompt = agent.config?.data?.systemPrompt;
                return (
                  <li key={agent.id}>
                    <button
                      type="button"
                      onClick={() => onToggleAgent(agent)}
                      disabled={atMax}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selected
                          ? "border-blue-500 bg-blue-600/20"
                          : atMax
                            ? "border-gray-600 bg-gray-800/50 opacity-60 cursor-not-allowed"
                            : "border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center mt-0.5 ${
                            selected
                              ? "bg-blue-600 border-blue-500"
                              : "border-gray-500"
                          }`}
                        >
                          {selected && (
                            <CheckIcon className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-white truncate">
                            {agent.name}
                          </div>
                          {systemPrompt && (
                            <p className="text-sm text-gray-400 line-clamp-2 mt-0.5">
                              {systemPrompt}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {(onDone || onClose) && (
          <div className="flex flex-shrink-0 justify-end gap-2 px-4 py-4 sm:px-6 lg:px-8 border-t border-gray-700">
            {showCloseButton && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-gray-200 ring-1 ring-inset ring-gray-600 hover:bg-white/15"
              >
                Close panel
              </button>
            )}
            {onDone && (
              <button
                type="button"
                onClick={onDone}
                className="inline-flex justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Done
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
