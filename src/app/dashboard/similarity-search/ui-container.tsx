"use client";

import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import {
  MagnifyingGlassIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { ContextualAside } from "@/components/similarity-search/contextual-aside";
import Image from "next/image";
import { errorToast } from "@/shared/toasts/errorToast";
import {
  callSimilaritySearch,
  SimilaritySearchResult,
} from "@/services/callSimilaritySearch";

export function SimilaritySearchDemoContainer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [topK, setTopK] = useState(5);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.1);
  const [appliedTopK, setAppliedTopK] = useState(5);
  const [appliedSimilarityThreshold, setAppliedSimilarityThreshold] =
    useState(0.1);
  const settingsRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { isPending, error, data, isFetching, refetch } = useQuery({
    queryKey: [
      "similarity-search",
      submittedQuery,
      appliedTopK,
      appliedSimilarityThreshold,
    ],
    queryFn: async () => {
      if (!submittedQuery.trim()) {
        return { success: true, results: [] };
      }

      const response = await callSimilaritySearch({
        query: submittedQuery,
        top_k: appliedTopK,
        similarity_threshold: appliedSimilarityThreshold,
      });

      if (!response.success) {
        errorToast(response.error ?? "Search failed");
      }

      return response;
    },
    enabled: !!submittedQuery.trim(),
    staleTime: 0,
    retry: 2,
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      setSubmittedQuery(searchQuery.trim());
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setSubmittedQuery(searchQuery.trim());
    }
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleClearCache = () => {
    // Clear all similarity search queries from React Query cache
    queryClient.removeQueries({
      queryKey: ["similarity-search"],
    });
    // Optionally refetch the current query if there is one
    if (submittedQuery.trim()) {
      refetch();
    }
  };

  // Close settings dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setIsSettingsOpen(false);
      }
    };

    if (isSettingsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSettingsOpen]);

  const toggleCardExpansion = (index: number) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleReset = () => {
    // Reset UI to initial state
    setSearchQuery("");
    setSubmittedQuery("");
    setExpandedCards(new Set());
    setIsSettingsOpen(false);

    // Reset settings to defaults
    setTopK(5);
    setSimilarityThreshold(0.1);
    setAppliedTopK(5);
    setAppliedSimilarityThreshold(0.1);

    // Clear any cached queries
    queryClient.removeQueries({
      queryKey: ["similarity-search"],
    });
  };

  if (error)
    return (
      <div className="flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mb-4 mx-auto">
            <InformationCircleIcon className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Search Error
          </h2>
          <p className="text-gray-400 mb-6">{error.message}</p>
          <div className="space-y-3">
            <button
              onClick={handleReset}
              className="flex items-center justify-center space-x-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span>Reset to Initial State</span>
            </button>
            <button
              onClick={() => setSearchQuery("")}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Clear Search
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <>
      {/* Settings and Info Buttons - Fixed positioned in top-right of viewport */}
      <div className="fixed top-20 right-4 z-10 flex items-center space-x-2">
        {/* Settings Button */}
        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600 transition-colors text-white shadow-lg"
          >
            <Cog6ToothIcon className="w-4 h-4 text-blue-400" />
          </button>

          {/* Settings Dropdown */}
          {isSettingsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50">
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Search Settings
                </h3>

                {/* Top K Setting */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Top K Results: {topK}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={topK}
                    onChange={(e) => setTopK(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>1</span>
                    <span>5</span>
                    <span>10</span>
                    <span>15</span>
                    <span>20</span>
                  </div>
                </div>

                {/* Similarity Threshold Setting */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Similarity Threshold:{" "}
                    {(similarityThreshold * 100).toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={similarityThreshold}
                    onChange={(e) =>
                      setSimilarityThreshold(parseFloat(e.target.value))
                    }
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  onClick={() => {
                    setAppliedTopK(topK);
                    setAppliedSimilarityThreshold(similarityThreshold);
                    setIsSettingsOpen(false);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Apply Settings
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Button */}
        <button
          onClick={toggleDrawer}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600 transition-colors text-white shadow-lg"
        >
          <InformationCircleIcon className="w-4 h-4 text-blue-400" />
        </button>
      </div>

      <div className="w-full max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Search Prompts
          </h1>
          <p className="text-gray-400">
            Search through prompts using semantic similarity
          </p>
        </div>

        {/* Search Input */}
        <div className="w-full max-w-2xl mx-auto mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What are you looking for?"
              className="block w-full pl-10 pr-12 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {/* Magnifier glass on the right for mobile */}
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                onClick={handleSearch}
                className="p-1 text-gray-400 hover:text-gray-300 transition-colors"
                title="Search"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">Press Enter to search</p>
            {/* Clear Cache Button */}
            <button
              onClick={handleClearCache}
              className="flex items-center space-x-1 text-xs text-gray-400 hover:text-red-400 transition-colors px-2 py-1 rounded-md hover:bg-red-500/10"
              title="Clear cache and allow reissuing same query"
            >
              <TrashIcon className="w-3 h-3" />
              <span>Clear Cache</span>
            </button>
          </div>
        </div>

        {/* Loading State - Single loader for all loading states */}
        {(isPending || isFetching) && submittedQuery.trim() && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <Image
                src="/loader.svg"
                alt="Loading..."
                width={48}
                height={48}
                className="w-12 h-12"
              />
              <span className="text-gray-400">
                {isPending ? "Searching..." : "Updating results..."}
              </span>
            </div>
          </div>
        )}

        {/* Results */}
        {data?.results && submittedQuery.trim() && !isPending && (
          <div className="space-y-3">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white mb-2">
                Found {data.results.length} similar results
              </h2>
            </div>

            {/* Prompt Results List */}
            <div className="space-y-2">
              {data.results.map(
                (result: SimilaritySearchResult, index: number) => {
                  const scorePercentage = Math.round(result.score * 100);
                  const isExpanded = expandedCards.has(index);
                  const scoreColor =
                    scorePercentage >= 70
                      ? { bg: "rgba(34, 197, 94, 0.2)", border: "rgba(34, 197, 94, 0.4)", text: "#4ade80" }
                      : scorePercentage >= 60
                        ? { bg: "rgba(234, 179, 8, 0.2)", border: "rgba(234, 179, 8, 0.4)", text: "#facc15" }
                        : scorePercentage >= 50
                          ? { bg: "rgba(249, 115, 22, 0.2)", border: "rgba(249, 115, 22, 0.4)", text: "#fb923c" }
                          : scorePercentage >= 40
                            ? { bg: "rgba(239, 68, 68, 0.2)", border: "rgba(239, 68, 68, 0.4)", text: "#f87171" }
                            : { bg: "rgba(107, 114, 128, 0.2)", border: "rgba(107, 114, 128, 0.4)", text: "#9ca3af" };

                  return (
                    <div
                      key={result.metadata.prompt_id ?? index}
                      className={`bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 hover:border-gray-600/70 hover:bg-gray-800/70 transition-all duration-200 group ${
                        isExpanded ? "ring-2 ring-blue-500/20" : ""
                      }`}
                    >
                      {/* Header: name + score */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="flex-shrink-0">
                              <div className="w-6 h-6 bg-blue-600/20 rounded-md flex items-center justify-center">
                                <DocumentTextIcon className="w-3 h-3 text-blue-400" />
                              </div>
                            </div>
                            <h3 className="text-base font-semibold text-white line-clamp-1 group-hover:text-blue-100 transition-colors">
                              {result.metadata.name}
                            </h3>
                          </div>

                          {/* Metadata badges */}
                          <div className="flex items-center flex-wrap gap-2 ml-8 text-xs">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-600/20 text-purple-300 border border-purple-700/30">
                              {result.metadata.type}
                            </span>
                            <span className="text-gray-500">
                              ID: {result.metadata.prompt_id}
                            </span>
                          </div>
                        </div>

                        {/* Score Badge */}
                        <div
                          className="flex-shrink-0 ml-3 border rounded-md px-2.5 py-1 shadow-sm"
                          style={{ backgroundColor: scoreColor.bg, borderColor: scoreColor.border }}
                        >
                          <div className="flex items-center space-x-1">
                            <span className="text-sm font-bold" style={{ color: scoreColor.text }}>
                              {scorePercentage}%
                            </span>
                            <span className="text-xs text-gray-300 font-medium">
                              similarity
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Description preview */}
                      <div className="ml-8">
                        {result.metadata.description && (
                          <p className="text-gray-300 text-sm leading-relaxed line-clamp-2 mb-1">
                            {result.metadata.description}
                          </p>
                        )}

                        {/* Expanded: full prompt content */}
                        {isExpanded && (
                          <div className="space-y-3 pt-3 border-t border-gray-700/50 mt-2">
                            {result.metadata.description && (
                              <div className="bg-gray-900/20 rounded-md p-3">
                                <h5 className="font-medium text-white mb-2 text-sm">
                                  Description
                                </h5>
                                <p className="text-gray-300 text-sm leading-relaxed">
                                  {result.metadata.description}
                                </p>
                              </div>
                            )}

                            <div className="bg-gray-900/20 rounded-md p-3">
                              <h5 className="font-medium text-white mb-2 text-sm">
                                Prompt Content
                              </h5>
                              <pre className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                                {result.metadata.content}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Bar */}
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-700/50 ml-8">
                        <div className="text-xs text-gray-500">
                          <span className="font-medium">
                            Result {index + 1}
                          </span>{" "}
                          of {data.results.length}
                        </div>
                        <button
                          onClick={() => toggleCardExpansion(index)}
                          className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors px-2 py-1 rounded-md hover:bg-blue-500/10"
                        >
                          <span>
                            {isExpanded ? "Show less" : "Show details"}
                          </span>
                          {isExpanded ? (
                            <ChevronUpIcon className="w-3 h-3" />
                          ) : (
                            <ChevronDownIcon className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!submittedQuery.trim() && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Ready to search
            </h3>
            <p className="text-gray-400 text-center max-w-md">
              Enter a search query above and press Enter to find similar prompts
            </p>
          </div>
        )}

        {/* No Results */}
        {data?.results &&
          data.results.length === 0 &&
          submittedQuery.trim() &&
          !isPending && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                No results found
              </h3>
              <p className="text-gray-400 text-center max-w-md">
                Try adjusting your search terms or try a different query
              </p>
            </div>
          )}
      </div>

      <ContextualAside
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
}
