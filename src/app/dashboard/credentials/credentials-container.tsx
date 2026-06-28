"use client";

import { useState, useEffect } from "react";
import {
  credentialService,
  Credential,
  CredentialDetail,
  CredentialGrant,
  ServiceName,
  AuthType,
  CredentialMetadata,
  CredentialData,
  formatServiceName,
  formatCredentialType,
  getCredentialTypeColor,
  getCredentialValue,
} from "@/services/credentialService";
import { accessGroupsService, AccessGroup } from "@/services/accessGroupsService";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";
import { PageLoading } from "@/components/shared/common/page-loading";
import { EmptyState } from "@/components/shared/common/empty-state";
import { useConfirmDelete } from "@/shared/hooks/use-confirm-delete";
import {
  CredentialFieldValues,
  buildCredentialData,
  getCredentialTypeFlags,
  EnvironmentValue,
} from "./credential-utils";
import { CredentialFields } from "./components/credential-fields";
import {
  TrashIcon,
  PencilIcon,
  KeyIcon,
  LinkIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  CircleStackIcon,
  StarIcon,
  ShareIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

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
  const confirmDelete = useConfirmDelete();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCredential, setEditingCredential] = useState<CredentialDetail | null>(null);
  const [showSecretValue, setShowSecretValue] = useState<Record<number, boolean>>({});
  const [sharingCredential, setSharingCredential] = useState<Credential | null>(null);

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
    await confirmDelete(
      "Are you sure you want to delete this credential?",
      () => credentialService.deleteCredential(credentialId),
      {
        successMessage: "Credential deleted successfully",
        errorMessage: "Failed to delete credential",
        onSuccess: () => loadCredentials(),
      },
    );
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

  const handleToggleDefault = async (credential: Credential) => {
    try {
      if (credential.is_default) {
        await credentialService.unsetDefault(credential.id);
        successToast(`Removed default for ${formatServiceName(credential.credential_type)}`);
      } else {
        await credentialService.setDefault(credential.id);
        successToast(`Set as default for ${formatServiceName(credential.credential_type)}`);
      }
      loadCredentials();
    } catch (error: any) {
      errorToast(error.message || "Failed to update default");
    }
  };

  if (loading) {
    return <PageLoading label="Loading credentials..." />;
  }

  const ownedCredentials = credentials.filter((c) => c.is_owner);
  const sharedCredentials = credentials.filter((c) => !c.is_owner);

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

      {sharingCredential && (
        <ShareCredentialModal
          credential={sharingCredential}
          onClose={() => setSharingCredential(null)}
        />
      )}

      {credentials.length === 0 ? (
        <EmptyState
          icon={KeyIcon}
          title="No credentials found"
          description="Get started by adding your first credential (API key, connection string, etc.)"
          action={
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Add Credential
            </button>
          }
        />
      ) : (
        <div className="space-y-8">
          {/* My Credentials */}
          <section>
            <h2 className="text-lg font-semibold text-gray-200 mb-3">
              My Credentials
              <span className="ml-2 text-sm font-normal text-gray-500">({ownedCredentials.length})</span>
            </h2>
            {ownedCredentials.length === 0 ? (
              <p className="text-sm text-gray-500">You haven&apos;t added any credentials yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ownedCredentials.map((credential) => (
                  <CredentialCard
                    key={credential.id}
                    credential={credential}
                    onView={() => handleViewCredential(credential.id)}
                    onDelete={() => handleDelete(credential.id)}
                    onShare={() => setSharingCredential(credential)}
                    onToggleDefault={() => handleToggleDefault(credential)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Shared with me */}
          {sharedCredentials.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-200 mb-3">
                Shared with me
                <span className="ml-2 text-sm font-normal text-gray-500">({sharedCredentials.length})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sharedCredentials.map((credential) => (
                  <CredentialCard
                    key={credential.id}
                    credential={credential}
                    onToggleDefault={() => handleToggleDefault(credential)}
                  />
                ))}
              </div>
            </section>
          )}
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
  onShare,
  onToggleDefault,
}: {
  credential: Credential;
  onView?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  onToggleDefault?: () => void;
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
          <h3 className="text-xl font-semibold text-white mb-0.5 flex items-center gap-2">
            {credential.credential_name || formatServiceName(credential.credential_type)}
            {credential.is_default && (
              <span
                title={`Default for ${formatServiceName(credential.credential_type)}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40"
              >
                <StarIconSolid className="h-3.5 w-3.5" />
                Default
              </span>
            )}
          </h3>
          {/* Secondary: service label always visible */}
          <p className="text-xs text-gray-500 mb-1">
            {formatServiceName(credential.credential_type)}
          </p>
          {/* For shared credentials: how it reached the viewer */}
          {!credential.is_owner && credential.shared_label && (
            <p className="text-xs text-indigo-300/80 mb-3 flex items-center gap-1">
              <UsersIcon className="h-3.5 w-3.5" />
              {credential.shared_label}
            </p>
          )}

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
        {/* Default toggle — available on both owned and shared credentials */}
        <button
          onClick={onToggleDefault}
          className={`font-medium py-2 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-1.5 ${
            credential.is_default
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
              : "bg-gray-700 hover:bg-gray-600 text-gray-200"
          }`}
          title={
            credential.is_default
              ? "Remove as default for this type"
              : "Set as default for this type (pre-selected when configuring agents & features)"
          }
        >
          {credential.is_default ? (
            <StarIconSolid className="h-4 w-4" />
          ) : (
            <StarIcon className="h-4 w-4" />
          )}
          {credential.is_default ? "Default" : "Set default"}
        </button>

        {/* Owner-only actions */}
        {credential.is_owner && (
          <>
            <button
              onClick={onView}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <PencilIcon className="h-4 w-4" />
              View/Edit
            </button>
            <button
              onClick={onShare}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-3 rounded-lg transition-colors duration-200"
              title="Share"
            >
              <ShareIcon className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 p-2"
              title="Delete"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </>
        )}
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
  const [submitting, setSubmitting] = useState(false);
  const [values, setValues] = useState<CredentialFieldValues>({
    credentialName: "",
    secretValue: "",
    keyId: "",
    sesRegion: "",
    sesFromEmail: "",
    googleFromEmail: "",
    googleAppPassword: "",
    gcsServiceAccountJson: "",
    gcsBucketName: "",
    environment: "",
    notes: "",
  });

  const setField = <K extends keyof CredentialFieldValues>(
    field: K,
    value: CredentialFieldValues[K],
  ) => setValues((prev) => ({ ...prev, [field]: value }));

  const flags = getCredentialTypeFlags(serviceName, authType);

  const handleServiceNameChange = (value: ServiceName | "") => {
    setServiceName(value);
    if (value === ServiceName.AWS_SES) {
      setAuthType(AuthType.AWS_ACCESS_KEY_PAIR);
    } else if (value === ServiceName.GOOGLE_GMAIL_SMTP) {
      setAuthType(AuthType.API_KEY);
    } else if (value === ServiceName.GOOGLE_CLOUD_STORAGE) {
      setAuthType(AuthType.SERVICE_ACCOUNT);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName) {
      errorToast("Please select a service");
      return;
    }
    if (!values.credentialName.trim()) {
      errorToast("Please enter a name to identify this credential");
      return;
    }

    const built = buildCredentialData(
      values,
      authType,
      flags,
      "Please fill in the credential value",
    );
    if (built.error) {
      errorToast(built.error);
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(
        serviceName,
        authType,
        values.credentialName,
        built.credentialData!,
        built.metadata
      );
      setServiceName("");
      setAuthType(AuthType.API_KEY);
      setValues({
        credentialName: "",
        secretValue: "",
        keyId: "",
        sesRegion: "",
        sesFromEmail: "",
        googleFromEmail: "",
        googleAppPassword: "",
        gcsServiceAccountJson: "",
        gcsBucketName: "",
        environment: "",
        notes: "",
      });
    } catch {
      // Error handled in parent
    } finally {
      setSubmitting(false);
    }
  };

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

          <CredentialFields
            values={values}
            onChange={setField}
            authType={authType}
            flags={flags}
            required
            betweenNameAndFields={
              /* Auth Type — hidden for services that auto-set it */
              !flags.isAwsSes && !flags.isGoogleGmailSmtp && !flags.isGcs ? (
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
              ) : null
            }
          />

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
  const flags = getCredentialTypeFlags(credential.credential_type, credential.auth_type);

  const existingKeyId = flags.isAwsSes
    ? (credential.credential_data?.aws_access_key_id as string) || ""
    : (credential.credential_data?.key_id as string) || "";
  const existingSecret = flags.isAwsSes
    ? (credential.credential_data?.aws_secret_access_key as string) || ""
    : getCredentialValue(credential);

  const [submitting, setSubmitting] = useState(false);
  const [values, setValues] = useState<CredentialFieldValues>({
    credentialName: credential.credential_name || "",
    secretValue: existingSecret,
    keyId: existingKeyId,
    sesRegion: (credential.credential_data?.aws_region as string) || "",
    sesFromEmail: (credential.credential_data?.from_email as string) || "",
    googleFromEmail: (credential.credential_data?.from_email as string) || "",
    googleAppPassword: (credential.credential_data?.app_password as string) || "",
    gcsServiceAccountJson: credential.credential_data?.service_account_json
      ? JSON.stringify(credential.credential_data.service_account_json, null, 2)
      : "",
    gcsBucketName: (credential.credential_metadata?.bucket_name as string) || "",
    environment: (credential.credential_metadata?.environment as EnvironmentValue) || "",
    notes: credential.credential_metadata?.notes || "",
  });

  const setField = <K extends keyof CredentialFieldValues>(
    field: K,
    value: CredentialFieldValues[K],
  ) => setValues((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const built = buildCredentialData(
      values,
      credential.auth_type,
      flags,
      "Credential value cannot be empty",
    );
    if (built.error) {
      errorToast(built.error);
      return;
    }

    try {
      setSubmitting(true);
      await onUpdate(
        credential.id,
        values.credentialName,
        built.credentialData!,
        built.metadata
      );
    } catch {
      // Error handled in parent
    } finally {
      setSubmitting(false);
    }
  };

  const typeColor = getCredentialTypeColor(credential.auth_type);
  const typeIcon = getCredentialTypeIcon(credential.auth_type);

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

          <CredentialFields
            values={values}
            onChange={setField}
            authType={credential.auth_type}
            flags={flags}
            required={false}
            showSecret={showSecret}
            onToggleSecretVisibility={onToggleVisibility}
            betweenNameAndFields={
              /* Service (read-only) */
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Service</label>
                <input
                  type="text"
                  value={formatServiceName(credential.credential_type)}
                  disabled
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-400 cursor-not-allowed"
                />
              </div>
            }
          />

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

// ---------------------------------------------------------------------------
// Share modal (owner only)
// ---------------------------------------------------------------------------

function ShareCredentialModal({
  credential,
  onClose,
}: {
  credential: Credential;
  onClose: () => void;
}) {
  const [grants, setGrants] = useState<CredentialGrant[]>([]);
  const [groups, setGroups] = useState<AccessGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [grantData, groupData] = await Promise.all([
        credentialService.listGrants(credential.id),
        accessGroupsService.listGroups(),
      ]);
      setGrants(grantData);
      setGroups(groupData);
    } catch (error: any) {
      errorToast(error.message || "Failed to load sharing settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credential.id]);

  // Groups already shared with, so we can hide them from the dropdown.
  const sharedGroupIds = new Set(
    grants.filter((g) => g.target_type === "group").map((g) => g.access_group_id),
  );
  const shareableGroups = groups.filter((g) => !sharedGroupIds.has(g.id));

  const handleShareGroup = async () => {
    if (!selectedGroupId) return;
    try {
      setSubmitting(true);
      await credentialService.shareWithGroup(credential.id, Number(selectedGroupId));
      successToast("Shared with group");
      setSelectedGroupId("");
      load();
    } catch (error: any) {
      errorToast(error.message || "Failed to share with group");
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      setSubmitting(true);
      await credentialService.shareWithEmail(credential.id, email.trim());
      successToast(`Shared with ${email.trim()}`);
      setEmail("");
      load();
    } catch (error: any) {
      errorToast(error.message || "Failed to share with individual");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (grant: CredentialGrant) => {
    try {
      await credentialService.revokeGrant(credential.id, grant.id);
      successToast(`Removed access for ${grant.label}`);
      load();
    } catch (error: any) {
      errorToast(error.message || "Failed to remove access");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="mb-5">
          <h2 className="text-2xl font-semibold text-white">Share credential</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {credential.credential_name || formatServiceName(credential.credential_type)} ·{" "}
            {formatServiceName(credential.credential_type)}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            People you share with can <span className="text-gray-200">use</span> this credential but
            never see its secret value.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <div className="space-y-6">
            {/* Existing shares */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Shared with</h3>
              {grants.length === 0 ? (
                <p className="text-sm text-gray-500">Not shared with anyone yet.</p>
              ) : (
                <ul className="space-y-2">
                  {grants.map((grant) => (
                    <li
                      key={grant.id}
                      className="flex items-center justify-between bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2"
                    >
                      <span className="flex items-center gap-2 text-sm text-gray-200">
                        {grant.target_type === "group" ? (
                          <UsersIcon className="h-4 w-4 text-indigo-300" />
                        ) : (
                          <KeyIcon className="h-4 w-4 text-blue-300" />
                        )}
                        {grant.label}
                        <span className="text-xs text-gray-500">
                          ({grant.target_type === "group" ? "group" : "individual"})
                        </span>
                      </span>
                      <button
                        onClick={() => handleRevoke(grant)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Remove access"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Share with a group */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Share with an access group
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">
                    {shareableGroups.length === 0 ? "No groups available" : "Select a group…"}
                  </option>
                  {shareableGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleShareGroup}
                  disabled={!selectedGroupId || submitting}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Share
                </button>
              </div>
            </div>

            {/* Share with an individual */}
            <form onSubmit={handleShareEmail}>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Share with an individual (by email)
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="person@example.com"
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!email.trim() || submitting}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Share
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="flex pt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
