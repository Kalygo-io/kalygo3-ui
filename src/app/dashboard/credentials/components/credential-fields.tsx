"use client";

import { useState } from "react";
import {
  AuthType,
  formatCredentialType,
} from "@/services/credentialService";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import {
  CredentialFieldValues,
  CredentialTypeFlags,
  EnvironmentValue,
  getSecretPlaceholder,
} from "../credential-utils";

const inputClass =
  "w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500";
const monoInputClass = `${inputClass} font-mono text-sm`;
const labelClass = "block text-sm font-medium text-gray-300 mb-2";

export interface CredentialFieldsProps {
  values: CredentialFieldValues;
  onChange: <K extends keyof CredentialFieldValues>(
    field: K,
    value: CredentialFieldValues[K],
  ) => void;
  /** Auth mechanism — drives the generic single-value field label/placeholder. */
  authType: AuthType | string;
  flags: CredentialTypeFlags;
  /**
   * Whether the per-type inputs are marked `required` (create) or not (edit).
   * The create form labels also append " *" and add extra helper text.
   */
  required: boolean;
  /**
   * Visibility of the generic single-value secret input. The create form owns
   * this state internally; the edit modal drives it externally (so omit both to
   * use internal state, or pass both to control it).
   */
  showSecret?: boolean;
  onToggleSecretVisibility?: () => void;
  /**
   * Slot rendered between the Credential Name input and the per-type secret
   * inputs. Create passes the auth-type <select>; edit passes the read-only
   * Service field.
   */
  betweenNameAndFields?: React.ReactNode;
}

/**
 * Shared presentational field block used by both the create form and the edit
 * modal. Renders the credential-name input plus the per-service / per-auth-type
 * secret inputs and the optional metadata (environment + notes).
 *
 * Note: the Service selector / Credential-Type selector / read-only Service
 * field differ between create and edit and stay in their respective parents.
 */
