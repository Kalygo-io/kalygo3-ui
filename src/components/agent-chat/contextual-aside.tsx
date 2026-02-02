"use client";

import { useState } from "react";
import {
  InformationCircleIcon,
  CogIcon,
  DocumentTextIcon,
  CircleStackIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  CpuChipIcon,
} from "@heroicons/react/24/outline";
import { DrawerCloseButton } from "@/components/shared/drawer-close-button";
import { Agent, KnowledgeBase, isAgentConfigV1, isAgentConfigV3, ToolV2, getAgentModelConfig } from "@/services/agentsService";

interface ContextualAsideProps {
  isOpen: boolean;
  onClose: () => void;
  agent?: Agent | null;
}

export function ContextualAside({
  isOpen,
  onClose,
  agent,
}: ContextualAsideProps) {
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
        className={`fixed inset-y-0 right-0 w-96 bg-gray-900 border-l border-gray-700 z-[80] transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header - positioned below top nav (64px = h-16) */}
          <div className="flex items-center justify-between p-4 pt-20 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Agent Config</h2>
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
                {/* Agent Information */}
                <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CogIcon className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">
                      Agent Information
                    </h3>
                  </div>
                  <p className="text-white text-sm leading-relaxed">
                    Configuration and settings for the current agent.
                  </p>
                </div>

                {/* Agent Name */}
                <div className="space-y-3">
                  <h4 className="text-md font-semibold text-white">
                    Basic Information:
                  </h4>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-400">Agent Name</span>
                      <span className="text-sm font-medium text-white">
                        {agent.name || "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Agent ID */}
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-400">Agent ID</span>
                      <span className="text-sm font-medium text-white font-mono">
                        {agent.id || "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  {agent.status && (
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex flex-col space-y-1">
                        <span className="text-xs text-gray-400">Status</span>
                        <span
                          className={`text-sm font-medium ${
                            agent.status === "active"
                              ? "text-green-400"
                              : "text-gray-400"
                          }`}
                        >
                          {agent.status}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Created/Updated Dates */}
                  {agent.created_at && (
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex flex-col space-y-1">
                        <span className="text-xs text-gray-400">Created</span>
                        <span className="text-sm text-white">
                          {new Date(agent.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {agent.updated_at && (
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex flex-col space-y-1">
                        <span className="text-xs text-gray-400">Last Updated</span>
                        <span className="text-sm text-white">
                          {new Date(agent.updated_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Agent Config */}
                {agent.config && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h4 className="text-md font-semibold text-white">
                        Agent Config v{agent.config.version}:
                      </h4>
                      {agent.config.version === 3 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-600/20 text-green-300 border border-green-500/40">
                          Latest
                        </span>
                      )}
                    </div>

                    {/* System Prompt */}
                    {agent.config.data?.systemPrompt && (
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="flex flex-col space-y-2">
                          <span className="text-xs text-gray-400">
                            System Prompt
                          </span>
                          <div className="text-sm text-white bg-gray-900/50 p-3 rounded border border-gray-700/50 max-h-48 overflow-y-auto">
                            <pre className="whitespace-pre-wrap font-sans">
                              {agent.config.data.systemPrompt}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Model Configuration (V3 only) */}
                    {isAgentConfigV3(agent.config) && (
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <CpuChipIcon className="w-4 h-4 text-green-400" />
                            <span className="text-xs text-gray-400">Model</span>
                          </div>
                          <div className="bg-gray-900/50 p-2 rounded border border-green-700/30">
                            <div className="text-xs text-gray-300 space-y-1">
                              <div>
                                <span className="text-gray-400">Provider: </span>
                                <span className="text-white capitalize">
                                  {getAgentModelConfig(agent).provider}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400">Model: </span>
                                <span className="text-green-400 font-mono">
                                  {getAgentModelConfig(agent).model}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Knowledge Bases / Tools */}
                    {agent.config && isAgentConfigV1(agent.config) && 
                      agent.config.data?.knowledgeBases &&
                      agent.config.data.knowledgeBases.length > 0 && (
                        <div className="bg-gray-800/50 rounded-lg p-3">
                          <div className="flex flex-col space-y-2">
                            <span className="text-xs text-gray-400">
                              Knowledge Bases ({agent.config.data.knowledgeBases.length})
                            </span>
                            <div className="space-y-2">
                              {agent.config.data.knowledgeBases.map(
                                (kb: KnowledgeBase, index: number) => (
                                  <div
                                    key={index}
                                    className="bg-gray-900/50 p-2 rounded border border-gray-700/50"
                                  >
                                    <div className="flex items-center space-x-2 mb-1">
                                      <DocumentTextIcon className="w-4 h-4 text-blue-400" />
                                      <span className="text-xs font-medium text-white">
                                        {kb.provider}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-300 space-y-1 pl-6">
                                      {kb.index && (
                                        <div>
                                          <span className="text-gray-400">Index: </span>
                                          <span className="text-white">{kb.index}</span>
                                        </div>
                                      )}
                                      {kb.namespace && (
                                        <div>
                                          <span className="text-gray-400">Namespace: </span>
                                          <span className="text-white">{kb.namespace}</span>
                                        </div>
                                      )}
                                      {kb.description && (
                                        <div>
                                          <span className="text-gray-400">Description: </span>
                                          <span className="text-white">{kb.description}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                    {/* V2 Tools */}
                    {agent.config && !isAgentConfigV1(agent.config) &&
                      agent.config.data?.tools &&
                      agent.config.data.tools.length > 0 && (
                        <div className="bg-gray-800/50 rounded-lg p-3">
                          <div className="flex flex-col space-y-2">
                            <span className="text-xs text-gray-400">
                              Tools ({agent.config.data.tools.length})
                            </span>
                            <div className="space-y-2">
                              {agent.config.data.tools.map(
                                (tool: ToolV2, index: number) => {
                                  // Vector Search tools
                                  if (tool.type === "vectorSearch" || tool.type === "vectorSearchWithReranking") {
                                    return (
                                      <div
                                        key={index}
                                        className="bg-gray-900/50 p-2 rounded border border-gray-700/50"
                                      >
                                        <div className="flex items-center space-x-2 mb-1">
                                          <MagnifyingGlassIcon className="w-4 h-4 text-purple-400" />
                                          <span className="text-xs font-medium text-white">
                                            {tool.type === "vectorSearchWithReranking" ? "Vector Search + Rerank" : "Vector Search"}
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-300 space-y-1 pl-6">
                                          <div>
                                            <span className="text-gray-400">Provider: </span>
                                            <span className="text-white">{tool.provider}</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-400">Index: </span>
                                            <span className="text-white">{tool.index}</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-400">Namespace: </span>
                                            <span className="text-white">{tool.namespace}</span>
                                          </div>
                                          {tool.description && (
                                            <div>
                                              <span className="text-gray-400">Description: </span>
                                              <span className="text-white">{tool.description}</span>
                                            </div>
                                          )}
                                          {tool.type === "vectorSearchWithReranking" ? (
                                            <div>
                                              <span className="text-gray-400">K: {tool.topK || 20}, N: {tool.topN || 5}</span>
                                            </div>
                                          ) : (
                                            <div>
                                              <span className="text-gray-400">Top K: {tool.topK || 10}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  }

                                  // Database Table Read tool
                                  if (tool.type === "dbTableRead") {
                                    return (
                                      <div
                                        key={index}
                                        className="bg-gray-900/50 p-2 rounded border border-green-700/30"
                                      >
                                        <div className="flex items-center space-x-2 mb-1">
                                          <CircleStackIcon className="w-4 h-4 text-green-400" />
                                          <span className="text-xs font-medium text-white">
                                            Database Table Read
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-300 space-y-1 pl-6">
                                          <div>
                                            <span className="text-gray-400">Table: </span>
                                            <span className="text-white">{tool.table}</span>
                                          </div>
                                          {tool.name && (
                                            <div>
                                              <span className="text-gray-400">Tool Name: </span>
                                              <span className="text-white font-mono">{tool.name}</span>
                                            </div>
                                          )}
                                          <div>
                                            <span className="text-gray-400">Credential ID: </span>
                                            <span className="text-white">{tool.credentialId}</span>
                                          </div>
                                          {tool.columns && tool.columns.length > 0 && (
                                            <div>
                                              <span className="text-gray-400">Columns: </span>
                                              <span className="text-white">{tool.columns.join(", ")}</span>
                                            </div>
                                          )}
                                          <div>
                                            <span className="text-gray-400">Max Limit: </span>
                                            <span className="text-white">{tool.maxLimit || 100}</span>
                                          </div>
                                          {tool.description && (
                                            <div>
                                              <span className="text-gray-400">Description: </span>
                                              <span className="text-white">{tool.description}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  }

                                  // Database Table Write tool
                                  if (tool.type === "dbTableWrite") {
                                    return (
                                      <div
                                        key={index}
                                        className="bg-gray-900/50 p-2 rounded border border-orange-700/30"
                                      >
                                        <div className="flex items-center space-x-2 mb-1">
                                          <PencilSquareIcon className="w-4 h-4 text-orange-400" />
                                          <span className="text-xs font-medium text-white">
                                            Database Table Write
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-300 space-y-1 pl-6">
                                          <div>
                                            <span className="text-gray-400">Table: </span>
                                            <span className="text-white">{tool.table}</span>
                                          </div>
                                          {tool.name && (
                                            <div>
                                              <span className="text-gray-400">Tool Name: </span>
                                              <span className="text-white font-mono">{tool.name}</span>
                                            </div>
                                          )}
                                          <div>
                                            <span className="text-gray-400">Credential ID: </span>
                                            <span className="text-white">{tool.credentialId}</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-400">Columns: </span>
                                            <span className="text-white">{tool.columns.join(", ")}</span>
                                          </div>
                                          {tool.requiredColumns && tool.requiredColumns.length > 0 && (
                                            <div>
                                              <span className="text-gray-400">Required: </span>
                                              <span className="text-orange-400">{tool.requiredColumns.join(", ")}</span>
                                            </div>
                                          )}
                                          {tool.injectAccountId && (
                                            <div>
                                              <span className="text-orange-400">+ Auto-inject account_id</span>
                                            </div>
                                          )}
                                          {tool.injectChatSessionId && (
                                            <div>
                                              <span className="text-orange-400">+ Auto-inject chat_session_id</span>
                                            </div>
                                          )}
                                          {tool.description && (
                                            <div>
                                              <span className="text-gray-400">Description: </span>
                                              <span className="text-white">{tool.description}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  }

                                  // Fallback for unknown tool types
                                  return (
                                    <div
                                      key={index}
                                      className="bg-gray-900/50 p-2 rounded border border-gray-700/50"
                                    >
                                      <div className="flex items-center space-x-2 mb-1">
                                        <DocumentTextIcon className="w-4 h-4 text-gray-400" />
                                        <span className="text-xs font-medium text-white">
                                          {(tool as any).type || "Unknown Tool"}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                    {/* No Knowledge Bases / Tools */}
                    {agent.config && isAgentConfigV1(agent.config) && 
                      (!agent.config.data?.knowledgeBases ||
                      agent.config.data.knowledgeBases.length === 0) && (
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="flex flex-col space-y-1">
                          <span className="text-xs text-gray-400">
                            Knowledge Bases
                          </span>
                          <span className="text-sm text-gray-500 italic">
                            No knowledge bases configured
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {agent.config && !isAgentConfigV1(agent.config) &&
                      (!agent.config.data?.tools ||
                      agent.config.data.tools.length === 0) && (
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="flex flex-col space-y-1">
                          <span className="text-xs text-gray-400">
                            Tools
                          </span>
                          <span className="text-sm text-gray-500 italic">
                            No tools configured
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* No Config */}
                {!agent.config && (
                  <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <InformationCircleIcon className="w-5 h-5 text-yellow-400" />
                      <p className="text-yellow-300 text-sm">
                        No agent configuration available
                      </p>
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
