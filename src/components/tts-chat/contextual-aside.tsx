"use client";

import {
  InformationCircleIcon,
  CogIcon,
  SpeakerWaveIcon,
} from "@heroicons/react/24/outline";
import { DrawerCloseButton } from "@/components/shared/drawer-close-button";
import { Agent, AgentTool } from "@/services/agentsService";
import { ToolDisplayCard } from "@/components/shared/tool-display-card";

interface TtsChatContextualAsideProps {
  isOpen: boolean;
  onClose: () => void;
  agent?: Agent | null;
}

export function TtsChatContextualAside({
  isOpen,
  onClose,
  agent,
}: TtsChatContextualAsideProps) {
  return (
    <>
      {/* Mobile overlay backdrop */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-[75] lg:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-16 bottom-0 right-0 w-96 bg-gray-900 border-l border-purple-700/50 z-[80] transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-purple-700/50">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">Agent Config</h2>
              <SpeakerWaveIcon className="w-5 h-5 text-purple-400" />
            </div>
            <DrawerCloseButton onClose={onClose} />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {!agent ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-400">No agent selected</div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* TTS Chat Info Banner */}
                <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <SpeakerWaveIcon className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-semibold text-white">TTS Chat Agent</h3>
                  </div>
                  <p className="text-white text-sm leading-relaxed">
                    This agent is configured with streaming text-to-speech for voice responses.
                    Audio will automatically play as the agent responds.
                  </p>
                </div>

                {/* Agent Information */}
                <div className="bg-gray-800/50 border border-gray-700/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CogIcon className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-semibold text-white">Agent Information</h3>
                  </div>
                  <p className="text-white text-sm leading-relaxed">
                    Configuration and settings for the current agent.
                  </p>
                </div>

                {/* Basic Info */}
                <div className="space-y-3">
                  <h4 className="text-md font-semibold text-white">Basic Information:</h4>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-400">Agent Name</span>
                      <span className="text-sm font-medium text-white">{agent.name || "N/A"}</span>
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-400">Agent ID</span>
                      <span className="text-sm font-medium text-white font-mono">{agent.id || "N/A"}</span>
                    </div>
                  </div>
                  {agent.status && (
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex flex-col space-y-1">
                        <span className="text-xs text-gray-400">Status</span>
                        <span className={`text-sm font-medium ${agent.status === "active" ? "text-green-400" : "text-gray-400"}`}>
                          {agent.status}
                        </span>
                      </div>
                    </div>
                  )}
                  {agent.created_at && (
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex flex-col space-y-1">
                        <span className="text-xs text-gray-400">Created</span>
                        <span className="text-sm text-white">{new Date(agent.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  {agent.updated_at && (
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex flex-col space-y-1">
                        <span className="text-xs text-gray-400">Last Updated</span>
                        <span className="text-sm text-white">{new Date(agent.updated_at).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Agent Config */}
                {agent.config ? (
                  <div className="space-y-3">
                    <h4 className="text-md font-semibold text-white">Agent Config:</h4>

                    {agent.config.data?.systemPrompt && (
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="flex flex-col space-y-2">
                          <span className="text-xs text-gray-400">System Prompt</span>
                          <div className="text-sm text-white bg-gray-900/50 p-3 rounded border border-purple-700/30 max-h-48 overflow-y-auto">
                            <pre className="whitespace-pre-wrap font-sans">{agent.config.data.systemPrompt}</pre>
                          </div>
                        </div>
                      </div>
                    )}

                    {agent.config.data?.tools && agent.config.data.tools.length > 0 ? (
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <span className="text-xs text-gray-400 block mb-2">
                          Tools ({agent.config.data.tools.length})
                        </span>
                        <div className="space-y-2">
                          {agent.config.data.tools.map((tool: AgentTool, i: number) => (
                            <ToolDisplayCard key={i} tool={tool} />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <span className="text-xs text-gray-400">Tools</span>
                        <p className="text-sm text-gray-500 italic mt-1">No tools configured</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <InformationCircleIcon className="w-5 h-5 text-yellow-400" />
                      <p className="text-yellow-300 text-sm">No agent configuration available</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
