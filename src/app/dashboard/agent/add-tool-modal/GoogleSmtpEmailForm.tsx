"use client";

import { EnvelopeIcon, KeyIcon } from "@heroicons/react/24/outline";
import { Credential, formatServiceName } from "@/services/credentialService";

interface GoogleSmtpEmailFormProps {
  selectedGoogleSmtpCredentialId: number | "";
  setSelectedGoogleSmtpCredentialId: (v: number | "") => void;
  googleSmtpCredentials: Credential[];
  selectedGoogleSmtpCredential: Credential | undefined;
  loadingCredentials: boolean;
  isEditing: boolean;
}

export function GoogleSmtpEmailForm({
  selectedGoogleSmtpCredentialId,
  setSelectedGoogleSmtpCredentialId,
  googleSmtpCredentials,
  selectedGoogleSmtpCredential,
  loadingCredentials,
  isEditing,
}: GoogleSmtpEmailFormProps) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Google Gmail SMTP Credential *
        </label>
        {loadingCredentials ? (
          <div className="text-gray-400 text-sm">Loading credentials...</div>
        ) : googleSmtpCredentials.length === 0 ? (
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <KeyIcon className="h-5 w-5 text-yellow-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-300">No Gmail SMTP Credentials Found</h4>
                <p className="text-xs text-yellow-400/80 mt-1">
                  Go to Credentials → Add Credential and set the service name to{" "}
                  <code className="text-yellow-300">GOOGLE_GMAIL_SMTP</code>. The credential must contain{" "}
                  <code className="text-yellow-300">from_email</code> and{" "}
                  <code className="text-yellow-300">app_password</code> (a Gmail App Password).
                </p>
              </div>
            </div>
          </div>
        ) : (
          <select
            value={selectedGoogleSmtpCredentialId}
            onChange={(e) => setSelectedGoogleSmtpCredentialId(e.target.value ? parseInt(e.target.value) : "")}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            required
            disabled={isEditing}
          >
            <option value="">Select a Gmail SMTP credential...</option>
            {googleSmtpCredentials.map((cred) => (
              <option key={cred.id} value={cred.id}>
                {cred.credential_name || formatServiceName(cred.credential_type)}
                {cred.credential_metadata?.label ? ` - ${cred.credential_metadata.label}` : ""}
                {cred.credential_metadata?.environment ? ` (${cred.credential_metadata.environment})` : ""}
              </option>
            ))}
          </select>
        )}
        <p className="text-gray-400 text-xs mt-2">
          Sends via Gmail SMTP using an App Password. Better inbox placement than OAuth.
        </p>
        {isEditing && (
          <p className="text-gray-400 text-xs mt-1">Credential cannot be changed when editing.</p>
        )}
      </div>

      {selectedGoogleSmtpCredential && (
        <div className="bg-cyan-900/20 border border-cyan-700/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <EnvelopeIcon className="h-5 w-5 text-cyan-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-white">
                {selectedGoogleSmtpCredential.credential_name || formatServiceName(selectedGoogleSmtpCredential.credential_type)}
              </h4>
              {selectedGoogleSmtpCredential.credential_metadata?.label && (
                <p className="text-xs text-gray-300 mt-1">{selectedGoogleSmtpCredential.credential_metadata.label}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Credential ID: {selectedGoogleSmtpCredential.id}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
