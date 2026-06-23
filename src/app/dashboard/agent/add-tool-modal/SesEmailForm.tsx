"use client";

import { EnvelopeIcon, KeyIcon } from "@heroicons/react/24/outline";
import { Credential, formatServiceName } from "@/services/credentialService";

interface SesEmailFormProps {
  selectedSesCredentialId: number | "";
  setSelectedSesCredentialId: (v: number | "") => void;
  sesCredentials: Credential[];
  selectedSesCredential: Credential | undefined;
  loadingCredentials: boolean;
  isEditing: boolean;
  showTemplateNote?: boolean;
}

export function SesEmailForm({
  selectedSesCredentialId,
  setSelectedSesCredentialId,
  sesCredentials,
  selectedSesCredential,
  loadingCredentials,
  isEditing,
  showTemplateNote = false,
}: SesEmailFormProps) {
  return (
    <>
      {/* SES Credential Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          AWS SES Credential *
        </label>
        {loadingCredentials ? (
          <div className="text-gray-400 text-sm">Loading credentials...</div>
        ) : sesCredentials.length === 0 ? (
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <KeyIcon className="h-5 w-5 text-yellow-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-300">
                  No AWS SES Credentials Found
                </h4>
                <p className="text-xs text-yellow-400/80 mt-1">
                  You need to create a credential with service name &quot;AWS_SES&quot; first.
                  Go to Credentials → Add Credential and set the service name to AWS_SES.
                  The credential must contain <code className="text-yellow-300">aws_access_key_id</code>,{" "}
                  <code className="text-yellow-300">aws_secret_access_key</code>,{" "}
                  <code className="text-yellow-300">aws_region</code>, and{" "}
                  <code className="text-yellow-300">from_email</code>.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <select
            value={selectedSesCredentialId}
            onChange={(e) => setSelectedSesCredentialId(e.target.value ? parseInt(e.target.value) : "")}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            required
            disabled={isEditing}
          >
            <option value="">Select an AWS SES credential...</option>
            {sesCredentials.map((cred) => (
              <option key={cred.id} value={cred.id}>
                {cred.credential_name || formatServiceName(cred.credential_type)}
                {cred.credential_metadata?.label ? ` - ${cred.credential_metadata.label}` : ""}
                {cred.credential_metadata?.environment ? ` (${cred.credential_metadata.environment})` : ""}
              </option>
            ))}
          </select>
        )}
        <p className="text-gray-400 text-xs mt-2">
          Select a stored AWS SES credential containing the sender identity and access keys.
        </p>
        {isEditing && (
          <p className="text-gray-400 text-xs mt-1">
            Credential cannot be changed when editing.
          </p>
        )}
      </div>

      {/* Selected SES Credential Info */}
      {selectedSesCredential && (
        <div className="bg-pink-900/20 border border-pink-700/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <EnvelopeIcon className="h-5 w-5 text-pink-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-white">
                {selectedSesCredential.credential_name || formatServiceName(selectedSesCredential.credential_type)}
              </h4>
              {selectedSesCredential.credential_metadata?.label && (
                <p className="text-xs text-gray-300 mt-1">
                  {selectedSesCredential.credential_metadata.label}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Credential ID: {selectedSesCredential.id}
              </p>
            </div>
          </div>
        </div>
      )}

      {showTemplateNote && (
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
          <p className="text-xs text-blue-300">
            The agent selects a saved email template and supplies variable values at runtime.
            Open-tracking and human approval are always required before sending.
          </p>
        </div>
      )}
    </>
  );
}
