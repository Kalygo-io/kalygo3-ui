"use client";

import { Agent, getAgentModelConfig, getAgentVersion, getAgentElevenLabsVoiceId, isAgentConfigV1, isAgentConfigV3, isAgentConfigV4, type ToolV2 } from "@/services/agentsService";
import { ELEVENLABS_VOICES } from "@/shared/app-settings";
import { DrawerCloseButton } from "@/components/shared/drawer-close-button";
import {
  CogIcon,
  CpuChipIcon,
  SpeakerWaveIcon,
  DocumentTextIcon,
  CircleStackIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

export interface SessionAgentsConfigPanelProps {
  selectedAgents: Agent[];
  onClose?: () => void;
  showCloseButton?: boolean;
  onEditSwarmConfig?: () => void;
  maxAgents?: number;
}

function AgentConfigBlock({ agent, index }: { agent: Agent; index: number }) {
  const version = getAgentVersion(agent);
  const modelConfig = getAgentModelConfig(agent);
  const elevenLabsVoiceId = getAgentElevenLabsVoiceId(agent);
  const voiceName = elevenLabsVoiceId
    ? ELEVENLABS_VOICES.find((v) => v.id === elevenLabsVoiceId)?.name ?? elevenLabsVoiceId
    : null;

  return (
    <div className="space-y-3 rounded-xl border border-gray-700/50 bg-gray-800/30 p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-white truncate">
          {agent.name}
        </h4>
        <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-600/50 text-gray-300 border border-gray-600/50">
          v{version}
        </span>
      </div>

      {agent.config?.data?.systemPrompt && (
        <div className="bg-gray-800/50 rounded-lg p-3">
          <span className="text-xs text-gray-400 block mb-1">System Prompt</span>
          <div className="text-sm text-white bg-gray-900/50 p-2 rounded border border-gray-700/50 max-h-32 overflow-y-auto">
            <pre className="whitespace-pre-wrap font-sans text-xs">
              {agent.config.data.systemPrompt}
            </pre>
          </div>
        </div>
      )}

      {(isAgentConfigV3(agent.config) || isAgentConfigV4(agent.config)) && (
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <CpuChipIcon className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">Model</span>
          </div>
          <div className="text-xs text-gray-300 space-y-0.5">
            <div>
              <span className="text-gray-400">Provider: </span>
              <span className="text-white capitalize">{modelConfig.provider}</span>
            </div>
            <div>
              <span className="text-gray-400">Model: </span>
              <span className="text-green-400 font-mono">{modelConfig.model}</span>
            </div>
          </div>
        </div>
      )}

      {isAgentConfigV4(agent.config) && (
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <SpeakerWaveIcon className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-gray-400">TTS Voice</span>
          </div>
          <p className="text-sm text-white">
            {voiceName ?? "Default (app setting)"}
          </p>
        </div>
      )}

      {agent.config && !isAgentConfigV1(agent.config) && agent.config.data?.tools && (agent.config.data.tools as ToolV2[]).length > 0 && (
        <div className="bg-gray-800/50 rounded-lg p-3">
          <span className="text-xs text-gray-400 block mb-2">
            Tools ({(agent.config.data.tools as ToolV2[]).length})
          </span>
          <div className="space-y-1.5">
            {(agent.config.data.tools as ToolV2[]).map((tool: ToolV2, i: number) => {
              if (tool.type === "vectorSearch" || tool.type === "vectorSearchWithReranking") {
                return (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                    <MagnifyingGlassIcon className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                    <span>{tool.type === "vectorSearchWithReranking" ? "Vector + Rerank" : "Vector"}</span>
                    <span className="text-gray-500">·</span>
                    <span className="truncate">{tool.provider} / {tool.index}</span>
                  </div>
                );
              }
              if (tool.type === "dbTableRead") {
                return (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                    <CircleStackIcon className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                    <span>DB Read</span>
                    <span className="text-gray-500">·</span>
                    <span className="truncate">{tool.table}</span>
                  </div>
                );
              }
              if (tool.type === "dbTableWrite") {
                return (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                    <PencilSquareIcon className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                    <span>DB Write</span>
                    <span className="text-gray-500">·</span>
                    <span className="truncate">{tool.table}</span>
                  </div>
                );
              }
              if (tool.type === "sendTxtEmail") {
                return (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                    <EnvelopeIcon className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
                    <span>Send Email</span>
                    {tool.name && (
                      <>
                        <span className="text-gray-500">·</span>
                        <span className="truncate font-mono">{tool.name}</span>
                      </>
                    )}
                  </div>
                );
              }
              return (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                  <DocumentTextIcon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{(tool as ToolV2 & { type?: string }).type ?? "Tool"}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!agent.config && (
        <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-2">
          <p className="text-yellow-300 text-xs">No configuration</p>
        </div>
      )}
    </div>
  );
}

export function SessionAgentsConfigPanel({
  selectedAgents,
  onClose,
  showCloseButton = false,
  onEditSwarmConfig,
  maxAgents = 10,
}: SessionAgentsConfigPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white">Session agents</h2>
          {showCloseButton && onClose && (
            <DrawerCloseButton onClose={onClose} />
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CogIcon className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-semibold text-white">
                  Agent configuration
                </h3>
              </div>
              <p className="text-white text-sm leading-relaxed">
                Review the selected agents for this voice session.
              </p>
              {onEditSwarmConfig && (
                <button
                  type="button"
                  onClick={onEditSwarmConfig}
                  className="mt-3 inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-2 text-sm font-medium text-white transition-colors"
                >
                  Edit Swarm Config
                </button>
              )}
              <p className="text-xs text-blue-200/80 mt-2">
                Select between 1 and {maxAgents} agents.
              </p>
            </div>

            {selectedAgents.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">No agents selected for this session.</p>
            ) : (
              <div className="space-y-4">
                {selectedAgents.map((agent, index) => (
                  <AgentConfigBlock key={agent.id} agent={agent} index={index} />
                ))}
              </div>
            )}
          </div>
        </div>

        {showCloseButton && onClose && (
          <div className="flex-shrink-0 px-4 py-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg bg-gray-700 hover:bg-gray-600 px-3 py-2 text-sm font-medium text-white transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
