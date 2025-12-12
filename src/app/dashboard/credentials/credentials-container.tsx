"use client";

import { useState, useEffect } from "react";
import {
  credentialService,
  Credential,
  CredentialDetail,
  ServiceName,
} from "@/services/credentialService";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";
import { TrashIcon, PencilIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

// Helper function to format service names for display
function formatServiceName(serviceName: ServiceName): string {
  const displayNames: Record<ServiceName, string> = {
    [ServiceName.OPENAI_API_KEY]: "OpenAI API Key",
    [ServiceName.ANTHROPIC_API_KEY]: "Anthropic API Key",
  };
  return displayNames[serviceName] || serviceName;
}

export function CredentialsContainer() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCredential, setEditingCredential] =
    useState<CredentialDetail | null>(null);
  const [showApiKey, setShowApiKey] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const data = await credentialService.listCredentials();
      setCredentials(data);
    } catch (error: any) {
      errorToast(error.message || "Failed to load credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (serviceName: ServiceName, apiKey: string) => {
    try {
      await credentialService.createCredential({
        service_name: serviceName,
        api_key: apiKey,
      });
      successToast("Credential created successfully");
      setShowCreateForm(false);
      loadCredentials();
    } catch (error: any) {
      errorToast(error.message || "Failed to create credential");
      throw error;
    }
  };

  // Get available services (exclude those that already have credentials)
  const getAvailableServices = (): ServiceName[] => {
    const existingServices = new Set(credentials.map((c) => c.service_name));
    return Object.values(ServiceName).filter(
      (service) => !existingServices.has(service)
    );
  };

  const handleUpdate = async (credentialId: number, apiKey: string) => {
    try {
      await credentialService.updateCredential(credentialId, {
        api_key: apiKey,
      });
      successToast("Credential updated successfully");
      setEditingCredential(null);
      loadCredentials();
    } catch (error: any) {
      errorToast(error.message || "Failed to update credential");
      throw error;
    }
  };

  const handleDelete = async (credentialId: number) => {
    if (!confirm("Are you sure you want to delete this credential?")) {
      return;
    }

    try {
      await credentialService.deleteCredential(credentialId);
      successToast("Credential deleted successfully");
      loadCredentials();
    } catch (error: any) {
      errorToast(error.message || "Failed to delete credential");
    }
  };

  const handleViewApiKey = async (credentialId: number) => {
    try {
      const detail = await credentialService.getCredential(credentialId);
      setEditingCredential(detail);
      setShowApiKey((prev) => ({ ...prev, [credentialId]: true }));
    } catch (error: any) {
      errorToast(error.message || "Failed to load API key");
    }
  };

  const toggleApiKeyVisibility = (credentialId: number) => {
    setShowApiKey((prev) => ({
      ...prev,
      [credentialId]: !prev[credentialId],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Loading credentials...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-semibold text-white">Credentials</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          Add Credential
        </button>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <CreateCredentialForm
          availableServices={getAvailableServices()}
          onClose={() => setShowCreateForm(false)}
          onSubmit={handleCreate}
        />
      )}

      {/* Edit/View Modal */}
      {editingCredential && (
        <EditCredentialModal
          credential={editingCredential}
          showApiKey={showApiKey[editingCredential.id] || false}
          onClose={() => {
            setEditingCredential(null);
            setShowApiKey((prev) => ({
              ...prev,
              [editingCredential.id]: false,
            }));
          }}
          onToggleVisibility={() =>
            toggleApiKeyVisibility(editingCredential.id)
          }
          onUpdate={handleUpdate}
        />
      )}

      {/* Credentials List */}
      {credentials.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-12 text-center">
          <p className="text-gray-400 text-lg mb-4">
            No credentials found
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Get started by adding your first API credential
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Add Credential
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {credentials.map((credential) => (
            <CredentialCard
              key={credential.id}
              credential={credential}
              onView={() => handleViewApiKey(credential.id)}
              onDelete={() => handleDelete(credential.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CredentialCard({
  credential,
  onView,
  onDelete,
}: {
  credential: Credential;
  onView: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-gray-600/50 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
            <h3 className="text-xl font-semibold text-white mb-2">
              {formatServiceName(credential.service_name)}
            </h3>
          <div className="text-xs text-gray-400 space-y-1">
            <div>
              Created: {new Date(credential.created_at).toLocaleDateString()}
            </div>
            <div>
              Updated: {new Date(credential.updated_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={onView}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <PencilIcon className="h-4 w-4" />
          View/Edit
        </button>
        <button
          onClick={onDelete}
          className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 p-2"
          title="Delete"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function CreateCredentialForm({
  availableServices,
  onClose,
  onSubmit,
}: {
  availableServices: ServiceName[];
  onClose: () => void;
  onSubmit: (serviceName: ServiceName, apiKey: string) => Promise<void>;
}) {
  const [serviceName, setServiceName] = useState<ServiceName | "">("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName || !apiKey.trim()) {
      errorToast("Please fill in all fields");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(serviceName, apiKey);
      setServiceName("");
      setApiKey("");
    } catch (error) {
      // Error already handled in parent
    } finally {
      setSubmitting(false);
    }
  };

  if (availableServices.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Add Credential
          </h2>
          <p className="text-gray-400 mb-6">
            All available services already have credentials configured.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-semibold text-white mb-4">
          Add Credential
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Service Name
            </label>
            <select
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value as ServiceName)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a service...</option>
              {availableServices.map((service) => (
                <option key={service} value={service}>
                  {formatServiceName(service)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 pr-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showApiKey ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {submitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditCredentialModal({
  credential,
  showApiKey,
  onClose,
  onToggleVisibility,
  onUpdate,
}: {
  credential: CredentialDetail;
  showApiKey: boolean;
  onClose: () => void;
  onToggleVisibility: () => void;
  onUpdate: (credentialId: number, apiKey: string) => Promise<void>;
}) {
  const [apiKey, setApiKey] = useState(credential.api_key || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      errorToast("API key cannot be empty");
      return;
    }

    try {
      setSubmitting(true);
      await onUpdate(credential.id, apiKey);
    } catch (error) {
      // Error already handled in parent
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-semibold text-white mb-4">
          {credential.service_name}
        </h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Service Name
            </label>
            <input
              type="text"
              value={formatServiceName(credential.service_name)}
              disabled
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 pr-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={onToggleVisibility}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showApiKey ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="text-xs text-gray-400 space-y-1">
            <div>
              Created: {new Date(credential.created_at).toLocaleString()}
            </div>
            <div>
              Updated: {new Date(credential.updated_at).toLocaleString()}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {submitting ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

