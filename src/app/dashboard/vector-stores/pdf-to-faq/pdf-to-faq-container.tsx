"use client";

import { useState, useRef, useEffect } from "react";
import {
  DocumentArrowUpIcon,
  DocumentTextIcon,
  EyeIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import {
  AVAILABLE_MODELS,
  DEFAULT_MODEL,
  ModelConfig,
  ModelProvider,
} from "@/services/agentsService";
import {
  vectorStoresService,
  Namespace,
} from "@/services/vectorStoresService";
import {
  generateFaqs,
  fileToBase64,
  FaqPair,
} from "@/services/pdfToFaqService";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";

// ── Wizard steps ──────────────────────────────────────────────────────────────

const STEPS = [
  { id: "select", label: "File Selector", icon: DocumentArrowUpIcon },
  { id: "preview", label: "Preview", icon: EyeIcon },
] as const;

type StepId = (typeof STEPS)[number]["id"];

export function PdfToFaqContainer() {
  const [step, setStep] = useState<StepId>("select");
  const [file, setFile] = useState<File | null>(null);
  const [modelConfig, setModelConfig] = useState<ModelConfig>(DEFAULT_MODEL);
  const [faqs, setFaqs] = useState<FaqPair[]>([]);
  const [generating, setGenerating] = useState(false);

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const handleGenerate = async () => {
    if (!file) return;
    try {
      setGenerating(true);
      const pdfBase64 = await fileToBase64(file);
      const result = await generateFaqs({
        pdfBase64,
        pdfFilename: file.name,
        provider: modelConfig.provider,
        model: modelConfig.model,
      });
      if (!result.pairs || result.pairs.length === 0) {
        errorToast("No FAQ pairs could be generated from this PDF.");
        return;
      }
      setFaqs(result.pairs);
      setStep("preview");
    } catch (error: any) {
      errorToast(error.message || "Failed to generate FAQ pairs.");
    } finally {
      setGenerating(false);
    }
  };

  const resetWizard = () => {
    setStep("select");
    setFile(null);
    setFaqs([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-semibold text-white">PDF to FAQ</h1>
        <p className="text-gray-400 mt-2">
          Turn a PDF into a set of Q&amp;A pairs and add them to a knowledge
          base.
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator currentIndex={stepIndex} />

      {/* Step content */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        {step === "select" && (
          <FileSelectorStep
            file={file}
            setFile={setFile}
            modelConfig={modelConfig}
            setModelConfig={setModelConfig}
          />
        )}
        {step === "preview" && (
          <PreviewStep file={file} faqs={faqs} onUploaded={resetWizard} />
        )}
      </div>

      {/* Footer navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep("select")}
          disabled={stepIndex === 0 || generating}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 bg-gray-700/60 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </button>

        {step === "select" && (
          <button
            onClick={handleGenerate}
            disabled={!file || generating}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? "Generating…" : "Generate FAQs"}
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Step indicator ──────────────────────────────────────────────────────────

function StepIndicator({ currentIndex }: { currentIndex: number }) {
  return (
    <div className="flex items-center gap-4">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const active = i === currentIndex;
        const complete = i < currentIndex;
        return (
          <div key={s.id} className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center border transition-colors ${
                  active
                    ? "bg-blue-600 border-blue-500 text-white"
                    : complete
                      ? "bg-green-600/20 border-green-500/40 text-green-400"
                      : "bg-gray-800 border-gray-700 text-gray-500"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Step {i + 1}</p>
                <p
                  className={`text-sm font-medium ${
                    active ? "text-white" : "text-gray-400"
                  }`}
                >
                  {s.label}
                </p>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-px w-12 ${
                  complete ? "bg-green-500/40" : "bg-gray-700"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Step 1: File Selector + model ─────────────────────────────────────────────

function FileSelectorStep({
  file,
  setFile,
  modelConfig,
  setModelConfig,
}: {
  file: File | null;
  setFile: (f: File | null) => void;
  modelConfig: ModelConfig;
  setModelConfig: (m: ModelConfig) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const picked = files?.[0];
    if (picked) setFile(picked);
  };

  const handleProviderChange = (provider: ModelProvider) => {
    setModelConfig({ provider, model: AVAILABLE_MODELS[provider][0].value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">
          Select a PDF file
        </h2>
        <p className="text-gray-400 text-sm">
          Choose the PDF you want to convert into FAQ entries.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
          dragOver
            ? "border-blue-500 bg-blue-500/5"
            : "border-gray-700 hover:border-gray-600 bg-gray-900/40"
        }`}
      >
        <DocumentArrowUpIcon className="h-10 w-10 text-gray-500 mx-auto mb-3" />
        <p className="text-sm text-gray-300">
          Drag &amp; drop a PDF here, or{" "}
          <span className="text-blue-400">browse</span>
        </p>
        <p className="text-xs text-gray-500 mt-1">Supports .pdf files</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {file && (
        <div className="flex items-center justify-between bg-gray-900/60 border border-gray-700/50 rounded-lg px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <DocumentTextIcon className="h-5 w-5 text-blue-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-white truncate">{file.name}</p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFile(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-600/20 rounded-lg transition-colors"
            title="Remove file"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Model selector */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-2">
          Model
        </h3>
        <p className="text-gray-500 text-xs mb-3">
          The model that reads the PDF and generates the Q&amp;A pairs.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Provider
            </label>
            <select
              value={modelConfig.provider}
              onChange={(e) =>
                handleProviderChange(e.target.value as ModelProvider)
              }
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="google">Google Gemini</option>
              <option value="ollama">Ollama (Self-hosted)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Model
            </label>
            <select
              value={modelConfig.model}
              onChange={(e) =>
                setModelConfig({ ...modelConfig, model: e.target.value })
              }
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {AVAILABLE_MODELS[modelConfig.provider].map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Preview + ingest ──────────────────────────────────────────────────

/** A pickable ingest target — either an own index or a writable shared KB. */
interface IngestTarget {
  indexName: string;
  /** Owner of a shared KB; undefined for the caller's own index. */
  ownerAccountId?: number;
  shared: boolean;
}

/** Stable <option> value that encodes the owner (or "own"). */
function targetKey(t: IngestTarget): string {
  return t.ownerAccountId != null
    ? `shared:${t.ownerAccountId}:${t.indexName}`
    : `own:${t.indexName}`;
}

function PreviewStep({
  file,
  faqs,
  onUploaded,
}: {
  file: File | null;
  faqs: FaqPair[];
  onUploaded: () => void;
}) {
  const [targets, setTargets] = useState<IngestTarget[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [loadingIndexes, setLoadingIndexes] = useState(true);

  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState<string>("");
  const [loadingNamespaces, setLoadingNamespaces] = useState(false);

  const [uploading, setUploading] = useState(false);

  const selectedTarget = targets.find((t) => targetKey(t) === selectedKey);

  useEffect(() => {
    (async () => {
      try {
        setLoadingIndexes(true);
        const [indexes, shared] = await Promise.all([
          vectorStoresService.listIndexes(),
          vectorStoresService.listSharedVectorStores().catch(() => []),
        ]);
        const all: IngestTarget[] = [
          ...indexes.map((idx) => ({ indexName: idx.name, shared: false })),
          ...shared
            .filter((s) => s.can_write)
            .map((s) => ({
              indexName: s.index_name,
              ownerAccountId: s.owner_account_id,
              shared: true,
            })),
        ];
        setTargets(all);
        if (all.length > 0) setSelectedKey(targetKey(all[0]));
      } catch (error: any) {
        errorToast(error.message || "Failed to load knowledge bases");
      } finally {
        setLoadingIndexes(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedTarget) {
      setNamespaces([]);
      setSelectedNamespace("");
      return;
    }
    const { indexName, ownerAccountId } = selectedTarget;
    (async () => {
      try {
        setLoadingNamespaces(true);
        setSelectedNamespace("");
        const data = await vectorStoresService.listNamespaces(
          indexName,
          ownerAccountId,
        );
        setNamespaces(data);
        if (data.length > 0) setSelectedNamespace(data[0].namespace || "");
      } catch (error: any) {
        errorToast(
          error.message || `Failed to load namespaces for ${indexName}`,
        );
      } finally {
        setLoadingNamespaces(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey]);

  const handleUpload = async () => {
    if (!file || !faqs.length || !selectedTarget || !selectedNamespace) return;
    try {
      setUploading(true);
      // Upload the ORIGINAL PDF as the stored source; the reviewed Q&A pairs
      // ride along and are ingested with metadata pointing back at the PDF.
      await vectorStoresService.uploadPdfFaq(
        selectedTarget.indexName,
        selectedNamespace,
        file,
        faqs,
        undefined,
        undefined,
        selectedTarget.ownerAccountId,
      );
      successToast(
        "FAQ pairs queued for ingestion. Vectors will appear shortly.",
      );
      onUploaded();
    } catch (error: any) {
      errorToast(error.message || "Failed to upload FAQ pairs.");
    } finally {
      setUploading(false);
    }
  };

  const canUpload =
    !!file &&
    faqs.length > 0 &&
    !!selectedTarget &&
    !!selectedNamespace &&
    !uploading;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Preview</h2>
        <p className="text-gray-400 text-sm">
          Review the generated FAQ pairs, then choose where to ingest them.
        </p>
      </div>

      {/* Selected source file */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Source file
        </label>
        {file ? (
          <div className="flex items-center gap-3 bg-gray-900/60 border border-gray-700/50 rounded-lg px-4 py-3">
            <div className="h-10 w-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
              <DocumentTextIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate" title={file.name}>
                {file.name}
              </p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024).toFixed(1)} KB · PDF
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg px-4 py-3">
            <p className="text-yellow-300 text-sm">
              No file selected. Go back to choose a PDF.
            </p>
          </div>
        )}
      </div>

      {/* Destination selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Knowledge Base *
          </label>
          <select
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            disabled={loadingIndexes || targets.length === 0}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {loadingIndexes ? (
              <option>Loading knowledge bases…</option>
            ) : targets.length === 0 ? (
              <option>No knowledge bases available</option>
            ) : (
              targets.map((t) => {
                const key = targetKey(t);
                return (
                  <option key={key} value={key}>
                    {t.indexName}
                    {t.shared ? " (shared)" : ""}
                  </option>
                );
              })
            )}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Namespace *
          </label>
          <select
            value={selectedNamespace}
            onChange={(e) => setSelectedNamespace(e.target.value)}
            disabled={loadingNamespaces || namespaces.length === 0}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {loadingNamespaces ? (
              <option>Loading namespaces…</option>
            ) : namespaces.length === 0 ? (
              <option>No namespaces available</option>
            ) : (
              <>
                <option value="">Select a namespace</option>
                {namespaces.map((ns) => (
                  <option key={ns.namespace} value={ns.namespace || ""}>
                    {ns.namespace || "(default)"}
                    {ns.vector_count !== undefined
                      ? ` (${ns.vector_count.toLocaleString()} vectors)`
                      : ""}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>
      </div>

      {/* Generated pairs (read-only) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-300">
            Generated Q&amp;A pairs
          </h3>
          <span className="text-xs text-gray-500">
            {faqs.length} pair{faqs.length === 1 ? "" : "s"}
          </span>
        </div>

        {faqs.length === 0 ? (
          <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4">
            <p className="text-yellow-300 text-sm">
              No FAQ pairs to review. Go back to generate them from a PDF.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
            {faqs.map((pair, i) => (
              <div
                key={i}
                className="bg-gray-900/60 border border-gray-700/50 rounded-lg p-4"
              >
                <div className="flex items-start gap-2">
                  <QuestionMarkCircleIcon className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-white">
                    {pair.question}
                  </p>
                </div>
                <p className="text-sm text-gray-300 mt-2 whitespace-pre-wrap pl-7">
                  {pair.answer}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload */}
      <div className="flex justify-end">
        <button
          onClick={handleUpload}
          disabled={!canUpload}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <CloudArrowUpIcon className="h-4 w-4" />
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </div>
    </div>
  );
}
