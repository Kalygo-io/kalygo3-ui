"use client";

import { CircleStackIcon, KeyIcon } from "@heroicons/react/24/outline";
import { Credential, formatServiceName } from "@/services/credentialService";

interface DbTableFormProps {
  toolCategory: "dbTableRead" | "dbTableWrite";
  ringClass: string;
  selectedCredentialId: number | "";
  setSelectedCredentialId: (v: number | "") => void;
  tableName: string;
  setTableName: (v: string) => void;
  columns: string;
  setColumns: (v: string) => void;
  maxLimit: number;
  setMaxLimit: (v: number) => void;
  requiredColumns: string;
  setRequiredColumns: (v: string) => void;
  injectAccountId: boolean;
  setInjectAccountId: (v: boolean) => void;
  injectChatSessionId: boolean;
  setInjectChatSessionId: (v: boolean) => void;
  dbCredentials: Credential[];
  selectedCredential: Credential | undefined;
  loadingCredentials: boolean;
  isEditing: boolean;
}

export function DbTableForm({
  toolCategory,
  ringClass,
  selectedCredentialId,
  setSelectedCredentialId,
  tableName,
  setTableName,
  columns,
  setColumns,
  maxLimit,
  setMaxLimit,
  requiredColumns,
  setRequiredColumns,
  injectAccountId,
  setInjectAccountId,
  injectChatSessionId,
  setInjectChatSessionId,
  dbCredentials,
  selectedCredential,
  loadingCredentials,
  isEditing,
}: DbTableFormProps) {
  return (
    <>
      {/* Credential Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Database Credential *
        </label>
        {loadingCredentials ? (
          <div className="text-gray-400 text-sm">Loading credentials...</div>
        ) : dbCredentials.length === 0 ? (
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <KeyIcon className="h-5 w-5 text-yellow-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-300">
                  No Database Credentials Found
                </h4>
                <p className="text-xs text-yellow-400/80 mt-1">
                  You need to create a credential with type &quot;Database Connection&quot; first.
                  Go to Credentials → Add Credential → Select &quot;Database Connection&quot; type.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <select
            value={selectedCredentialId}
            onChange={(e) => setSelectedCredentialId(e.target.value ? parseInt(e.target.value) : "")}
            className={`w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 ${ringClass}`}
            required
            disabled={isEditing}
          >
            <option value="">Select a credential...</option>
            {dbCredentials.map((cred) => (
              <option key={cred.id} value={cred.id}>
                {cred.credential_name || formatServiceName(cred.credential_type)}
                {cred.credential_metadata?.label ? ` - ${cred.credential_metadata.label}` : ""}
                {cred.credential_metadata?.environment ? ` (${cred.credential_metadata.environment})` : ""}
              </option>
            ))}
          </select>
        )}
        <p className="text-gray-400 text-xs mt-2">
          Select a stored credential containing the database connection string.
        </p>
        {isEditing && (
          <p className="text-gray-400 text-xs mt-1">
            Credential cannot be changed when editing.
          </p>
        )}
      </div>

      {/* Selected Credential Info */}
      {selectedCredential && (
        <div className={`rounded-lg p-4 ${
          toolCategory === "dbTableWrite"
            ? "bg-orange-900/20 border border-orange-700/50"
            : "bg-green-900/20 border border-green-700/50"
        }`}>
          <div className="flex items-start gap-3">
            <CircleStackIcon className={`h-5 w-5 mt-0.5 ${
              toolCategory === "dbTableWrite" ? "text-orange-400" : "text-green-400"
            }`} />
            <div>
              <h4 className="text-sm font-medium text-white">
                {selectedCredential.credential_name || formatServiceName(selectedCredential.credential_type)}
              </h4>
              {selectedCredential.credential_metadata?.label && (
                <p className="text-xs text-gray-300 mt-1">
                  {selectedCredential.credential_metadata.label}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Credential ID: {selectedCredential.id}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Database Table *
        </label>
        <input
          type="text"
          value={tableName}
          onChange={(e) => setTableName(e.target.value)}
          placeholder={toolCategory === "dbTableWrite" ? "e.g., leads, orders, contacts" : "e.g., users, orders, products"}
          className={`w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${ringClass}`}
          disabled={isEditing}
          required
        />
        <p className="text-gray-400 text-xs mt-2">
          {toolCategory === "dbTableWrite"
            ? "The database table to insert records into."
            : "The database table the agent can query."}
        </p>
      </div>

      {/* Columns */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {toolCategory === "dbTableWrite" ? "Writable Columns *" : "Allowed Columns"}
        </label>
        <input
          type="text"
          value={columns}
          onChange={(e) => setColumns(e.target.value)}
          placeholder={toolCategory === "dbTableWrite"
            ? "e.g., name, email, phone, notes"
            : "e.g., id, name, email, created_at"}
          className={`w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${ringClass} font-mono`}
          required={toolCategory === "dbTableWrite"}
        />
        <p className="text-gray-400 text-xs mt-2">
          {toolCategory === "dbTableWrite"
            ? "Comma-separated list of columns the agent can write to. Required for security."
            : "Comma-separated list of columns the agent can query and see. Leave empty to allow all."}
        </p>
      </div>

      {/* DB Write specific: Required Columns and Inject Account ID */}
      {toolCategory === "dbTableWrite" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Required Columns
            </label>
            <input
              type="text"
              value={requiredColumns}
              onChange={(e) => setRequiredColumns(e.target.value)}
              placeholder="e.g., name, email"
              className={`w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${ringClass} font-mono`}
            />
            <p className="text-gray-400 text-xs mt-2">
              Comma-separated columns that must be provided when inserting.
              Must be a subset of writable columns.
            </p>
          </div>

          {/* Inject Account ID */}
          <div className="flex items-start gap-3">
            <div className="flex items-center h-6">
              <input
                type="checkbox"
                id="injectAccountId"
                checked={injectAccountId}
                onChange={(e) => setInjectAccountId(e.target.checked)}
                className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-orange-500 focus:ring-orange-500 focus:ring-offset-gray-800"
              />
            </div>
            <div>
              <label htmlFor="injectAccountId" className="text-sm font-medium text-gray-300 cursor-pointer">
                Auto-inject Account ID
              </label>
              <p className="text-gray-400 text-xs mt-1">
                Automatically set the <code className="text-orange-400">account_id</code> column to the
                authenticated user&apos;s account. Enable this if the table has an account_id column.
              </p>
            </div>
          </div>

          {/* Inject Chat Session ID */}
          <div className="flex items-start gap-3">
            <div className="flex items-center h-6">
              <input
                type="checkbox"
                id="injectChatSessionId"
                checked={injectChatSessionId}
                onChange={(e) => setInjectChatSessionId(e.target.checked)}
                className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-orange-500 focus:ring-orange-500 focus:ring-offset-gray-800"
              />
            </div>
            <div>
              <label htmlFor="injectChatSessionId" className="text-sm font-medium text-gray-300 cursor-pointer">
                Auto-inject Chat Session ID
              </label>
              <p className="text-gray-400 text-xs mt-1">
                Automatically set the <code className="text-orange-400">chat_session_id</code> column to the
                current chat session&apos;s UUID. Enable this to track which conversation generated the record.
              </p>
            </div>
          </div>
        </>
      )}

      {/* DB Read specific: Max Limit */}
      {toolCategory === "dbTableRead" && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Maximum Rows
          </label>
          <input
            type="number"
            value={maxLimit}
            onChange={(e) => setMaxLimit(Math.max(1, Math.min(1000, parseInt(e.target.value) || 100)))}
            min="1"
            max="1000"
            className={`w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 ${ringClass}`}
          />
          <p className="text-gray-400 text-xs mt-2">
            Maximum rows the agent can request per query (1-1000). Default is 100.
          </p>
        </div>
      )}
    </>
  );
}