export function CredentialFields({
  values,
  onChange,
  authType,
  flags,
  required,
  showSecret: controlledShowSecret,
  onToggleSecretVisibility,
  betweenNameAndFields,
}: CredentialFieldsProps) {
  const [showSecretPair, setShowSecretPair] = useState(false);
  const [showGoogleAppPassword, setShowGoogleAppPassword] = useState(false);
  const [internalShowSecret, setInternalShowSecret] = useState(false);

  const isControlledSecret = controlledShowSecret !== undefined;
  const showSecret = isControlledSecret ? controlledShowSecret : internalShowSecret;
  const toggleSecret = isControlledSecret
    ? onToggleSecretVisibility
    : () => setInternalShowSecret((v) => !v);

  const star = required ? " *" : "";

  return (
    <>
      {/* Credential Name */}
      <div>
        <label className={labelClass}>Credential Name *</label>
        <input
          type="text"
          value={values.credentialName}
          onChange={(e) => onChange("credentialName", e.target.value)}
          placeholder="e.g., Production, Staging, Client ABC"
          className={inputClass}
          required={required}
        />
        <p className="text-gray-500 text-xs mt-1">
          Used to distinguish multiple credentials of the same service.
        </p>
      </div>

      {betweenNameAndFields}

      {/* AWS Access Key Pair fields */}
      {flags.isAccessKeyPair && (
        <div className="space-y-3">
          <div>
            <label className={labelClass}>
              {flags.isAwsSes ? "AWS Access Key ID" : "Key ID"}
              {star}
            </label>
            <input
              type="text"
              value={values.keyId}
              onChange={(e) => onChange("keyId", e.target.value)}
              placeholder={flags.isAwsSes ? "AKIAIOSFODNN7EXAMPLE" : "Enter your key ID"}
              className={monoInputClass}
              required={required}
            />
          </div>
          <div>
            <label className={labelClass}>
              {flags.isAwsSes ? "AWS Secret Access Key" : "Secret Key"}
              {star}
            </label>
            <div className="relative">
              <input
                type={showSecretPair ? "text" : "password"}
                value={values.secretValue}
                onChange={(e) => onChange("secretValue", e.target.value)}
                placeholder={
                  flags.isAwsSes
                    ? "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                    : "Enter your secret key"
                }
                className={`${monoInputClass} pr-10`}
                required={required}
              />
              <button
                type="button"
                onClick={() => setShowSecretPair(!showSecretPair)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showSecretPair ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>
          {flags.isAwsSes && (
            <>
              <div>
                <label className={labelClass}>AWS Region{star}</label>
                <input
                  type="text"
                  value={values.sesRegion}
                  onChange={(e) => onChange("sesRegion", e.target.value)}
                  placeholder="us-east-1"
                  className={monoInputClass}
                  required={required}
                />
              </div>
              <div>
                <label className={labelClass}>From Email{star}</label>
                <input
                  type="email"
                  value={values.sesFromEmail}
                  onChange={(e) => onChange("sesFromEmail", e.target.value)}
                  placeholder="no-reply@yourdomain.com"
                  className={inputClass}
                  required={required}
                />
                {required && (
                  <p className="text-gray-500 text-xs mt-1">
                    Must be a verified sender identity in your AWS SES account.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Google Gmail SMTP fields */}
      {flags.isGoogleGmailSmtp && (
        <div className="space-y-3">
          <div>
            <label className={labelClass}>From Email{star}</label>
            <input
              type="email"
              value={values.googleFromEmail}
              onChange={(e) => onChange("googleFromEmail", e.target.value)}
              placeholder="you@gmail.com"
              className={inputClass}
              required={required}
            />
          </div>
          <div>
            <label className={labelClass}>App Password{star}</label>
            <div className="relative">
              <input
                type={showGoogleAppPassword ? "text" : "password"}
                value={values.googleAppPassword}
                onChange={(e) => onChange("googleAppPassword", e.target.value)}
                placeholder="xxxx xxxx xxxx xxxx"
                className={`${monoInputClass} pr-10`}
                required={required}
              />
              <button
                type="button"
                onClick={() => setShowGoogleAppPassword(!showGoogleAppPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showGoogleAppPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-1">
              Generate at{" "}
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                myaccount.google.com/apppasswords
              </a>
              {required ? ". Requires 2-Step Verification." : "."}
            </p>
          </div>
        </div>
      )}

      {/* Google Cloud Storage fields */}
      {flags.isGcs && (
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Bucket Name{star}</label>
            <input
              type="text"
              value={values.gcsBucketName}
              onChange={(e) => onChange("gcsBucketName", e.target.value)}
              placeholder="my-account-bucket"
              className={monoInputClass}
              required={required}
            />
            <p className="text-gray-500 text-xs mt-1">
              Files (chat attachments and knowledge-base documents) are stored in this bucket.
            </p>
          </div>
          <div>
            <label className={labelClass}>Service Account JSON{star}</label>
            <textarea
              value={values.gcsServiceAccountJson}
              onChange={(e) => onChange("gcsServiceAccountJson", e.target.value)}
              placeholder='{ "type": "service_account", "project_id": "…", "private_key": "…", … }'
              rows={6}
              className={`${inputClass} font-mono text-xs`}
              required={required}
            />
            <p className="text-gray-500 text-xs mt-1">
              {required
                ? "Paste the JSON key for a service account with read/write access to the bucket. Stored encrypted."
                : "Stored encrypted. Paste a new key to replace it."}
            </p>
          </div>
        </div>
      )}

      {/* Generic single-value input */}
      {!flags.isAccessKeyPair && !flags.isGoogleGmailSmtp && !flags.isGcs && (
        <div>
          <label className={labelClass}>
            {formatCredentialType(authType)} Value{star}
          </label>
          <div className="relative">
            {flags.isMultiline ? (
              <textarea
                value={values.secretValue}
                onChange={(e) => onChange("secretValue", e.target.value)}
                placeholder={required ? getSecretPlaceholder(authType) : undefined}
                rows={4}
                className={monoInputClass}
                required={required}
              />
            ) : (
              <input
                type={showSecret ? "text" : "password"}
                value={values.secretValue}
                onChange={(e) => onChange("secretValue", e.target.value)}
                placeholder={required ? getSecretPlaceholder(authType) : undefined}
                className={`${inputClass} pr-10`}
                required={required}
              />
            )}
            {!flags.isMultiline && (
              <button
                type="button"
                onClick={toggleSecret}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showSecret ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Optional metadata */}
      <div className={`border-t border-gray-700 pt-4${required ? " mt-4" : ""}`}>
        <h3 className="text-sm font-medium text-gray-400 mb-3">Optional</h3>
        <div className="mb-3">
          <label className={labelClass}>Environment</label>
          <select
            value={values.environment}
            onChange={(e) => onChange("environment", e.target.value as EnvironmentValue)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select environment...</option>
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="development">Development</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Notes</label>
          <textarea
            value={values.notes}
            onChange={(e) => onChange("notes", e.target.value)}
            placeholder="Additional notes..."
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>
    </>
  );
}
