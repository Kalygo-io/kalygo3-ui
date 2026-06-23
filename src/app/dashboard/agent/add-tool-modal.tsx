"use client";

import { useState, useEffect, useRef } from "react";
import { XMarkIcon, CircleStackIcon, MagnifyingGlassIcon, PencilSquareIcon, EnvelopeIcon, ChevronUpDownIcon } from "@heroicons/react/24/outline";
import { AgentTool, DbTableReadTool, DbTableWriteTool, SendTxtEmailWithSesTool, SendHtmlEmailWithSesTool, SendTxtEmailWithGoogleOAuthTool, SendTxtEmailWithGoogleSmtpTool } from "@/services/agentsService";
import { vectorStoresService, Index, Namespace } from "@/services/vectorStoresService";
import { credentialService, Credential, CredentialType, ServiceName } from "@/services/credentialService";
import { emailTemplatesService, EmailTemplate } from "@/services/emailTemplatesService";
import { errorToast } from "@/shared/toasts/errorToast";
import { VectorSearchForm } from "./add-tool-modal/VectorSearchForm";
import { DbTableForm } from "./add-tool-modal/DbTableForm";
import { SesEmailForm } from "./add-tool-modal/SesEmailForm";
import { GoogleOAuthEmailForm } from "./add-tool-modal/GoogleOAuthEmailForm";
import { GoogleSmtpEmailForm } from "./add-tool-modal/GoogleSmtpEmailForm";

type ToolCategoryValue =
  | "vectorSearch"
  | "dbTableRead"
  | "dbTableWrite"
  | "sendTxtEmailWithSes"
  | "sendHtmlEmailWithSes"
  | "sendTxtEmailWithGoogleOAuth"
  | "sendTxtEmailWithGoogleSmtp";

const TOOL_CATEGORIES: {
  value: ToolCategoryValue;
  label: string;
  subtitle: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
}[] = [
  { value: "vectorSearch",                label: "Vector Search",              subtitle: "Semantic retrieval",  Icon: MagnifyingGlassIcon, color: "text-blue-400" },
  { value: "dbTableRead",                 label: "DB Read",                    subtitle: "Query data",          Icon: CircleStackIcon,     color: "text-green-400" },
  { value: "dbTableWrite",                label: "DB Write",                   subtitle: "Insert records",      Icon: PencilSquareIcon,    color: "text-orange-400" },
  { value: "sendTxtEmailWithSes",         label: "Send Email",                 subtitle: "AWS SES",             Icon: EnvelopeIcon,        color: "text-pink-400" },
  { value: "sendHtmlEmailWithSes",        label: "Send Templated HTML Email",  subtitle: "AWS SES",             Icon: EnvelopeIcon,        color: "text-pink-400" },
  { value: "sendTxtEmailWithGoogleOAuth", label: "Send Email",                 subtitle: "Google OAuth",        Icon: EnvelopeIcon,        color: "text-blue-400" },
  { value: "sendTxtEmailWithGoogleSmtp",  label: "Send Email",                 subtitle: "Google SMTP",         Icon: EnvelopeIcon,        color: "text-cyan-400" },
];

