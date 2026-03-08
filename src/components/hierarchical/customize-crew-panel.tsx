"use client";

import { Agent } from "@/services/agentsService";
import { CheckIcon, CogIcon } from "@heroicons/react/24/outline";
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
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header - same as Agent Config */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Customize Crew</h2>
          {showCloseButton && onClose && (
            <DrawerCloseButton onClose={onClose} />
          )}
        </div>

        {/* Content - same structure as Agent Config */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Crew Information - blue info box like Agent Config */}
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CogIcon className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">
                  Crew Information
                </h3>
              </div>
              <p className="text-white text-sm leading-relaxed">
                Choose 1–3 agents to chat with in this room. Configuration and
                crew selection.
              </p>
            </div>

            {/* Agents section - same label style as Basic Information */}
            <div className="space-y-3">
              <h4 className="text-md font-semibold text-white">
                Agents (1–{MAX_AGENTS}):
              </h4>
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
                          className={`w-full text-left rounded-lg transition-colors ${
                            selected
                              ? "ring-2 ring-blue-500/50"
                              : atMax
                                ? "opacity-60 cursor-not-allowed"
                                : "hover:ring-1 hover:ring-gray-600"
                          }`}
                        >
                          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
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
                                <div className="text-xs text-gray-400 mb-0.5">
                                  Agent
                                </div>
                                <span className="text-sm font-medium text-white block truncate">
                                  {agent.name}
                                </span>
                                {systemPrompt && (
                                  <div className="text-xs text-gray-400 mt-2 line-clamp-2 bg-gray-900/50 p-2 rounded border border-gray-700/50">
                                    {systemPrompt}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
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
