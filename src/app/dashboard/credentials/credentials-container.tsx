"use client";

import { useState, useEffect } from "react";
import {
  credentialService,
  Credential,
  CredentialDetail,
  ServiceName,
  AuthType,
  CredentialType,
  CredentialMetadata,
  CredentialData,
  formatServiceName,
  formatCredentialType,
  getCredentialTypeColor,
  getCredentialDataKey,
  getCredentialValue,
} from "@/services/credentialService";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";
import {
  TrashIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
  LinkIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  CircleStackIcon,
} from "@heroicons/react/24/outline";
import posthog from "posthog-js";

function getCredentialTypeIcon(authType: AuthType | string) {
  const icons: Record<string, React.ReactNode> = {
    [AuthType.API_KEY]: <KeyIcon className="h-5 w-5" />,
    [AuthType.AWS_ACCESS_KEY_PAIR]: <KeyIcon className="h-5 w-5" />,
    [AuthType.DB_CONNECTION]: <CircleStackIcon className="h-5 w-5" />,
    [AuthType.CONNECTION_STRING]: <LinkIcon className="h-5 w-5" />,
    [AuthType.OAUTH_TOKEN]: <ShieldCheckIcon className="h-5 w-5" />,
    [AuthType.SECRET_KEY]: <KeyIcon className="h-5 w-5" />,
    [AuthType.CERTIFICATE]: <DocumentTextIcon className="h-5 w-5" />,
    [AuthType.OTHER]: <KeyIcon className="h-5 w-5" />,
  };
  return icons[authType] || <KeyIcon className="h-5 w-5" />;
}

