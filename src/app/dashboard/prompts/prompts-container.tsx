"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";
import { promptsService, Prompt } from "@/services/promptsService";
import {
  PlusIcon,
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
  ClipboardDocumentIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

export function PromptsContainer() {
  const router = useRouter();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    loadPrompts();
  }, []);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold text-white">Prompts</h1>
          <p className="text-gray-400 mt-1">
            Manage and organize your prompt templates
          </p>
        </div>
        <button
          onClick={handleCreatePrompt}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Create Prompt
        </button>
      </div>

      {/* Prompts List */}
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
    </div>
  );
}

// Prompt Card Component
function PromptCard({
  prompt,
  onView,
  onEdit,
  onDelete,
  onCopy,
}: {
  prompt: Prompt;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
}) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 transition-all duration-200 hover:shadow-lg hover:border-gray-600/50 flex flex-col">
      <div className="flex-1 mb-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">{prompt.name}</h3>
          </div>
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
