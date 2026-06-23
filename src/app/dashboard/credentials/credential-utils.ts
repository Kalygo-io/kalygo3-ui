import {
  ServiceName,
  AuthType,
  CredentialData,
  CredentialMetadata,
  getCredentialDataKey,
} from "@/services/credentialService";

// ---------------------------------------------------------------------------
// Shared form-field state shape
//
// Both the create form and the edit modal hold the same set of per-type fields.
// Centralising the shape here lets <CredentialFields> and buildCredentialData()
// agree on a single contract.
// ---------------------------------------------------------------------------

export type EnvironmentValue = "production" | "staging" | "development" | "";

export interface CredentialFieldValues {
  credentialName: string;
  /** Generic single-value secret (and the AWS/key-pair "secret" half). */
  secretValue: string;
  keyId: string;
  sesRegion: string;
  sesFromEmail: string;
  googleFromEmail: string;
  googleAppPassword: string;
  gcsServiceAccountJson: string;
  gcsBucketName: string;
  environment: EnvironmentValue;
  notes: string;
}

// ---------------------------------------------------------------------------
// Per-service flags
//
// Drives both the conditional rendering in <CredentialFields> and the payload
// assembly in buildCredentialData(). Computed from the service + auth type so
// create (which knows the live serviceName/authType) and edit (which reads them
// off the credential) can share one code path.
// ---------------------------------------------------------------------------

export interface CredentialTypeFlags {
  isAwsSes: boolean;
  isGoogleGmailSmtp: boolean;
  isGcs: boolean;
  isAccessKeyPair: boolean;
  /** Multiline single-value input (certificate / connection-string / db). */
  isMultiline: boolean;
}

export function getCredentialTypeFlags(
  serviceName: ServiceName | string | "",
  authType: AuthType | string,
): CredentialTypeFlags {
  return {
    isAwsSes: serviceName === ServiceName.AWS_SES,
    isGoogleGmailSmtp: serviceName === ServiceName.GOOGLE_GMAIL_SMTP,
    isGcs: serviceName === ServiceName.GOOGLE_CLOUD_STORAGE,
    isAccessKeyPair: authType === AuthType.AWS_ACCESS_KEY_PAIR,
    isMultiline:
      authType === AuthType.CERTIFICATE ||
      authType === AuthType.CONNECTION_STRING ||
      authType === AuthType.DB_CONNECTION,
  };
}

// ---------------------------------------------------------------------------
// Generic single-value placeholder (used by the non-special-cased input).
// ---------------------------------------------------------------------------

export function getSecretPlaceholder(authType: AuthType | string): string {
  switch (authType) {
    case AuthType.API_KEY:
      return "Enter your API key";
    case AuthType.DB_CONNECTION:
      return "postgresql://user:pass@host:5432/db";
    case AuthType.CONNECTION_STRING:
      return "Enter your connection string";
    case AuthType.OAUTH_TOKEN:
      return "Enter your OAuth token";
    case AuthType.SECRET_KEY:
      return "Enter your secret key";
    case AuthType.CERTIFICATE:
      return "Paste your certificate content";
    default:
      return "Enter your credential value";
  }
}

// ---------------------------------------------------------------------------
// Payload assembly
//
// Validates the relevant fields and assembles the { credentialData, metadata }
// pair sent to credentialService.create/update. Returns an `error` string
// instead of toasting so the caller controls toast/abort. Behaviour is
// identical for create and edit; the only previous difference (the generic
// "empty value" message) is parameterised via `emptyValueMessage`.
// ---------------------------------------------------------------------------

export interface BuildCredentialDataResult {
  error?: string;
  credentialData?: CredentialData;
  metadata?: CredentialMetadata;
}

export function buildCredentialData(
  values: CredentialFieldValues,
  authType: AuthType | string,
  flags: CredentialTypeFlags,
  emptyValueMessage: string,
): BuildCredentialDataResult {
  const {
    secretValue,
    keyId,
    sesRegion,
    sesFromEmail,
    googleFromEmail,
    googleAppPassword,
    gcsServiceAccountJson,
    gcsBucketName,
    environment,
    notes,
  } = values;

  let credentialData: CredentialData;

  if (flags.isAwsSes) {
    if (!keyId.trim() || !secretValue.trim() || !sesRegion.trim() || !sesFromEmail.trim()) {
      return { error: "Please fill in all four AWS SES fields" };
    }
    credentialData = {
      aws_access_key_id: keyId.trim(),
      aws_secret_access_key: secretValue.trim(),
      aws_region: sesRegion.trim(),
      from_email: sesFromEmail.trim(),
    };
  } else if (flags.isGoogleGmailSmtp) {
    if (!googleFromEmail.trim() || !googleAppPassword.trim()) {
      return { error: "Please fill in both Gmail SMTP fields" };
    }
    credentialData = {
      from_email: googleFromEmail.trim(),
      app_password: googleAppPassword.trim(),
    };
  } else if (flags.isGcs) {
    if (!gcsServiceAccountJson.trim() || !gcsBucketName.trim()) {
      return { error: "Please provide both the service-account JSON and a bucket name" };
    }
    let parsedSa: Record<string, unknown>;
    try {
      parsedSa = JSON.parse(gcsServiceAccountJson);
    } catch {
      return { error: "The service-account JSON is not valid JSON" };
    }
    credentialData = { service_account_json: parsedSa };
  } else if (flags.isAccessKeyPair) {
    if (!keyId.trim() || !secretValue.trim()) {
      return { error: "Please fill in both the Key ID and Secret Key" };
    }
    credentialData = { key_id: keyId.trim(), secret_key: secretValue.trim() };
  } else {
    if (!secretValue.trim()) {
      return { error: emptyValueMessage };
    }
    const dataKey = getCredentialDataKey(authType);
    credentialData = { [dataKey]: secretValue.trim() };
  }

  const metadata: CredentialMetadata = {};
  if (environment) metadata.environment = environment;
  if (notes.trim()) metadata.notes = notes.trim();
  // Bucket name is non-secret and resolved server-side from metadata.
  if (flags.isGcs) metadata.bucket_name = gcsBucketName.trim();

  return {
    credentialData,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  };
}