export function CredentialsContainer() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCredential, setEditingCredential] = useState<CredentialDetail | null>(null);
  const [showSecretValue, setShowSecretValue] = useState<Record<number, boolean>>({});

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

  const handleCreate = async (
    credentialTypeVal: ServiceName | string,
    authType: AuthType | string,
    credentialName: string,
    credentialData: CredentialData,
    metadata?: CredentialMetadata
  ) => {
    try {
      await credentialService.createCredential({
        credential_type: credentialTypeVal,
        auth_type: authType,
        credential_name: credentialName || undefined,
        credential_data: credentialData,
        metadata: metadata,
      });
      posthog.capture("credential_created", { credential_type: credentialTypeVal, auth_type: authType });
      successToast("Credential created successfully");
      setShowCreateForm(false);
      loadCredentials();
    } catch (error: any) {
      errorToast(error.message || "Failed to create credential");
      throw error;
    }
  };

  const handleUpdate = async (
    credentialId: number,
    credentialName: string,
    credentialData: CredentialData,
    metadata?: CredentialMetadata
  ) => {
    try {
      await credentialService.updateCredential(credentialId, {
        credential_name: credentialName || undefined,
        credential_data: credentialData,
        metadata: metadata,
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
    if (!confirm("Are you sure you want to delete this credential?")) return;
    try {
      await credentialService.deleteCredential(credentialId);
      posthog.capture("credential_deleted", { credential_id: credentialId });
      successToast("Credential deleted successfully");
      loadCredentials();
    } catch (error: any) {
      errorToast(error.message || "Failed to delete credential");
    }
  };

  const handleViewCredential = async (credentialId: number) => {
    try {
      const detail = await credentialService.getCredential(credentialId);
      setEditingCredential(detail);
      setShowSecretValue((prev) => ({ ...prev, [credentialId]: false }));
    } catch (error: any) {
      errorToast(error.message || "Failed to load credential");
    }
  };

  const toggleSecretVisibility = (credentialId: number) => {
    setShowSecretValue((prev) => ({ ...prev, [credentialId]: !prev[credentialId] }));
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

      {showCreateForm && (
        <CreateCredentialForm
          onClose={() => setShowCreateForm(false)}
          onSubmit={handleCreate}
        />
      )}

      {editingCredential && (
        <EditCredentialModal
          credential={editingCredential}
          showSecret={showSecretValue[editingCredential.id] || false}
          onClose={() => {
            setEditingCredential(null);
            setShowSecretValue((prev) => ({ ...prev, [editingCredential!.id]: false }));
          }}
          onToggleVisibility={() => toggleSecretVisibility(editingCredential.id)}
          onUpdate={handleUpdate}
        />
      )}

      {credentials.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-12 text-center">
          <KeyIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-4">No credentials found</p>
          <p className="text-gray-500 text-sm mb-6">
            Get started by adding your first credential (API key, connection string, etc.)
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
              onView={() => handleViewCredential(credential.id)}
              onDelete={() => handleDelete(credential.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

function CredentialCard({
  credential,
  onView,
  onDelete,
}: {
  credential: Credential;
  onView: () => void;
  onDelete: () => void;
}) {
  const typeColor = getCredentialTypeColor(credential.auth_type);
  const typeIcon = getCredentialTypeIcon(credential.auth_type);
  const environment = credential.credential_metadata?.environment;
  const isKeyPair = credential.auth_type === AuthType.AWS_ACCESS_KEY_PAIR;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-gray-600/50 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          {/* Primary: credential_name (or service display name if none set) */}
          <h3 className="text-xl font-semibold text-white mb-0.5">
            {credential.credential_name || formatServiceName(credential.credential_type)}
          </h3>
          {/* Secondary: service label always visible */}
          <p className="text-xs text-gray-500 mb-3">
            {formatServiceName(credential.credential_type)}
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${typeColor}`}>
              {typeIcon}
              {formatCredentialType(credential.auth_type)}
            </span>
            {environment && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                environment === "production"
                  ? "bg-red-600/20 text-red-300 border-red-500/40"
                  : environment === "staging"
                  ? "bg-yellow-600/20 text-yellow-300 border-yellow-500/40"
                  : "bg-gray-600/20 text-gray-300 border-gray-500/40"
              }`}>
                {environment}
              </span>
            )}
          </div>

          {isKeyPair && (
            <div className="font-mono text-xs text-gray-400 space-y-1 mb-3 bg-gray-900/50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-16 shrink-0">Key ID</span>
                <span className="text-orange-300">••••••••</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-16 shrink-0">Secret</span>
                <span className="text-orange-300">••••••••</span>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-400 space-y-1">
            <div>Created: {new Date(credential.created_at).toLocaleDateString()}</div>
            <div>Updated: {new Date(credential.updated_at).toLocaleDateString()}</div>
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

// ---------------------------------------------------------------------------
// Create form
// ---------------------------------------------------------------------------

function CreateCredentialForm({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (
    credentialType: ServiceName | string,
    authType: AuthType | string,
    credentialName: string,
    credentialData: CredentialData,
    metadata?: CredentialMetadata
  ) => Promise<void>;
}) {
  const [serviceName, setServiceName] = useState<ServiceName | "">("");
  const [authType, setAuthType] = useState<AuthType>(AuthType.API_KEY);
  const [credentialName, setCredentialName] = useState("");
  const [secretValue, setSecretValue] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [environment, setEnvironment] = useState<"production" | "staging" | "development" | "">("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [keyId, setKeyId] = useState("");
  const [showSecretPair, setShowSecretPair] = useState(false);
  const [sesRegion, setSesRegion] = useState("");
  const [sesFromEmail, setSesFromEmail] = useState("");
  const [googleFromEmail, setGoogleFromEmail] = useState("");
  const [googleAppPassword, setGoogleAppPassword] = useState("");
  const [showGoogleAppPassword, setShowGoogleAppPassword] = useState(false);

  const isAwsSes = serviceName === ServiceName.AWS_SES;
  const isGoogleGmailSmtp = serviceName === ServiceName.GOOGLE_GMAIL_SMTP;
  const isAccessKeyPair = authType === AuthType.AWS_ACCESS_KEY_PAIR;

  const handleServiceNameChange = (value: ServiceName | "") => {
    setServiceName(value);
    if (value === ServiceName.AWS_SES) {
      setAuthType(AuthType.AWS_ACCESS_KEY_PAIR);
    } else if (value === ServiceName.GOOGLE_GMAIL_SMTP) {
      setAuthType(AuthType.API_KEY);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName) {
      errorToast("Please select a service");
      return;
    }
    if (!credentialName.trim()) {
      errorToast("Please enter a name to identify this credential");
      return;
    }

    let credentialData: CredentialData;

    if (isAwsSes) {
      if (!keyId.trim() || !secretValue.trim() || !sesRegion.trim() || !sesFromEmail.trim()) {
        errorToast("Please fill in all four AWS SES fields");
        return;
      }
      credentialData = {
        aws_access_key_id: keyId.trim(),
        aws_secret_access_key: secretValue.trim(),
        aws_region: sesRegion.trim(),
        from_email: sesFromEmail.trim(),
      };
    } else if (isGoogleGmailSmtp) {
      if (!googleFromEmail.trim() || !googleAppPassword.trim()) {
        errorToast("Please fill in both Gmail SMTP fields");
        return;
      }
      credentialData = {
        from_email: googleFromEmail.trim(),
        app_password: googleAppPassword.trim(),
      };
    } else if (isAccessKeyPair) {
      if (!keyId.trim() || !secretValue.trim()) {
        errorToast("Please fill in both the Key ID and Secret Key");
        return;
      }
      credentialData = { key_id: keyId.trim(), secret_key: secretValue.trim() };
    } else {
      if (!secretValue.trim()) {
        errorToast("Please fill in the credential value");
        return;
      }
      const dataKey = getCredentialDataKey(authType);
      credentialData = { [dataKey]: secretValue.trim() };
    }

    const metadata: CredentialMetadata = {};
    if (environment) metadata.environment = environment;
    if (notes.trim()) metadata.notes = notes.trim();

    try {
      setSubmitting(true);
      await onSubmit(
        serviceName,
        authType,
        credentialName,
        credentialData,
        Object.keys(metadata).length > 0 ? metadata : undefined
      );
      setServiceName("");
      setAuthType(AuthType.API_KEY);
      setCredentialName("");
      setKeyId("");
      setSecretValue("");
      setSesRegion("");
      setSesFromEmail("");
      setGoogleFromEmail("");
      setGoogleAppPassword("");
      setEnvironment("");
      setNotes("");
    } catch {
      // Error handled in parent
    } finally {
      setSubmitting(false);
    }
  };

  const getPlaceholder = () => {
    switch (authType) {
      case AuthType.API_KEY: return "Enter your API key";
      case AuthType.DB_CONNECTION: return "postgresql://user:pass@host:5432/db";
      case AuthType.CONNECTION_STRING: return "Enter your connection string";
      case AuthType.OAUTH_TOKEN: return "Enter your OAuth token";
      case AuthType.SECRET_KEY: return "Enter your secret key";
      case AuthType.CERTIFICATE: return "Paste your certificate content";
      default: return "Enter your credential value";
    }
  };

  const isMultiline =
    authType === AuthType.CERTIFICATE ||
    authType === AuthType.CONNECTION_STRING ||
    authType === AuthType.DB_CONNECTION;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-semibold text-white mb-4">Add Credential</h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* 1. Service */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Service *
            </label>
            <select
              value={serviceName}
              onChange={(e) => handleServiceNameChange(e.target.value as ServiceName | "")}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a service...</option>
              {Object.values(ServiceName).map((s) => (
                <option key={s} value={s}>{formatServiceName(s)}</option>
              ))}
            </select>
          </div>

          {/* 2. Credential Name — required; primary identifier */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Credential Name *
            </label>
            <input
              type="text"
              value={credentialName}
              onChange={(e) => setCredentialName(e.target.value)}
              placeholder="e.g., Production, Staging, Client ABC"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-gray-500 text-xs mt-1">
              Used to distinguish multiple credentials of the same service.
            </p>
          </div>

          {/* 3. Auth Type — hidden for services that auto-set it */}
          {!isAwsSes && !isGoogleGmailSmtp && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Credential Type *
              </label>
              <select
                value={authType}
                onChange={(e) => setAuthType(e.target.value as AuthType)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {Object.values(AuthType).map((t) => (
                  <option key={t} value={t}>{formatCredentialType(t)}</option>
                ))}
              </select>
            </div>
          )}

          {/* 4a. Access Key Pair fields */}
          {isAccessKeyPair && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {isAwsSes ? "AWS Access Key ID" : "Key ID"} *
                </label>
                <input
                  type="text"
                  value={keyId}
                  onChange={(e) => setKeyId(e.target.value)}
                  placeholder={isAwsSes ? "AKIAIOSFODNN7EXAMPLE" : "Enter your key ID"}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {isAwsSes ? "AWS Secret Access Key" : "Secret Key"} *
                </label>
                <div className="relative">
                  <input
                    type={showSecretPair ? "text" : "password"}
                    value={secretValue}
                    onChange={(e) => setSecretValue(e.target.value)}
                    placeholder={isAwsSes ? "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" : "Enter your secret key"}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 pr-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    required
                  />
                  <button type="button" onClick={() => setShowSecretPair(!showSecretPair)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300">
                    {showSecretPair ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              {isAwsSes && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">AWS Region *</label>
                    <input
                      type="text"
                      value={sesRegion}
                      onChange={(e) => setSesRegion(e.target.value)}
                      placeholder="us-east-1"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">From Email *</label>
                    <input
                      type="email"
                      value={sesFromEmail}
                      onChange={(e) => setSesFromEmail(e.target.value)}
                      placeholder="no-reply@yourdomain.com"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="text-gray-500 text-xs mt-1">Must be a verified sender identity in your AWS SES account.</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 4b. Google Gmail SMTP fields */}
          {isGoogleGmailSmtp && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">From Email *</label>
                <input
                  type="email"
                  value={googleFromEmail}
                  onChange={(e) => setGoogleFromEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">App Password *</label>
                <div className="relative">
                  <input
                    type={showGoogleAppPassword ? "text" : "password"}
                    value={googleAppPassword}
                    onChange={(e) => setGoogleAppPassword(e.target.value)}
                    placeholder="xxxx xxxx xxxx xxxx"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 pr-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    required
                  />
                  <button type="button" onClick={() => setShowGoogleAppPassword(!showGoogleAppPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300">
                    {showGoogleAppPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  Generate at{" "}
                  <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                    myaccount.google.com/apppasswords
                  </a>. Requires 2-Step Verification.
                </p>
              </div>
            </div>
          )}

          {/* 4c. Generic single-value input */}
          {!isAccessKeyPair && !isGoogleGmailSmtp && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {formatCredentialType(authType)} Value *
              </label>
              <div className="relative">
                {isMultiline ? (
                  <textarea
                    value={secretValue}
                    onChange={(e) => setSecretValue(e.target.value)}
                    placeholder={getPlaceholder()}
                    rows={4}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    required
                  />
                ) : (
                  <input
                    type={showSecret ? "text" : "password"}
                    value={secretValue}
                    onChange={(e) => setSecretValue(e.target.value)}
                    placeholder={getPlaceholder()}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 pr-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                )}
                {!isMultiline && (
                  <button type="button" onClick={() => setShowSecret(!showSecret)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300">
                    {showSecret ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 5. Optional metadata */}
          <div className="border-t border-gray-700 pt-4 mt-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Optional</h3>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-300 mb-2">Environment</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as typeof environment)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select environment...</option>
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="development">Development</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
                rows={2}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Actions */}
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

// ---------------------------------------------------------------------------
// Edit modal
// ---------------------------------------------------------------------------

function EditCredentialModal({
  credential,
  showSecret,
  onClose,
  onToggleVisibility,
  onUpdate,
}: {
  credential: CredentialDetail;
  showSecret: boolean;
  onClose: () => void;
  onToggleVisibility: () => void;
  onUpdate: (
    credentialId: number,
    credentialName: string,
    credentialData: CredentialData,
    metadata?: CredentialMetadata
  ) => Promise<void>;
}) {
  const isAccessKeyPair = credential.auth_type === AuthType.AWS_ACCESS_KEY_PAIR;
  const isAwsSes = credential.credential_type === ServiceName.AWS_SES;
  const isGoogleGmailSmtp = credential.credential_type === ServiceName.GOOGLE_GMAIL_SMTP;

  const existingKeyId = isAwsSes
    ? (credential.credential_data?.aws_access_key_id as string) || ""
    : (credential.credential_data?.key_id as string) || "";
  const existingSecret = isAwsSes
    ? (credential.credential_data?.aws_secret_access_key as string) || ""
    : getCredentialValue(credential);

  const [credentialName, setCredentialName] = useState(credential.credential_name || "");
  const [keyId, setKeyId] = useState(existingKeyId);
  const [secretValue, setSecretValue] = useState(existingSecret);
  const [showSecretPair, setShowSecretPair] = useState(false);
  const [sesRegion, setSesRegion] = useState((credential.credential_data?.aws_region as string) || "");
  const [sesFromEmail, setSesFromEmail] = useState((credential.credential_data?.from_email as string) || "");
  const [googleFromEmail, setGoogleFromEmail] = useState((credential.credential_data?.from_email as string) || "");
  const [googleAppPassword, setGoogleAppPassword] = useState((credential.credential_data?.app_password as string) || "");
  const [showGoogleAppPassword, setShowGoogleAppPassword] = useState(false);
  const [environment, setEnvironment] = useState<"production" | "staging" | "development" | "">(
    credential.credential_metadata?.environment || ""
  );
  const [notes, setNotes] = useState(credential.credential_metadata?.notes || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let credentialData: CredentialData;

    if (isAwsSes) {
      if (!keyId.trim() || !secretValue.trim() || !sesRegion.trim() || !sesFromEmail.trim()) {
        errorToast("Please fill in all four AWS SES fields");
        return;
      }
      credentialData = {
        aws_access_key_id: keyId.trim(),
        aws_secret_access_key: secretValue.trim(),
        aws_region: sesRegion.trim(),
        from_email: sesFromEmail.trim(),
      };
    } else if (isGoogleGmailSmtp) {
      if (!googleFromEmail.trim() || !googleAppPassword.trim()) {
        errorToast("Please fill in both Gmail SMTP fields");
        return;
      }
      credentialData = {
        from_email: googleFromEmail.trim(),
        app_password: googleAppPassword.trim(),
      };
    } else if (isAccessKeyPair) {
      if (!keyId.trim() || !secretValue.trim()) {
        errorToast("Please fill in both the Key ID and Secret Key");
        return;
      }
      credentialData = { key_id: keyId.trim(), secret_key: secretValue.trim() };
    } else {
      if (!secretValue.trim()) {
        errorToast("Credential value cannot be empty");
        return;
      }
      const dataKey = getCredentialDataKey(credential.auth_type);
      credentialData = { [dataKey]: secretValue.trim() };
    }

    const metadata: CredentialMetadata = {};
    if (environment) metadata.environment = environment;
    if (notes.trim()) metadata.notes = notes.trim();

    try {
      setSubmitting(true);
      await onUpdate(
        credential.id,
        credentialName,
        credentialData,
        Object.keys(metadata).length > 0 ? metadata : undefined
      );
    } catch {
      // Error handled in parent
    } finally {
      setSubmitting(false);
    }
  };

  const typeColor = getCredentialTypeColor(credential.auth_type);
  const typeIcon = getCredentialTypeIcon(credential.auth_type);
  const isMultiline =
    credential.auth_type === AuthType.CERTIFICATE ||
    credential.auth_type === AuthType.CONNECTION_STRING ||
    credential.auth_type === AuthType.DB_CONNECTION;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              {credential.credential_name || formatServiceName(credential.credential_type)}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{formatServiceName(credential.credential_type)}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${typeColor}`}>
            {typeIcon}
            {formatCredentialType(credential.auth_type)}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Credential Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Credential Name *
            </label>
            <input
              type="text"
              value={credentialName}
              onChange={(e) => setCredentialName(e.target.value)}
              placeholder="e.g., Production, Staging, Client ABC"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-gray-500 text-xs mt-1">Used to distinguish multiple credentials of the same service.</p>
          </div>

          {/* Service (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Service</label>
            <input
              type="text"
              value={formatServiceName(credential.credential_type)}
              disabled
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-400 cursor-not-allowed"
            />
          </div>

          {/* AWS Access Key Pair */}
          {isAccessKeyPair && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {isAwsSes ? "AWS Access Key ID" : "Key ID"}
                </label>
                <input
                  type="text"
                  value={keyId}
                  onChange={(e) => setKeyId(e.target.value)}
                  placeholder={isAwsSes ? "AKIAIOSFODNN7EXAMPLE" : "Enter your key ID"}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {isAwsSes ? "AWS Secret Access Key" : "Secret Key"}
                </label>
                <div className="relative">
                  <input
                    type={showSecretPair ? "text" : "password"}
                    value={secretValue}
                    onChange={(e) => setSecretValue(e.target.value)}
                    placeholder={isAwsSes ? "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" : "Enter your secret key"}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 pr-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                  <button type="button" onClick={() => setShowSecretPair(!showSecretPair)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300">
                    {showSecretPair ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              {isAwsSes && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">AWS Region</label>
                    <input
                      type="text"
                      value={sesRegion}
                      onChange={(e) => setSesRegion(e.target.value)}
                      placeholder="us-east-1"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">From Email</label>
                    <input
                      type="email"
                      value={sesFromEmail}
                      onChange={(e) => setSesFromEmail(e.target.value)}
                      placeholder="no-reply@yourdomain.com"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Google Gmail SMTP */}
          {isGoogleGmailSmtp && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">From Email</label>
                <input
                  type="email"
                  value={googleFromEmail}
                  onChange={(e) => setGoogleFromEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">App Password</label>
                <div className="relative">
                  <input
                    type={showGoogleAppPassword ? "text" : "password"}
                    value={googleAppPassword}
                    onChange={(e) => setGoogleAppPassword(e.target.value)}
                    placeholder="xxxx xxxx xxxx xxxx"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 pr-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                  <button type="button" onClick={() => setShowGoogleAppPassword(!showGoogleAppPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300">
                    {showGoogleAppPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  Generate at{" "}
                  <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                    myaccount.google.com/apppasswords
                  </a>.
                </p>
              </div>
            </div>
          )}

          {/* Single-value field */}
          {!isAccessKeyPair && !isGoogleGmailSmtp && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {formatCredentialType(credential.auth_type)} Value
              </label>
              <div className="relative">
                {isMultiline ? (
                  <textarea
                    value={secretValue}
                    onChange={(e) => setSecretValue(e.target.value)}
                    rows={4}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                ) : (
                  <input
                    type={showSecret ? "text" : "password"}
                    value={secretValue}
                    onChange={(e) => setSecretValue(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 pr-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
                {!isMultiline && (
                  <button type="button" onClick={onToggleVisibility} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300">
                    {showSecret ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Optional metadata */}
          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Optional</h3>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-300 mb-2">Environment</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as typeof environment)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select environment...</option>
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="development">Development</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
                rows={2}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Timestamps */}
          <div className="text-xs text-gray-400 space-y-1 border-t border-gray-700 pt-4">
            <div>Created: {new Date(credential.created_at).toLocaleString()}</div>
            <div>Updated: {new Date(credential.updated_at).toLocaleString()}</div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
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