function ToolCategorySelect({
  value,
  onChange,
}: {
  value: ToolCategoryValue;
  onChange: (v: ToolCategoryValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = TOOL_CATEGORIES.find((c) => c.value === value)!;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Tool Category *
      </label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-left hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      >
        <selected.Icon className={`h-5 w-5 shrink-0 ${selected.color}`} />
        <span className="flex-1 text-white text-sm font-medium">
          {selected.label}
          <span className="text-gray-500 font-normal ml-2">{selected.subtitle}</span>
        </span>
        <ChevronUpDownIcon className="h-5 w-5 text-gray-500 shrink-0" />
      </button>

      {open && (
        <ul className="absolute z-10 mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
          {TOOL_CATEGORIES.map((cat) => (
            <li key={cat.value}>
              <button
                type="button"
                onClick={() => { onChange(cat.value); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  cat.value === value
                    ? "bg-gray-800 text-white"
                    : "text-gray-300 hover:bg-gray-800/60"
                }`}
              >
                <cat.Icon className={`h-5 w-5 shrink-0 ${cat.color}`} />
                <span className="text-sm font-medium">
                  {cat.label}
                  <span className="text-gray-500 font-normal ml-2">{cat.subtitle}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface AddToolModalProps {
  onClose: () => void;
  onAdd: (tool: AgentTool) => void;
  initialTool?: AgentTool;
}

export function AddToolModal({
  onClose,
  onAdd,
  initialTool,
}: AddToolModalProps) {
  // Tool category selection
  const [toolCategory, setToolCategory] = useState<ToolCategoryValue>("vectorSearch");
  
  // Vector search state
  const [vectorToolType, setVectorToolType] = useState<"vectorSearch" | "vectorSearchWithReranking">("vectorSearch");
  const [provider] = useState<"pinecone">("pinecone");
  const [selectedIndex, setSelectedIndex] = useState("");
  const [selectedNamespace, setSelectedNamespace] = useState("");
  const [topK, setTopK] = useState(10);
  const [topN, setTopN] = useState(5);
  
  // DB Read/Write shared state
  const [selectedCredentialId, setSelectedCredentialId] = useState<number | "">("");
  const [tableName, setTableName] = useState("");
  const [columns, setColumns] = useState("");
  
  // DB Read specific
  const [maxLimit, setMaxLimit] = useState(100);
  
  // DB Write specific
  const [requiredColumns, setRequiredColumns] = useState("");
  const [injectAccountId, setInjectAccountId] = useState(false);
  const [injectChatSessionId, setInjectChatSessionId] = useState(false);
  
  // Shared state
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Data fetching state
  const [indices, setIndices] = useState<Index[]>([]);
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [loadingNamespaces, setLoadingNamespaces] = useState(false);
  const [dbCredentials, setDbCredentials] = useState<Credential[]>([]);
  const [sesCredentials, setSesCredentials] = useState<Credential[]>([]);
  const [loadingCredentials, setLoadingCredentials] = useState(false);

  // Send Text Email (SES) state
  const [selectedSesCredentialId, setSelectedSesCredentialId] = useState<number | "">("");

  // Send Text Email (Google OAuth) state
  const [selectedGoogleOAuthCredentialId, setSelectedGoogleOAuthCredentialId] = useState<number | "">("");
  const [googleOAuthCredentials, setGoogleOAuthCredentials] = useState<Credential[]>([]);

  // Send Text Email (Google SMTP) state
  const [selectedGoogleSmtpCredentialId, setSelectedGoogleSmtpCredentialId] = useState<number | "">("");
  const [googleSmtpCredentials, setGoogleSmtpCredentials] = useState<Credential[]>([]);

  // Send Template Email (SES) template picker state
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | "">("");
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const isEditing = !!initialTool;

  // Initialize from existing tool
  useEffect(() => {
    if (initialTool) {
      setDescription(initialTool.description || "");
      
      if (initialTool.type === "dbTableRead") {
        setToolCategory("dbTableRead");
        setSelectedCredentialId(initialTool.credentialId);
        setTableName(initialTool.table);
        setColumns(initialTool.columns?.join(", ") || "");
        setMaxLimit(initialTool.maxLimit || 100);
      } else if (initialTool.type === "dbTableWrite") {
        setToolCategory("dbTableWrite");
        setSelectedCredentialId(initialTool.credentialId);
        setTableName(initialTool.table);
        setColumns(initialTool.columns.join(", "));
        setRequiredColumns(initialTool.requiredColumns?.join(", ") || "");
        setInjectAccountId(initialTool.injectAccountId || false);
        setInjectChatSessionId(initialTool.injectChatSessionId || false);
      } else if (initialTool.type === "sendTxtEmailWithSes") {
        setToolCategory("sendTxtEmailWithSes");
        setSelectedSesCredentialId(initialTool.credentialId);
      } else if (initialTool.type === "sendHtmlEmailWithSes") {
        setToolCategory("sendHtmlEmailWithSes");
      } else if (initialTool.type === "sendTxtEmailWithGoogleOAuth") {
        setToolCategory("sendTxtEmailWithGoogleOAuth");
        setSelectedGoogleOAuthCredentialId(initialTool.credentialId);
      } else if (initialTool.type === "sendTxtEmailWithGoogleSmtp") {
        setToolCategory("sendTxtEmailWithGoogleSmtp");
        setSelectedGoogleSmtpCredentialId(initialTool.credentialId);
      } else {
        setToolCategory("vectorSearch");
        setVectorToolType(initialTool.type);
        setSelectedIndex(initialTool.index);
        setSelectedNamespace(initialTool.namespace);
        
        if (initialTool.type === "vectorSearch") {
          setTopK(initialTool.topK || 10);
        } else if (initialTool.type === "vectorSearchWithReranking") {
          setTopK(initialTool.topK || 20);
          setTopN(initialTool.topN || 5);
        }
      }
    }
  }, [initialTool]);

  useEffect(() => {
    loadIndices();
    loadDbCredentials();
    loadEmailTemplates();
  }, []);

  useEffect(() => {
    if (selectedIndex) {
      loadNamespaces(selectedIndex);
    } else {
      setNamespaces([]);
      setSelectedNamespace("");
    }
  }, [selectedIndex]);

  const loadIndices = async () => {
    try {
      setLoading(true);
      const data = await vectorStoresService.listIndexes();
      setIndices(data);
    } catch (error: any) {
      errorToast(error.message || "Failed to load indices");
    } finally {
      setLoading(false);
    }
  };

  const loadNamespaces = async (indexName: string) => {
    try {
      setLoadingNamespaces(true);
      const data = await vectorStoresService.listNamespaces(indexName);
      setNamespaces(data);
    } catch (error: any) {
      errorToast(error.message || "Failed to load namespaces");
      setNamespaces([]);
    } finally {
      setLoadingNamespaces(false);
    }
  };

  const loadDbCredentials = async () => {
    try {
      setLoadingCredentials(true);
      const allCredentials = await credentialService.listCredentials();
      const dbCreds = allCredentials.filter(
        (c) => c.auth_type === CredentialType.DB_CONNECTION || c.auth_type === "db_connection"
      );
      setDbCredentials(dbCreds);
      const sesCreds = allCredentials.filter(
        (c) => c.credential_type === ServiceName.AWS_SES || c.credential_type === "AWS_SES"
      );
      setSesCredentials(sesCreds);
      const googleOAuthCreds = allCredentials.filter(
        (c) => c.credential_type === ServiceName.GOOGLE_OAUTH || c.credential_type === "GOOGLE_OAUTH"
      );
      setGoogleOAuthCredentials(googleOAuthCreds);
      const googleSmtpCreds = allCredentials.filter(
        (c) => c.credential_type === ServiceName.GOOGLE_GMAIL_SMTP || c.credential_type === "GOOGLE_GMAIL_SMTP"
      );
      setGoogleSmtpCredentials(googleSmtpCreds);
    } catch (error: any) {
      console.error("Failed to load credentials:", error);
    } finally {
      setLoadingCredentials(false);
    }
  };

  const loadEmailTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const data = await emailTemplatesService.list();
      setEmailTemplates(data);
    } catch (error: any) {
      console.error("Failed to load email templates:", error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let tool: AgentTool;

    if (toolCategory === "dbTableRead") {
      // DB Read tool validation
      if (!selectedCredentialId) {
        errorToast("Please select a database credential");
        return;
      }

      if (!tableName.trim()) {
        errorToast("Please enter a table name");
        return;
      }

      // Parse columns
      const columnsArray = columns.trim()
        ? columns.split(",").map((c) => c.trim()).filter((c) => c.length > 0)
        : undefined;

      const dbTool: DbTableReadTool = {
        type: "dbTableRead",
        credentialId: selectedCredentialId as number,
        table: tableName.trim(),
      };

      if (description.trim()) {
        dbTool.description = description.trim();
      }
      if (columnsArray && columnsArray.length > 0) {
        dbTool.columns = columnsArray;
      }
      if (maxLimit !== 100) {
        dbTool.maxLimit = maxLimit;
      }

      tool = dbTool;
    } else if (toolCategory === "dbTableWrite") {
      // DB Write tool validation
      if (!selectedCredentialId) {
        errorToast("Please select a database credential");
        return;
      }

      if (!tableName.trim()) {
        errorToast("Please enter a table name");
        return;
      }

      // Parse columns (required for dbWrite)
      const columnsArray = columns.trim()
        ? columns.split(",").map((c) => c.trim()).filter((c) => c.length > 0)
        : [];

      if (columnsArray.length === 0) {
        errorToast("Please specify at least one column for database write");
        return;
      }

      // Parse required columns
      const requiredColumnsArray = requiredColumns.trim()
        ? requiredColumns.split(",").map((c) => c.trim()).filter((c) => c.length > 0)
        : undefined;

      // Validate required columns are subset of columns
      if (requiredColumnsArray) {
        const invalidRequired = requiredColumnsArray.filter((rc) => !columnsArray.includes(rc));
        if (invalidRequired.length > 0) {
          errorToast(`Required columns must be in the allowed columns list: ${invalidRequired.join(", ")}`);
          return;
        }
      }

      const dbWriteTool: DbTableWriteTool = {
        type: "dbTableWrite",
        credentialId: selectedCredentialId as number,
        table: tableName.trim(),
        columns: columnsArray,
      };

      if (description.trim()) {
        dbWriteTool.description = description.trim();
      }
      if (requiredColumnsArray && requiredColumnsArray.length > 0) {
        dbWriteTool.requiredColumns = requiredColumnsArray;
      }
      if (injectAccountId) {
        dbWriteTool.injectAccountId = true;
      }
      if (injectChatSessionId) {
        dbWriteTool.injectChatSessionId = true;
      }

        tool = dbWriteTool;
    } else if (toolCategory === "sendTxtEmailWithSes") {
      if (!selectedSesCredentialId) {
        errorToast("Please select an AWS SES credential");
        return;
      }

      const sesTool: SendTxtEmailWithSesTool = {
        type: "sendTxtEmailWithSes",
        credentialId: selectedSesCredentialId as number,
      };

      if (description.trim()) {
        sesTool.description = description.trim();
      }

      tool = sesTool;
    } else if (toolCategory === "sendHtmlEmailWithSes") {
      if (!selectedSesCredentialId) {
        errorToast("Please select an AWS SES credential");
        return;
      }

      const htmlSesTool: SendHtmlEmailWithSesTool = {
        type: "sendHtmlEmailWithSes",
        credentialId: selectedSesCredentialId as number,
      };

      if (description.trim()) {
        htmlSesTool.description = description.trim();
      }

      tool = htmlSesTool;
    } else if (toolCategory === "sendTxtEmailWithGoogleOAuth") {
      if (!selectedGoogleOAuthCredentialId) {
        errorToast("Please select a Google OAuth credential");
        return;
      }

      const googleOAuthTool: SendTxtEmailWithGoogleOAuthTool = {
        type: "sendTxtEmailWithGoogleOAuth",
        credentialId: selectedGoogleOAuthCredentialId as number,
      };

      if (description.trim()) {
        googleOAuthTool.description = description.trim();
      }

      tool = googleOAuthTool;
    } else if (toolCategory === "sendTxtEmailWithGoogleSmtp") {
      if (!selectedGoogleSmtpCredentialId) {
        errorToast("Please select a Google Gmail SMTP credential");
        return;
      }

      const googleSmtpTool: SendTxtEmailWithGoogleSmtpTool = {
        type: "sendTxtEmailWithGoogleSmtp",
        credentialId: selectedGoogleSmtpCredentialId as number,
      };

      if (description.trim()) {
        googleSmtpTool.description = description.trim();
      }

      tool = googleSmtpTool;
    } else {
      // Vector search tools
      if (!selectedIndex) {
        errorToast("Please select an index");
        return;
      }

      if (!selectedNamespace) {
        errorToast("Please select a namespace");
        return;
      }

      if (vectorToolType === "vectorSearch") {
        tool = {
          type: "vectorSearch",
          provider,
          index: selectedIndex,
          namespace: selectedNamespace,
          description: description.trim() || undefined,
          topK,
        };
      } else {
        tool = {
          type: "vectorSearchWithReranking",
          provider,
          index: selectedIndex,
          namespace: selectedNamespace,
          description: description.trim() || undefined,
          topK,
          topN,
        };
      }
    }

    onAdd(tool);
  };

  const selectedCredential = dbCredentials.find((c) => c.id === selectedCredentialId);
  const selectedSesCredential = sesCredentials.find((c) => c.id === selectedSesCredentialId);
  const selectedGoogleOAuthCredential = googleOAuthCredentials.find((c) => c.id === selectedGoogleOAuthCredentialId);
  const selectedGoogleSmtpCredential = googleSmtpCredentials.find((c) => c.id === selectedGoogleSmtpCredentialId);

  // Determine color theme based on tool category
  const isDbTool = toolCategory === "dbTableRead" || toolCategory === "dbTableWrite";
  const ringClass =
    toolCategory === "dbTableWrite"               ? "focus:ring-orange-500" :
    toolCategory === "dbTableRead"                ? "focus:ring-green-500" :
    toolCategory === "sendTxtEmailWithSes"               ? "focus:ring-pink-500" :
    toolCategory === "sendHtmlEmailWithSes"              ? "focus:ring-pink-500" :
    toolCategory === "sendTxtEmailWithGoogleOAuth"? "focus:ring-blue-500" :
    toolCategory === "sendTxtEmailWithGoogleSmtp" ? "focus:ring-cyan-500" :
    "focus:ring-blue-500";
  const buttonClass =
    toolCategory === "dbTableWrite"               ? "bg-orange-600 hover:bg-orange-700" :
    toolCategory === "dbTableRead"                ? "bg-green-600 hover:bg-green-700" :
    toolCategory === "sendTxtEmailWithSes"               ? "bg-pink-600 hover:bg-pink-700" :
    toolCategory === "sendHtmlEmailWithSes"              ? "bg-pink-600 hover:bg-pink-700" :
    toolCategory === "sendTxtEmailWithGoogleOAuth"? "bg-blue-600 hover:bg-blue-700" :
    toolCategory === "sendTxtEmailWithGoogleSmtp" ? "bg-cyan-600 hover:bg-cyan-700" :
    "bg-blue-600 hover:bg-blue-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-semibold text-white">
            {isEditing ? "Edit Tool" : "Add Tool"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tool Category Selection */}
          {!isEditing && (
            <ToolCategorySelect value={toolCategory} onChange={setToolCategory} />
          )}

          {/* Vector Search Options */}
          {toolCategory === "vectorSearch" && (
            <VectorSearchForm
              vectorToolType={vectorToolType}
              setVectorToolType={setVectorToolType}
              selectedIndex={selectedIndex}
              setSelectedIndex={setSelectedIndex}
              selectedNamespace={selectedNamespace}
              setSelectedNamespace={setSelectedNamespace}
              topK={topK}
              setTopK={setTopK}
              topN={topN}
              setTopN={setTopN}
              indices={indices}
              namespaces={namespaces}
              loading={loading}
              loadingNamespaces={loadingNamespaces}
              isEditing={isEditing}
            />
          )}

          {/* Database Read/Write Options */}
          {isDbTool && (
            <DbTableForm
              toolCategory={toolCategory as "dbTableRead" | "dbTableWrite"}
              ringClass={ringClass}
              selectedCredentialId={selectedCredentialId}
              setSelectedCredentialId={setSelectedCredentialId}
              tableName={tableName}
              setTableName={setTableName}
              columns={columns}
              setColumns={setColumns}
              maxLimit={maxLimit}
              setMaxLimit={setMaxLimit}
              requiredColumns={requiredColumns}
              setRequiredColumns={setRequiredColumns}
              injectAccountId={injectAccountId}
              setInjectAccountId={setInjectAccountId}
              injectChatSessionId={injectChatSessionId}
              setInjectChatSessionId={setInjectChatSessionId}
              dbCredentials={dbCredentials}
              selectedCredential={selectedCredential}
              loadingCredentials={loadingCredentials}
              isEditing={isEditing}
            />
          )}

          {/* Send Text Email Options */}
          {toolCategory === "sendTxtEmailWithSes" && (
            <SesEmailForm
              selectedSesCredentialId={selectedSesCredentialId}
              setSelectedSesCredentialId={setSelectedSesCredentialId}
              sesCredentials={sesCredentials}
              selectedSesCredential={selectedSesCredential}
              loadingCredentials={loadingCredentials}
              isEditing={isEditing}
            />
          )}

          {/* Send Templated HTML Email via SES */}
          {toolCategory === "sendHtmlEmailWithSes" && (
            <SesEmailForm
              selectedSesCredentialId={selectedSesCredentialId}
              setSelectedSesCredentialId={setSelectedSesCredentialId}
              sesCredentials={sesCredentials}
              selectedSesCredential={selectedSesCredential}
              loadingCredentials={loadingCredentials}
              isEditing={isEditing}
              showTemplateNote
            />
          )}

          {/* Send Email via Google OAuth */}
          {toolCategory === "sendTxtEmailWithGoogleOAuth" && (
            <GoogleOAuthEmailForm
              selectedGoogleOAuthCredentialId={selectedGoogleOAuthCredentialId}
              setSelectedGoogleOAuthCredentialId={setSelectedGoogleOAuthCredentialId}
              googleOAuthCredentials={googleOAuthCredentials}
              selectedGoogleOAuthCredential={selectedGoogleOAuthCredential}
              loadingCredentials={loadingCredentials}
              isEditing={isEditing}
            />
          )}

          {/* Send Email via Google SMTP */}
          {toolCategory === "sendTxtEmailWithGoogleSmtp" && (
            <GoogleSmtpEmailForm
              selectedGoogleSmtpCredentialId={selectedGoogleSmtpCredentialId}
              setSelectedGoogleSmtpCredentialId={setSelectedGoogleSmtpCredentialId}
              googleSmtpCredentials={googleSmtpCredentials}
              selectedGoogleSmtpCredential={selectedGoogleSmtpCredential}
              loadingCredentials={loadingCredentials}
              isEditing={isEditing}
            />
          )}

          {/* Description (shared) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                toolCategory === "dbTableWrite"
                  ? "Describe what records this tool creates and when to use it..."
                  : toolCategory === "dbTableRead"
                    ? "Describe what data this table contains and what queries are useful..."
                    : toolCategory === "sendTxtEmailWithSes" || toolCategory === "sendHtmlEmailWithSes" || toolCategory === "sendTxtEmailWithGoogleOAuth" || toolCategory === "sendTxtEmailWithGoogleSmtp"
                      ? "Describe when the agent should send an email and any guidelines for tone or content..."
                      : "Describe what this knowledge base contains..."
              }
              rows={3}
              className={`w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${ringClass} resize-none`}
            />
            <p className="text-gray-400 text-xs mt-2">
              Help the LLM decide when and how to use this tool.
            </p>
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
              disabled={
                (isDbTool && dbCredentials.length === 0) ||
                (toolCategory === "sendTxtEmailWithSes" && sesCredentials.length === 0) ||
                (toolCategory === "sendHtmlEmailWithSes" && sesCredentials.length === 0) ||
                (toolCategory === "sendTxtEmailWithGoogleOAuth" && googleOAuthCredentials.length === 0) ||
                (toolCategory === "sendTxtEmailWithGoogleSmtp" && googleSmtpCredentials.length === 0)
              }
              className={`flex-1 font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-white disabled:opacity-50 disabled:cursor-not-allowed ${buttonClass}`}
            >
              {isEditing ? "Update Tool" : "Add Tool"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
