"use client";

import { useState, useEffect } from "react";
import {
  apiKeysService,
  ApiKey,
  CreateApiKeyRequest,
  ApiKeyStatus,
} from "@/services/apiKeysService";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";
import {
  KeyIcon,
  PlusIcon,
  TrashIcon,
  ClipboardIcon,
  CheckIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

export function ApiKeysContainer() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<number | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Set<number>>(new Set());
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKey | null>(null);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const data = await apiKeysService.listApiKeys();
      setApiKeys(data);
    } catch (error: any) {
      errorToast(error.message || "Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      errorToast("API key name is required");
      return;
    }

    try {
      setCreating(true);
      const newKey = await apiKeysService.createApiKey({
        name: newKeyName.trim(),
      });
      successToast("API key created successfully");
      setShowCreateModal(false);
      setNewKeyName("");
      // Show the newly created key in a modal
      setNewlyCreatedKey(newKey);
      // Reload to get updated list (without the key value)
      await loadApiKeys();
    } catch (error: any) {
      errorToast(error.message || "Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const handleCopyNewKey = async () => {
    if (newlyCreatedKey && newlyCreatedKey.key) {
      await copyToClipboard(newlyCreatedKey.key, newlyCreatedKey.id);
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this API key? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setDeletingId(id);
      await apiKeysService.deleteApiKey(id);
      successToast("API key deleted successfully");
      await loadApiKeys();
    } catch (error: any) {
      errorToast(error.message || "Failed to delete API key");
    } finally {
      setDeletingId(null);
    }
  };

  const copyToClipboard = async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKeyId(id);
      successToast("API key copied to clipboard");
      setTimeout(() => setCopiedKeyId(null), 2000);
    } catch (error) {
      errorToast("Failed to copy to clipboard");
    }
  };

  const toggleRevealKey = (id: number) => {
    setRevealedKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const maskKey = (key: string | undefined | null) => {
    if (!key) return "•".repeat(20); // Default masked length if key is missing
    if (key.length <= 8) return "•".repeat(key.length);
    return key.substring(0, 4) + "•".repeat(key.length - 8) + key.slice(-4);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <KeyIcon className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">API Keys</h1>
          </div>
          <p className="text-gray-400">
            Manage API keys for integrating your applications with the Kalygo API
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
        >
          <PlusIcon className="h-5 w-5" />
          Create API Key
        </button>
      </div>

      {/* API Keys Table */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-400">Loading API keys...</div>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-12">
            <KeyIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-1">No API keys found</p>
            <p className="text-gray-500 text-sm mb-4">
              Create your first API key to get started
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              <PlusIcon className="h-5 w-5" />
              Create API Key
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50 border-b border-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            API Key
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Created
                          </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Last Used
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {apiKeys.map((apiKey) => {
                  const isRevealed = revealedKeys.has(apiKey.id);
                  const displayKey = apiKey.key
                    ? isRevealed
                      ? apiKey.key
                      : maskKey(apiKey.key)
                    : "••••••••••••••••••••";

                  return (
                    <tr
                      key={apiKey.id}
                      className="hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-white font-medium">
                          {apiKey.name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <code className="text-sm text-gray-300 font-mono bg-gray-900/50 px-2 py-1 rounded border border-gray-700/50">
                            {displayKey}
                          </code>
                          {apiKey.key && (
                            <>
                              <button
                                type="button"
                                onClick={() => toggleRevealKey(apiKey.id)}
                                className="p-1 text-gray-400 hover:text-blue-400 hover:bg-blue-600/20 rounded transition-colors"
                                title={isRevealed ? "Hide key" : "Reveal key"}
                              >
                                {isRevealed ? (
                                  <EyeSlashIcon className="h-4 w-4" />
                                ) : (
                                  <EyeIcon className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  copyToClipboard(apiKey.key!, apiKey.id)
                                }
                                className="p-1 text-gray-400 hover:text-green-400 hover:bg-green-600/20 rounded transition-colors"
                                title="Copy to clipboard"
                              >
                                {copiedKeyId === apiKey.id ? (
                                  <CheckIcon className="h-4 w-4 text-green-400" />
                                ) : (
                                  <ClipboardIcon className="h-4 w-4" />
                                )}
                              </button>
                            </>
                          )}
                          {!apiKey.key && (
                            <span className="text-xs text-gray-500 italic">
                              Key not available
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {apiKey.status === ApiKeyStatus.ACTIVE ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-600/20 text-green-400 border border-green-500/40">
                            <CheckCircleIcon className="h-3.5 w-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-600/20 text-red-400 border border-red-500/40">
                            <XCircleIcon className="h-3.5 w-3.5" />
                            Revoked
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-300">
                          {apiKey.created_at
                            ? new Date(apiKey.created_at).toLocaleDateString()
                            : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-300">
                          {apiKey.last_used_at
                            ? new Date(apiKey.last_used_at).toLocaleDateString()
                            : "Never"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(apiKey.id)}
                          disabled={deletingId === apiKey.id}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-600/20 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete API key"
                          aria-label="Delete API key"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create API Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Create API Key
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              Create a new API key to integrate your applications with the
              Kalygo API.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Website Chatbot"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  autoFocus
                />
                <p className="text-gray-400 text-xs mt-2">
                  Give your API key a descriptive name to help you identify it
                  later.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewKeyName("");
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  {creating ? "Creating..." : "Create API Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Key Created Modal */}
      {newlyCreatedKey && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-semibold text-white mb-4">
              API Key Created
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              Your API key has been created.{" "}
              <strong className="text-yellow-400">
                Copy it now - you won&apos;t be able to see it again!
              </strong>
            </p>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between gap-2">
                <code className="text-white font-mono text-sm break-all flex-1">
                  {newlyCreatedKey.key}
                </code>
                <button
                  type="button"
                  onClick={handleCopyNewKey}
                  className="ml-2 p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                  title="Copy to clipboard"
                >
                  {copiedKeyId === newlyCreatedKey.id ? (
                    <CheckIcon className="h-5 w-5 text-green-400" />
                  ) : (
                    <ClipboardIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNewlyCreatedKey(null)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              I&apos;ve copied the key
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
