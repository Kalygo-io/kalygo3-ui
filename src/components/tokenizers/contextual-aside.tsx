"use client";

import { useState } from "react";
import {
  InformationCircleIcon,
  LightBulbIcon,
  ChartBarIcon,
  AcademicCapIcon,
  CogIcon,
} from "@heroicons/react/24/outline";
import { DrawerCloseButton } from "@/components/shared/drawer-close-button";

interface TokenizersContextualAsideProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TokenizersContextualAside({
  isOpen,
  onClose,
}: TokenizersContextualAsideProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", name: "Overview", icon: InformationCircleIcon },
    { id: "advanced", name: "Advanced", icon: AcademicCapIcon },
    { id: "implementation", name: "Implementation", icon: CogIcon },
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
            <h2 className="text-lg font-semibold text-white">Tokenizers</h2>
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
                    The Foundation of AI Data Processing
                  </h3>
                  <p className="text-white text-sm leading-relaxed">
                    Tokenizers are the first step in any AI processing pipeline.
                    They convert raw data into a format that AI models can
                    understand and process efficiently.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-md font-semibold text-white">
                    Key Concepts:
                  </h4>
                  <ul className="space-y-2 text-sm text-white">
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>
                        <strong>Tokens:</strong> The smallest units of meaning
                        in data
                      </span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>
                        <strong>Vocabulary:</strong> The set of all possible
                        tokens
                      </span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>
                        <strong>Encoding:</strong> Converting text to token IDs
                      </span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>
                        <strong>Decoding:</strong> Converting token IDs back to
                        text
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-white mb-2">
                    Why This Matters?
                  </h4>
                  <p className="text-white text-sm leading-relaxed">
                    The quality of &quot;tokenization&quot; directly affects how
                    well a system can understand and compare data.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "advanced" && (
              <div className="space-y-4">
                <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Advanced Tokenization Concepts
                  </h3>
                  <p className="text-white text-sm leading-relaxed">
                    Deep dive into the technical aspects of tokenization.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-md font-semibold text-white">
                    Tokenization Strategies:
                  </h4>

                  <div className="bg-gray-800 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-white mb-2">
                      Byte Pair Encoding (BPE)
                    </h5>
                    <p className="text-gray-300 text-xs">
                      Iteratively merges the most frequent character pairs,
                      creating a vocabulary that balances vocabulary size with
                      coverage.
                    </p>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-white mb-2">
                      WordPiece
                    </h5>
                    <p className="text-gray-300 text-xs">
                      Similar to BPE but uses likelihood instead of frequency,
                      often producing better subword units for language
                      modeling.
                    </p>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-white mb-2">
                      SentencePiece
                    </h5>
                    <p className="text-gray-300 text-xs">
                      Language-agnostic tokenization that treats text as Unicode
                      characters, making it effective for multilingual
                      applications.
                    </p>
                  </div>
                </div>

                <div className="bg-orange-900/20 border border-orange-700/30 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-white mb-2">
                    Performance Considerations
                  </h4>
                  <ul className="space-y-1 text-sm text-white">
                    <li>• Vocabulary size affects memory usage</li>
                    <li>• Token length impacts processing speed</li>
                    <li>• Subword coverage influences model quality</li>
                    <li>
                      • Special tokens add overhead but improve performance
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "implementation" && (
              <div className="space-y-4">
                <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Implementation Best Practices
                  </h3>
                  <p className="text-white text-sm leading-relaxed">
                    Practical guidelines for implementing tokenization.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-md font-semibold text-white">
                    Key Principles:
                  </h4>

                  <div className="bg-gray-800 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-white mb-2">
                      Consistency
                    </h5>
                    <p className="text-gray-300 text-xs">
                      Use the same tokenizer for both indexing and querying to
                      ensure consistent representation.
                    </p>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-white mb-2">
                      Special Tokens
                    </h5>
                    <p className="text-gray-300 text-xs">
                      Include special tokens for padding, unknown words, and
                      sentence boundaries to improve model understanding.
                    </p>
                  </div>
                </div>

                <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-white mb-2">
                    Common Pitfalls
                  </h4>
                  <ul className="space-y-1 text-sm text-white">
                    <li>
                      • Inconsistent tokenization between training and inference
                    </li>
                    <li>• Not handling out-of-vocabulary tokens properly</li>
                    <li>• Over-tokenization leading to information loss</li>
                  </ul>
                </div>

                <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-white mb-2">
                    Evaluation Metrics
                  </h4>
                  <p className="text-white text-sm leading-relaxed">
                    Monitor tokenization quality through vocabulary coverage,
                    average token length, and downstream task performance.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
