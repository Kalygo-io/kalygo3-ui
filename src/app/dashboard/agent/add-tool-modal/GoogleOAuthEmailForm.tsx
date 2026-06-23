"use client";

import { EnvelopeIcon, KeyIcon } from "@heroicons/react/24/outline";
import { Credential, formatServiceName } from "@/services/credentialService";

interface GoogleOAuthEmailFormProps {
  selectedGoogleOAuthCredentialId: number | "";
  setSelectedGoogleOAuthCredentialId: (v: number | "") => void;
  googleOAuthCredentials: Credential[];
  selectedGoogleOAuthCredential: Credential | undefined;
  loadingCredentials: boolean;
  isEditing: boolean;
}

export function GoogleOAuthEmailForm({
  selectedGoogleOAuthCredentialId,
  setSelectedGoogleOAuthCredentialId,
  googleOAuthCredentials,
  selectedGoogleOAuthCredential,
  loadingCredentials,
  isEditing,
}: GoogleOAuthEmailFormProps) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Google OAuth Credential *
        </label>
        {loadingCredentials ? (
          <div className="text-gray-400 text-sm">Loading credentials...</div>
        ) : googleOAuthCredentials.length === 0 ? (
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <KeyIcon className="h-5 w-5 text-yellow-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-300">No Google OAuth Credentials Found</h4>
                <p className="text-xs text-yellow-400/80 mt-1">
                  Go to Credentials → Add Credential and set the service name to{" "}
                  <code className="text-yellow-300">GOOGLE_OAUTH</code>. The credential must contain{" "}
                  <code className="text-yellow-300">client_id</code>,{" "}
                  <code className="text-yellow-300">client_secret</code>,{" "}
                  <code className="text-yellow-300">refresh_token</code>, and{" "}
                  <code className="text-yellow-300">from_email</code>.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <select
            value={selectedGoogleOAuthCredentialId}
            onChange={(e) => setSelectedGoogleOAuthCredentialId(e.target.value ? parseInt(e.target.value) : "")}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={isEditing}
          >
            <option value="">Select a Google OAuth credential...</option>
            {googleOAuthCredentials.map((cred) => (
              <option key={cred.id} value={cred.id}>
                {cred.credential_name || formatServiceName(cred.credential_type)}
                {cred.credential_metadata?.label ? ` - ${cred.credential_metadata.label}` : ""}
                {cred.credential_metadata?.environment ? ` (${cred.credential_metadata.environment})` : ""}
              </option>
            ))}
          </select>
        )}
        <p className="text-gray-400 text-xs mt-2">
          Sends via the Gmail API using an OAuth refresh token.
        </p>
        {isEditing && (
          <p className="text-gray-400 text-xs mt-1">Credential cannot be changed when editing.</p>
        )}
      </div>

      {selectedGoogleOAuthCredential && (
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <EnvelopeIcon className="h-5 w-5 text-blue-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-white">
                {selectedGoogleOAuthCredential.credential_name || formatServiceName(selectedGoogleOAuthCredential.credential_type)}
              </h4>
              {selectedGoogleOAuthCredential.credential_metadata?.label && (
                <p className="text-xs text-gray-300 mt-1">{selectedGoogleOAuthCredential.credential_metadata.label}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Credential ID: {selectedGoogleOAuthCredential.id}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
