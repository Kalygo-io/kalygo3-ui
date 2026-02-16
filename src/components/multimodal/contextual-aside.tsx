"use client";

import { useState } from "react";
import {
  InformationCircleIcon,
  LightBulbIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { DrawerCloseButton } from "@/components/shared/drawer-close-button";

interface ContextualAsideProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContextualAside({ isOpen, onClose }: ContextualAsideProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", name: "Overview", icon: InformationCircleIcon },
    { id: "flowchart", name: "Flow Chart", icon: ChartBarIcon },
  ];

  return (
    <>
      {/* Mobile overlay backdrop */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-16 bottom-0 right-0 w-96 bg-gray-900 border-l border-gray-700 z-[70] transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">
              Multimodal Context
            </h2>
            <DrawerCloseButton onClose={onClose} />
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-700 overflow-x-auto">
            <div className="flex min-w-max">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? "text-blue-400 border-b-2 border-blue-400 bg-gray-800"
                        : "text-gray-400 hover:text-gray-300 hover:bg-gray-800"
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">{tab.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "overview" && (
              <div className="space-y-4">
                <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    What are Multimodal Embeddings?
                  </h3>
                  <p className="text-white text-sm leading-relaxed">
                    Multimodal embeddings enable AI systems to understand and
                    process multiple types of data simultaneously - text,
                    images, audio, and more. This creates a unified
                    representation space for different modalities.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-md font-semibold text-white">
                    Key Characteristics:
                  </h4>
                  <ul className="space-y-2 text-sm text-white">
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Processes text, images, audio, and video</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Creates unified vector representations</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Enables cross-modal understanding</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Improves RAG with visual context</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "flowchart" && (
              <div className="space-y-4">
                <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Multimodal Flow Chart
                  </h3>
                  <p className="text-white text-sm leading-relaxed">
                    A visual representation of how multimodal embeddings process
                    different data types and create unified representations.
                  </p>
                </div>

                <div className="bg-gray-800 rounded-lg p-8 text-center">
                  <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-white text-lg font-medium">Coming Soon</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
