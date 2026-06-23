"use client";

import React from "react";
import { useState } from "react";
import {
  MagnifyingGlassIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";
import { ContextualAside } from "@/components/reranking/contextual-aside";
import {
  SearchBar,
  SettingsDropdown,
  useSearchDemo,
  scoreColorHex8,
  scoreBadgeColor,
} from "@/components/shared/search-demo";

interface RerankingResult {
  metadata: {
    chunkId: number;
    chunkNumber: number;
    chunkSizeTokens: number;
    content: string;
    filename: string;
    totalChunks: number;
    uploadTimestamp: string;
  };
  similarity_score: number;
  relevance_score: number;
}

export function RerankingDemoContainer() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<"first" | "second">("first");
  const [topKForSimilarity, setTopKForSimilarity] = useState(10);
  const [topKForRerank, setTopKForRerank] = useState(5);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.1);
  const [appliedTopKForSimilarity, setAppliedTopKForSimilarity] = useState(10);
  const [appliedTopKForRerank, setAppliedTopKForRerank] = useState(5);
  const [appliedSimilarityThreshold, setAppliedSimilarityThreshold] =
    useState(0.1);

  // Real API call for reranking search
  const {
    searchQuery,
    setSearchQuery,
    submit: handleSubmit,
    setSubmittedQuery,
    queryClient,
    query: { isPending, error, data, isFetching },
  } = useSearchDemo<{
    firstStage: RerankingResult[];
    reranked: RerankingResult[];
  }>({
    queryKeyBase: "reranking",
    queryKeyParams: [
      appliedTopKForSimilarity,
      appliedTopKForRerank,
      appliedSimilarityThreshold,
    ],
    emptyResult: { firstStage: [], reranked: [] },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    search: async (submittedQuery) => {
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_AI_API_URL}/api/reranking/search`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: submittedQuery,
            top_k_for_similarity: appliedTopKForSimilarity,
            top_k_for_rerank: appliedTopKForRerank,
            similarity_threshold: appliedSimilarityThreshold,
          }),
        }
      );

      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
      }

      const responseData = await resp.json();

      // Transform the API response to match our expected format
      // Ensure first stage shows more results than reranked stage
      const firstStageResults = responseData.initial_similarity_results || [];
      const rerankedResults = responseData.reranked_results || [];

      return {
        firstStage: firstStageResults,
        reranked: rerankedResults,
      };
    },
  });

  const clearCache = () => {
    // Clear all reranking queries
    queryClient.invalidateQueries({ queryKey: ["reranking"] });
    // Clear the submitted query
    setSubmittedQuery("");
    // Or clear all queries
    // queryClient.clear();
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const toggleCardExpansion = (index: number, stage: "first" | "reranked") => {
    const key = `${stage}-${index}`;
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      // @ts-ignore
      if (newSet.has(key)) {
        // @ts-ignore
        newSet.delete(key);
      } else {
        // @ts-ignore
        newSet.add(key);
      }
      return newSet;
    });
  };

  const RerankingCard = ({
    result,
    index,
    stage,
  }: {
    result: RerankingResult;
    index: number;
    stage: "first" | "reranked";
  }) => {
    // Use different scores based on the stage
    let scorePercentage;

    if (stage === "first") {
      scorePercentage = Math.round(result.similarity_score * 100);
    } else if (
      result.relevance_score !== undefined &&
      result.relevance_score !== null
    ) {
      scorePercentage = Math.round(result.relevance_score * 100);
    } else {
      throw new Error("No score found");
    }

    const scoreLabel = stage === "first" ? "similarity" : "relevance";
    // @ts-ignore
    const isExpanded = expandedCards.has(`${stage}-${index}`);

    // Check if this result made it through to reranked results
    const madeItThrough =
      stage === "first" &&
      data?.reranked.some(
        (rerankedResult: RerankingResult) =>
          rerankedResult.metadata.chunkId === result.metadata.chunkId
      );

    const badge = scoreBadgeColor(scorePercentage);

    return (
      <div
        className={`bg-gray-800/50 border rounded-lg p-4 hover:border-gray-600 transition-all duration-200 ${
          madeItThrough
            ? "border-yellow-400 border-2 bg-yellow-900/20 shadow-lg shadow-yellow-500/20 ring-1 ring-yellow-300/30"
            : "border-gray-700/50"
        }`}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center space-x-2 flex-1">
            <h3 className="text-md font-semibold text-white line-clamp-2">
              {index + 1}) Chunk {result.metadata.chunkId}
            </h3>
            {/* {madeItThrough && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-600/20 text-amber-300 border border-amber-500/40">
                <StarIcon className="w-3 h-3 mr-1" />
                Made Top {appliedTopKForRerank}
              </span>
            )} */}
          </div>
          <div
            className="flex-shrink-0 ml-3 border rounded-md px-2.5 py-1 shadow-sm"
            style={{
              backgroundColor: badge.bg,
              borderColor: badge.border,
            }}
          >
            <div className="flex items-center space-x-1">
              <span
                className="text-sm font-bold"
                style={{ color: badge.text }}
              >
                {scorePercentage}%
              </span>
              <span className="text-xs text-gray-300 font-medium">
                {scoreLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p
            className={`text-gray-300 text-sm ${
              isExpanded ? "" : "line-clamp-2"
            }`}
          >
            {result.metadata.content}
          </p>

          {isExpanded && (
            <div className="space-y-2 text-xs text-gray-300">
              <div className="border-t border-gray-700 pt-2">
                <div className="flex items-center space-x-2 mb-2">
                  <DocumentIcon className="w-3 h-3 text-gray-400" />
                  <span className="font-medium">File:</span>
                  <span>{result.metadata.filename}</span>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-medium">Chunk ID:</span>
                  <span>{result.metadata.chunkId}</span>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-medium">Chunk Size:</span>
                  <span>{result.metadata.chunkSizeTokens} tokens</span>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-medium">Similarity Score:</span>
                  <span>{Math.round(result.similarity_score * 100)}%</span>
                  {stage === "reranked" &&
                    result.relevance_score === undefined && (
                      <span className="text-xs text-yellow-400 ml-2">
                        (⚠️ No reranked score from API)
                      </span>
                    )}
                </div>
                {stage === "reranked" && result.relevance_score && (
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium">Relevance Score:</span>
                    <span>{Math.round(result.relevance_score * 100)}%</span>
                    {Math.round(result.relevance_score * 100) ===
                      Math.round(result.similarity_score * 100) && (
                      <span className="text-xs text-red-400 ml-2">
                        (⚠️ Same as similarity score)
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Uploaded:</span>
                  <span>
                    {new Date(
                      parseInt(result.metadata.uploadTimestamp)
                    ).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-700">
          <div className="text-xs text-gray-500">
            <span className="font-medium">
              Result {index + 1} of{" "}
              {stage === "first" ? "similarity" : "reranked"}
            </span>
          </div>
          <button
            onClick={() => toggleCardExpansion(index, stage)}
            className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUpIcon className="w-3 h-3 inline mr-1" />
                See less
              </>
            ) : (
              <>
                <ChevronDownIcon className="w-3 h-3 inline mr-1" />
                See more
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  if (error)
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-400 text-center">
          <p className="text-lg font-semibold mb-2">An error has occurred</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );

  return (
    <>
      {/* Settings and Info Buttons - Fixed positioned in top-right of viewport */}
      <SettingsDropdown
        onInfoClick={toggleDrawer}
        onApply={() => {
          setAppliedTopKForSimilarity(topKForSimilarity);
          setAppliedTopKForRerank(topKForRerank);
          setAppliedSimilarityThreshold(similarityThreshold);
        }}
      >
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Top K for Similarity Search: {topKForSimilarity}
          </label>
          <input
            type="range"
            min="1"
            max="50"
            value={topKForSimilarity}
            onChange={(e) => setTopKForSimilarity(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>1</span>
            <span>50</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Top K for Reranking: {topKForRerank}
          </label>
          <input
            type="range"
            min="1"
            max="20"
            value={topKForRerank}
            onChange={(e) => setTopKForRerank(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>1</span>
            <span>20</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Similarity Threshold: {similarityThreshold.toFixed(2)}
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
            <span>0.00</span>
            <span>1.00</span>
          </div>
        </div>
      </SettingsDropdown>

      <div className="w-full max-w-7xl mx-auto p-6 overflow-hidden">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Reranking (aka 2-Stage Retrieval)
          </h1>
          <p className="text-gray-400">
            Compare similarity search with reranking
          </p>
        </div>

        {/* Search Input */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSubmit={handleSubmit}
          submitIcon="magnifier"
          className="w-full max-w-2xl mx-auto mb-8"
          footerJustify="center"
          caption={
            <p className="text-xs text-gray-500">Press Enter to search</p>
          }
          footerRight={
            <button
              onClick={clearCache}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              title="Clear query cache"
            >
              🗑️ Clear Cache
            </button>
          }
        />

        {/* Results - Two Column Layout */}
        {data && (data.firstStage.length > 0 || data.reranked.length > 0) && (
          <div className="space-y-6">
            <div className="text-center max-w-full">
              <h2 className="text-xl font-semibold text-white mb-2">
                Two-Stage Retrieval Results
              </h2>
              {data.firstStage.length === data.reranked.length && (
                <div className="max-w-full mb-4">
                  <p className="text-sm text-yellow-400 break-words">
                    ⚠️ Both stages show the same number of results. The first
                    stage should show {appliedTopKForSimilarity} results, and
                    the second stage should show {appliedTopKForRerank} results.
                  </p>
                </div>
              )}

              {/* Check if reranking actually reordered the results */}
              {(() => {
                const firstStageChunkIds = data.firstStage.map(
                  (r: RerankingResult) => r.metadata.chunkId
                );
                const rerankedChunkIds = data.reranked.map(
                  (r: RerankingResult) => r.metadata.chunkId
                );
                const isReordered =
                  JSON.stringify(firstStageChunkIds.slice(0, 5)) !==
                  JSON.stringify(rerankedChunkIds.slice(0, 5));

                if (!isReordered && data.firstStage.length > 0) {
                  return (
                    <div className="max-w-full mb-4">
                      <p className="text-sm text-red-400 break-words">
                        🚨 Reranking returned same order as similarity search.
                        This indicates the reranking algorithm may not be
                        working properly.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Mobile Tab Selector */}
            <div className="lg:hidden">
              <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab("first")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "first"
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  First Stage ({data.firstStage.length})
                </button>
                <button
                  onClick={() => setActiveTab("second")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "second"
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  Second Stage ({data.reranked.length})
                </button>
              </div>
            </div>

            {/* Desktop: Always Side-by-Side */}
            <div className="hidden lg:flex lg:gap-4 xl:gap-8 max-w-full">
              {/* First Stage - Similarity Search */}
              <div className="flex-1 space-y-4 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    First Stage: Similarity Search
                  </h3>
                  <span className="text-sm text-gray-400 flex-shrink-0">
                    {data.firstStage.length} results (Top{" "}
                    {appliedTopKForSimilarity})
                  </span>
                </div>

                <div className="space-y-3">
                  {data.firstStage.map(
                    (result: RerankingResult, index: number) => (
                      <RerankingCard
                        key={`first-${index}`}
                        result={result}
                        index={index}
                        stage="first"
                      />
                    )
                  )}
                </div>
              </div>

              {/* Small Arrow Separator */}
              <div className="flex items-center justify-center px-2 flex-shrink-0">
                <ArrowRightIcon className="w-4 h-4 text-blue-400" />
              </div>

              {/* Second Stage - Reranked Results */}
              <div className="flex-1 space-y-4 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    Second Stage: Reranked Results
                  </h3>
                  <span className="text-sm text-gray-400 flex-shrink-0">
                    {data.reranked.length} results (Top {appliedTopKForRerank})
                  </span>
                </div>

                <div className="space-y-3">
                  {data.reranked.map(
                    (result: RerankingResult, index: number) => (
                      <RerankingCard
                        key={`reranked-${index}`}
                        result={result}
                        index={index}
                        stage="reranked"
                      />
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Mobile: Tab-based Layout */}
            <div className="lg:hidden space-y-6">
              {/* Active Tab Content */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    {activeTab === "first"
                      ? "First Stage: Similarity Search"
                      : "Second Stage: Rerank"}
                  </h3>
                  <span className="text-sm text-gray-400">
                    {activeTab === "first"
                      ? data.firstStage.length
                      : data.reranked.length}{" "}
                    results
                  </span>
                </div>

                <div className="space-y-3">
                  {(activeTab === "first"
                    ? data.firstStage
                    : data.reranked
                  ).map((result: RerankingResult, index: number) => (
                    <RerankingCard
                      key={`${activeTab}-${index}`}
                      result={result}
                      index={index}
                      // @ts-ignore
                      stage={activeTab}
                    />
                  ))}
                </div>
              </div>

              {/* Preview of Other Tab */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium text-gray-400">
                    {activeTab === "first"
                      ? "Second Stage Preview"
                      : "First Stage Preview"}
                  </h4>
                  <span className="text-xs text-gray-500">
                    {activeTab === "first"
                      ? data.reranked.length
                      : data.firstStage.length}{" "}
                    results
                  </span>
                </div>

                <div className="space-y-2">
                  {(activeTab === "first" ? data.reranked : data.firstStage)
                    .slice(0, 2)
                    .map((result: RerankingResult, index: number) => (
                      <div
                        key={`preview-${index}`}
                        className="bg-gray-800/50 border border-gray-700 rounded-lg p-3"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h5 className="text-sm font-medium text-white line-clamp-1">
                            Chunk {result.metadata.chunkNumber}
                          </h5>
                          <span
                            className="text-xs font-bold ml-2 flex-shrink-0"
                            style={{
                              color: scoreColorHex8(
                                Math.round(result.similarity_score * 100)
                              ),
                            }}
                          >
                            {Math.round(result.similarity_score * 100)}%
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs line-clamp-2">
                          {result.metadata.content}
                        </p>
                      </div>
                    ))}
                  {(activeTab === "first" ? data.reranked : data.firstStage)
                    .length > 2 && (
                    <div className="text-center py-2">
                      <span className="text-xs text-gray-500">
                        +
                        {(activeTab === "first"
                          ? data.reranked
                          : data.firstStage
                        ).length - 2}{" "}
                        more results
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!searchQuery.trim() && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Ready to compare retrieval stages
            </h3>
            <p className="text-gray-400 text-center max-w-md">
              Enter a search query above to see the difference between
              similarity search and reranked results
            </p>
          </div>
        )}

        {/* No Results */}
        {data &&
          data.firstStage.length === 0 &&
          data.reranked.length === 0 &&
          searchQuery.trim() &&
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

        {/* Status */}
        {isFetching && searchQuery.trim() && (
          <div className="text-center mt-6">
            <div className="inline-flex items-center text-sm text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              Updating results...
            </div>
          </div>
        )}
      </div>

      <ContextualAside
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onUploadSuccess={() => {
          // Optionally refresh search results after upload
          // This could trigger a refetch of the current search
        }}
      />
    </>
  );
}
