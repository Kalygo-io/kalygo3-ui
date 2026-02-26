"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";
import { promptsService, Prompt } from "@/services/promptsService";
import {
  callSimilaritySearch,
  SimilaritySearchResult,
} from "@/services/callSimilaritySearch";
import { ContextualAside } from "@/components/similarity-search/contextual-aside";
import {
  PlusIcon,
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  Cog6ToothIcon,
  PaperAirplaneIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

const SEARCH_TOP_K = 10;
const SEARCH_THRESHOLD = 0.1;

export function PromptsContainer() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Similarity search state
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedSearchQuery, setSubmittedSearchQuery] = useState("");
  const [searchTopK, setSearchTopK] = useState(SEARCH_TOP_K);
  const [searchThreshold, setSearchThreshold] = useState(SEARCH_THRESHOLD);
  const [searchOptionsOpen, setSearchOptionsOpen] = useState(false);
  const [asideOpen, setAsideOpen] = useState(false);
  const searchOptionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPrompts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchOptionsRef.current &&
        !searchOptionsRef.current.contains(e.target as Node)
      ) {
        setSearchOptionsOpen(false);
      }
    };
    if (searchOptionsOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchOptionsOpen]);

  const loadPrompts = async () => {
    try {
      setLoading(true);
      const data = await promptsService.listPrompts();
      setPrompts(data);
    } catch (error: any) {
      errorToast(error.message || "Failed to load prompts");
    } finally {
      setLoading(false);
    }
  };

  const {
    data: searchData,
    isPending: searchPending,
    isFetching: searchFetching,
    error: searchError,
    refetch: refetchSearch,
  } = useQuery({
    queryKey: [
      "similarity-search",
      submittedSearchQuery,
      searchTopK,
      searchThreshold,
    ],
    queryFn: async () => {
      if (!submittedSearchQuery.trim())
        return { success: true, results: [] as SimilaritySearchResult[] };
      const res = await callSimilaritySearch({
        query: submittedSearchQuery.trim(),
        top_k: searchTopK,
        similarity_threshold: searchThreshold,
      });
      if (!res.success) errorToast(res.error ?? "Search failed");
      return res;
    },
    enabled: !!submittedSearchQuery.trim(),
    staleTime: 0,
    retry: 2,
  });

  const isSearchMode = submittedSearchQuery.length > 0;
  const searchResults = searchData?.results ?? [];
  const searchLoading = (searchPending || searchFetching) && submittedSearchQuery.trim().length > 0;

  const handleCreatePrompt = () => {
    router.push("/dashboard/prompts/create");
  };

  const handleViewPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setShowPreviewModal(true);
  };

  const handleEditPrompt = (promptId: number) => {
    router.push(`/dashboard/prompts/${promptId}/edit`);
  };

  const handleDeletePrompt = async (promptId: number, promptName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${promptName}"? This action cannot be undone.`
    );
    if (!confirmed) return;
    try {
      await promptsService.deletePrompt(promptId);
      setPrompts(prompts.filter((p) => p.id !== promptId));
      if (isSearchMode) {
        queryClient.invalidateQueries({ queryKey: ["similarity-search"] });
      }
      successToast(`Prompt "${promptName}" deleted successfully`);
    } catch (error: any) {
      errorToast(error.message || "Failed to delete prompt");
    }
  };

  const handleCopyPrompt = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      successToast("Prompt copied to clipboard");
    } catch (error) {
      errorToast("Failed to copy prompt");
    }
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) setSubmittedSearchQuery(searchQuery.trim());
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearchSubmit();
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSubmittedSearchQuery("");
  };

  const clearSearchCache = () => {
    queryClient.removeQueries({ queryKey: ["similarity-search"] });
    if (submittedSearchQuery.trim()) refetchSearch();
  };

  const promptFromSearchResult = (r: SimilaritySearchResult): Prompt => ({
    id: r.metadata.prompt_id,
    name: r.metadata.name,
    description: r.metadata.description,
    content: r.metadata.content,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Loading prompts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-semibold text-white">Prompts</h1>
          <p className="text-gray-400 mt-1">
            Manage and organize your prompt templates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAsideOpen(true)}
            className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-lg transition-colors"
            title="Search index & cache"
          >
            <InformationCircleIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleCreatePrompt}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Create Prompt
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search prompts by meaning…"
              className="block w-full pl-10 pr-10 py-2.5 border border-gray-600 rounded-lg bg-gray-800/80 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
            />
            {searchQuery.length > 0 && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleSearchSubmit}
            disabled={!searchQuery.trim()}
            className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
            Search
          </button>
          <div className="relative" ref={searchOptionsRef}>
            <button
              type="button"
              onClick={() => setSearchOptionsOpen(!searchOptionsOpen)}
              className="p-2.5 border border-gray-600 rounded-lg bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              title="Search options"
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </button>
            {searchOptionsOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-20 p-4">
                <div className="text-sm font-medium text-white mb-3">Search options</div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Max results: {searchTopK}</label>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      value={searchTopK}
                      onChange={(e) => setSearchTopK(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Min similarity: {(searchThreshold * 100).toFixed(0)}%</label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={searchThreshold}
                      onChange={(e) => setSearchThreshold(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-1.5 px-1">
          <span className="text-xs text-gray-500">Press Enter to search by semantic similarity</span>
          <div className="flex items-center gap-3">
            {isSearchMode && (
              <button
                type="button"
                onClick={clearSearch}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Clear search
              </button>
            )}
            <button
              type="button"
              onClick={clearSearchCache}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors"
              title="Clear search cache"
            >
              Clear cache
            </button>
          </div>
        </div>
      </div>

      {/* Search error */}
      {searchError && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-red-300">{searchError.message}</p>
          <button
            type="button"
            onClick={() => refetchSearch()}
            className="text-sm font-medium text-red-400 hover:text-white whitespace-nowrap"
          >
            Try again
          </button>
        </div>
      )}

      {/* Search loading */}
      {searchLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Image
            src="/loader.svg"
            alt="Searching..."
            width={40}
            height={40}
            className="w-10 h-10 animate-spin opacity-80"
          />
          <p className="text-gray-400 text-sm mt-3">Searching prompts…</p>
        </div>
      )}

      {/* Content: list vs search results */}
      {!searchLoading && (
        <>
          {isSearchMode ? (
            <>
              {searchResults.length === 0 && !searchError && (
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-12 text-center">
                  <MagnifyingGlassIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg mb-2">No matching prompts</p>
                  <p className="text-gray-500 text-sm mb-4">
                    Try different words or clear search to see all your prompts.
                  </p>
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                  >
                    Clear search
                  </button>
                </div>
              )}
              {searchResults.length > 0 && (
                <div className="space-y-4">
                  <p className="text-gray-400 text-sm">
                    {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for “{submittedSearchQuery}”
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {searchResults.map((result, index) => {
                      const prompt = promptFromSearchResult(result);
                      const scorePct = Math.round(result.score * 100);
                      return (
                        <PromptCard
                          key={`${result.metadata.prompt_id}-${index}`}
                          prompt={prompt}
                          similarityScore={scorePct}
                          onView={() => handleViewPrompt(prompt)}
                          onEdit={() => handleEditPrompt(prompt.id)}
                          onDelete={() => handleDeletePrompt(prompt.id, prompt.name)}
                          onCopy={() => handleCopyPrompt(prompt.content)}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {prompts.length === 0 ? (
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-12 text-center">
                  <DocumentTextIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg mb-2">No prompts found</p>
                  <p className="text-gray-500 text-sm mb-6">
                    Create your first prompt template to get started. Prompts help you
                    standardize and reuse your AI interactions.
                  </p>
                  <button
                    onClick={handleCreatePrompt}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 inline-flex items-center gap-2"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Create Your First Prompt
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {prompts.map((prompt) => (
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt}
                      onView={() => handleViewPrompt(prompt)}
                      onEdit={() => handleEditPrompt(prompt.id)}
                      onDelete={() => handleDeletePrompt(prompt.id, prompt.name)}
                      onCopy={() => handleCopyPrompt(prompt.content)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedPrompt && (
        <PromptPreviewModal
          prompt={selectedPrompt}
          onClose={() => {
            setShowPreviewModal(false);
            setSelectedPrompt(null);
          }}
          onCopy={() => handleCopyPrompt(selectedPrompt.content)}
        />
      )}

      <ContextualAside
        isOpen={asideOpen}
        onClose={() => setAsideOpen(false)}
      />
    </div>
  );
}

// Prompt Card Component
function PromptCard({
  prompt,
  similarityScore,
  onView,
  onEdit,
  onDelete,
  onCopy,
}: {
  prompt: Prompt;
  similarityScore?: number;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
}) {
  const scoreColor =
    similarityScore != null
      ? similarityScore >= 70
        ? "bg-emerald-600 border-emerald-500 text-white"
        : similarityScore >= 50
          ? "bg-amber-600 border-amber-500 text-white"
          : "bg-gray-600 border-gray-500 text-white"
      : null;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 transition-all duration-200 hover:shadow-lg hover:border-gray-600/50 flex flex-col">
      <div className="flex-1 mb-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <DocumentTextIcon className="h-5 w-5 text-blue-400 flex-shrink-0" />
            <h3 className="text-lg font-semibold text-white truncate">{prompt.name}</h3>
          </div>
          {scoreColor != null && similarityScore != null && (
            <span
              className={`flex-shrink-0 px-2 py-0.5 rounded-md border text-xs font-semibold ${scoreColor}`}
            >
              {similarityScore}% match
            </span>
          )}
        </div>
        
        {prompt.description && (
          <p className="text-sm text-gray-400 mb-3 line-clamp-2">
            {prompt.description}
          </p>
        )}

        {/* Content Preview */}
        <div className="bg-gray-900/50 rounded-lg p-3">
          <p className="text-xs text-gray-300 line-clamp-3 font-mono">
            {prompt.content}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-700/50">
        <button
          onClick={onView}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white text-sm font-medium rounded-lg transition-colors duration-200"
        >
          <EyeIcon className="h-4 w-4" />
          Preview
        </button>
        <button
          onClick={onCopy}
          className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-600/20 rounded-lg transition-colors duration-200"
          title="Copy prompt"
        >
          <ClipboardDocumentIcon className="h-4 w-4" />
        </button>
        <button
          onClick={onEdit}
          className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-600/20 rounded-lg transition-colors duration-200"
          title="Edit prompt"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-600/20 rounded-lg transition-colors duration-200"
          title="Delete prompt"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Prompt Preview Modal
function PromptPreviewModal({
  prompt,
  onClose,
  onCopy,
}: {
  prompt: Prompt;
  onClose: () => void;
  onCopy: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-gray-800 border border-gray-700 rounded-xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <DocumentTextIcon className="h-6 w-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">
                {prompt.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {prompt.description && (
              <div>
                <label className="text-sm font-medium text-gray-400 block mb-2">
                  Description
                </label>
                <p className="text-gray-300">{prompt.description}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-400 block mb-2">
                Prompt Content
              </label>
              <div className="bg-gray-900 rounded-lg p-4 max-h-80 overflow-y-auto">
                <pre className="text-sm text-gray-200 whitespace-pre-wrap font-mono">
                  {prompt.content}
                </pre>
              </div>
            </div>

            {(prompt.created_at || prompt.updated_at) && (
              <div className="flex gap-6 text-xs text-gray-500 pt-4 border-t border-gray-700">
                {prompt.created_at && (
                  <div>
                    Created: {new Date(prompt.created_at).toLocaleString()}
                  </div>
                )}
                {prompt.updated_at && (
                  <div>
                    Updated: {new Date(prompt.updated_at).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Close
            </button>
            <button
              onClick={onCopy}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <ClipboardDocumentIcon className="h-4 w-4" />
              Copy Prompt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
