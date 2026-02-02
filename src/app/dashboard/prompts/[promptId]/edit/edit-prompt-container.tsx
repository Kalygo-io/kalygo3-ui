"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";
import { promptsService, Prompt } from "@/services/promptsService";
import { ArrowLeftIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

export function EditPromptContainer({ promptId }: { promptId: string }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPrompt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptId]);

  const loadPrompt = async () => {
    try {
      setLoading(true);
      const data = await promptsService.getPrompt(parseInt(promptId, 10));
      setPrompt(data);
      setName(data.name);
      setDescription(data.description || "");
      setContent(data.content);
    } catch (error: any) {
      errorToast(error.message || "Failed to load prompt");
      router.push("/dashboard/prompts");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      errorToast("Prompt name is required");
      return;
    }

    if (!content.trim()) {
      errorToast("Prompt content is required");
      return;
    }

    try {
      setSubmitting(true);

      await promptsService.updatePrompt(parseInt(promptId, 10), {
        name: name.trim(),
        description: description.trim() || undefined,
        content: content.trim(),
      });

      successToast("Prompt updated successfully");
      router.push("/dashboard/prompts");
    } catch (error: any) {
      errorToast(error.message || "Failed to update prompt");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard/prompts");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Loading prompt...</div>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Prompt not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleCancel}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-4xl font-semibold text-white">Edit Prompt</h1>
          <p className="text-sm text-gray-400 mt-1">
            Update your prompt template
          </p>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Prompt Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Prompt Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Customer Support Response"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-gray-400 text-xs mt-2">
              Choose a descriptive name for your prompt template.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this prompt does..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-gray-400 text-xs mt-2">
              Optional: A short description to help you remember this prompt's
              purpose.
            </p>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Prompt Content *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your prompt template here..."
              rows={12}
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
            />
            <p className="text-gray-400 text-xs mt-2">
              The actual prompt content. Use {"{{placeholder}}"} syntax for
              dynamic variables.
            </p>
          </div>

          {/* Preview */}
          {content && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Preview
              </label>
              <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <DocumentTextIcon className="h-5 w-5 text-blue-400" />
                  <span className="text-white font-medium">
                    {name || "Untitled Prompt"}
                  </span>
                </div>
                <div className="bg-gray-900 rounded-lg p-3 max-h-48 overflow-y-auto">
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                    {content}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
