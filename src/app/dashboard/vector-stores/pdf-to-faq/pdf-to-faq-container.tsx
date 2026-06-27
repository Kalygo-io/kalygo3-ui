"use client";

import { useState, useRef } from "react";
import {
  DocumentArrowUpIcon,
  DocumentTextIcon,
  EyeIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CloudArrowUpIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

// ── Wizard steps ──────────────────────────────────────────────────────────────

const STEPS = [
  { id: "select", label: "File Selector", icon: DocumentArrowUpIcon },
  { id: "preview", label: "Preview", icon: EyeIcon },
] as const;

type StepId = (typeof STEPS)[number]["id"];

export function PdfToFaqContainer() {
  const [step, setStep] = useState<StepId>("select");
  const [file, setFile] = useState<File | null>(null);

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const goNext = () => {
    if (stepIndex < STEPS.length - 1) setStep(STEPS[stepIndex + 1].id);
  };
  const goBack = () => {
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1].id);
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
          <FileSelectorStep file={file} setFile={setFile} />
        )}
        {step === "preview" && <PreviewStep file={file} />}
      </div>

      {/* Footer navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goBack}
          disabled={stepIndex === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 bg-gray-700/60 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </button>

        {step === "select" ? (
          <button
            onClick={goNext}
            disabled={!file}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        ) : (
          <button
            // Scaffold: wire up to FAQ generation + ingestion later.
            disabled={!file}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <CloudArrowUpIcon className="h-4 w-4" />
            Upload
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

// ── Step 1: File Selector ─────────────────────────────────────────────────────

function FileSelectorStep({
  file,
  setFile,
}: {
  file: File | null;
  setFile: (f: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const picked = files?.[0];
    if (picked) setFile(picked);
  };

  return (
    <div className="space-y-4">
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
    </div>
  );
}

// ── Step 2: Preview ───────────────────────────────────────────────────────────

function PreviewStep({ file }: { file: File | null }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Preview</h2>
        <p className="text-gray-400 text-sm">
          Review the generated FAQ pairs before uploading.
        </p>
      </div>

      {file ? (
        <div className="bg-gray-900/60 border border-gray-700/50 rounded-lg px-4 py-3 flex items-center gap-3">
          <DocumentTextIcon className="h-5 w-5 text-blue-400 flex-shrink-0" />
          <span className="text-sm text-white truncate">{file.name}</span>
        </div>
      ) : (
        <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4">
          <p className="text-yellow-300 text-sm">
            No file selected. Go back to choose a PDF.
          </p>
        </div>
      )}

      {/* Scaffold: generated FAQ pairs will render here once parsing is wired up. */}
      <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/40 p-10 text-center">
        <EyeIcon className="h-10 w-10 text-gray-600 mx-auto mb-3" />
        <p className="text-sm text-gray-400">
          FAQ preview will appear here once PDF parsing is implemented.
        </p>
      </div>
    </div>
  );
}
