"use client";

import React from "react";
import { useState } from "react";
import {
  MagnifyingGlassIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { ContextualAside } from "@/components/similarity-search/contextual-aside";
import Image from "next/image";
import { errorToast } from "@/shared/toasts/errorToast";
import {
  callSimilaritySearch,
  SimilaritySearchResult,
  SimilaritySearchResponse,
} from "@/services/callSimilaritySearch";
import {
  SearchBar,
  SettingsDropdown,
  useSearchDemo,
  scoreBadgeColor,
} from "@/components/shared/search-demo";

export function SimilaritySearchDemoContainer() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [topK, setTopK] = useState(5);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.1);
  const [appliedTopK, setAppliedTopK] = useState(5);
  const [appliedSimilarityThreshold, setAppliedSimilarityThreshold] =
    useState(0.1);

  const {
    searchQuery,
    setSearchQuery,
    submittedQuery,
    setSubmittedQuery,
    submit: handleSearch,
    queryClient,
    query: { isPending, error, data, isFetching, refetch },
  } = useSearchDemo<SimilaritySearchResponse>({
    queryKeyBase: "similarity-search",
    queryKeyParams: [appliedTopK, appliedSimilarityThreshold],
    emptyResult: { success: true, results: [] },
    staleTime: 0,
    retry: 2,
    search: async (submittedQuery) => {
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
  });

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
      <SettingsDropdown
        containerZ="z-10"
        onInfoClick={toggleDrawer}
        onApply={() => {
          setAppliedTopK(topK);
          setAppliedSimilarityThreshold(similarityThreshold);
        }}
      >
        {/* Top K Setting */}
        <div>
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
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Similarity Threshold: {(similarityThreshold * 100).toFixed(0)}%
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
      </SettingsDropdown>

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
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSubmit={handleSearch}
          submitIcon="paper-airplane"
          className="w-full max-w-2xl mx-auto mb-6"
          footerJustify="between"
          caption={
            <p className="text-xs text-gray-500">Press Enter to search</p>
          }
          footerRight={
            <button
              onClick={handleClearCache}
              className="flex items-center space-x-1 text-xs text-gray-400 hover:text-red-400 transition-colors px-2 py-1 rounded-md hover:bg-red-500/10"
              title="Clear cache and allow reissuing same query"
            >
              <TrashIcon className="w-3 h-3" />
              <span>Clear Cache</span>
            </button>
          }
        />

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
                  const scoreColor = scoreBadgeColor(scorePercentage);

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
