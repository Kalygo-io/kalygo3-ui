import { errorReporter } from "@/shared/errorReporter";
import { XCircleIcon, Square2StackIcon } from "@heroicons/react/24/outline";
import React, { Dispatch, SetStateAction, useState } from "react";
import { successToast, errorToast } from "@/shared/toasts";

/**
 * Shape returned by the various upload services. Fields are optional so the
 * single component can render results from every service (the reranking service
 * reports chunk counts, the others a filename + message).
 */
export interface UploadResult {
  success: boolean;
  filename?: string;
  message?: string;
  error?: string;
  successful_uploads?: number;
  failed_uploads?: number;
  [key: string]: unknown;
}

export interface FileUploadProps {
  /** Lifted file-list state (kept so existing parents need no changes). */
  files: File[] | null;
  setFiles: Dispatch<SetStateAction<File[] | null>>;
  /** Uploads a single file. Callers close over indexName/namespace/etc. */
  uploadFn: (file: File) => Promise<UploadResult>;
  /** `accept` attribute for the file input, e.g. ".csv" or ".txt,.md". */
  accept: string;
  /** Lower-cased extensions used to validate drag-drop, e.g. [".txt", ".md"]. */
  acceptedExtensions: string[];
  /** Optional MIME allow-list (drag-drop also accepts a matching extension). */
  acceptedMimeTypes?: string[];
  /** Helper line under the dropzone, e.g. "Supports .txt and .md files". */
  supportedFilesText: string;
  /** Primary button label. Defaults to "Upload to Knowledge Base". */
  uploadButtonLabel?: string;
  /** "chunks" shows reranking-style chunk counts; "default" shows filename + message. */
  resultVariant?: "default" | "chunks";
  /** Called once after an upload batch finishes (success or partial). */
  onUploadSuccess?: () => void;
}

/**
 * Single drag-and-drop / file-input upload widget shared by the vector-stores,
 * similarity-search and reranking features. Replaces the four ~325-line
 * `choose-*-file.tsx` copies; per-feature behavior (service, accepted types,
 * labels, namespace) is supplied via props.
 */
export function FileUpload({
  files,
  setFiles,
  uploadFn,
  accept,
  acceptedExtensions,
  acceptedMimeTypes = [],
  supportedFilesText,
  uploadButtonLabel = "Upload to Knowledge Base",
  resultVariant = "default",
  onUploadSuccess,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const isValidFile = (file: File): boolean => {
    const name = file.name.toLowerCase();
    if (acceptedExtensions.some((ext) => name.endsWith(ext))) return true;
    return acceptedMimeTypes.includes(file.type);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      const dropped = e.dataTransfer?.files;
      for (let i = 0; i < dropped.length; i++) {
        if (!isValidFile(dropped[i])) {
          setDragActive(false);
          return;
        }
      }
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files) {
        const validFiles = Array.from(e.dataTransfer.files).filter(isValidFile);
        setUploadResults([]);
        setFiles((prev) => (prev ? [...prev, ...validFiles] : validFiles));
      }
    } catch (err) {
      errorReporter(err);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      e.preventDefault();
      if (e.target.files) {
        const selected = Array.from(e.target.files);
        setFiles((prev) => (prev ? [...prev, ...selected] : selected));
      }
    } catch (err) {
      errorReporter(err);
    }
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadResults([]);

    try {
      const results: UploadResult[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));

        try {
          const result = await uploadFn(file);
          results.push(result);

          const filename = result.filename || file.name;
          if (result.success) {
            successToast(result.message || `Successfully uploaded ${filename}`);
          } else {
            errorToast(
              `Failed to upload ${filename}: ${result.error || "Upload failed"}`,
            );
          }
        } catch (error) {
          let errorMessage = "Upload failed";
          if (error instanceof Error) errorMessage = error.message;
          else if (typeof error === "string") errorMessage = error;
          else errorMessage = `Upload failed: ${String(error)}`;

          console.error(`Failed to upload ${file.name}:`, error);
          errorToast(`Failed to upload ${file.name}: ${errorMessage}`);
          results.push({
            success: false,
            error: errorMessage,
            filename: file.name,
          });
        }
      }

      setUploadResults(results);
      setFiles(null);
      if (inputRef.current) inputRef.current.value = "";
      onUploadSuccess?.();
    } catch (err) {
      errorReporter(err);
      errorToast("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
        <div className="col-span-full flex justify-center">
          <form id="form-file-upload" onSubmit={(e) => e.preventDefault()}>
            <div
              id="label-file-upload"
              className={`relative mt-0 flex justify-center rounded-lg border border-dashed border-gray-700 mb-4 px-6 pt-2 pb-6 ${
                dragActive ? "bg-gray-800" : ""
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <div>
                <Square2StackIcon
                  className="mx-auto h-12 w-12 text-white"
                  aria-hidden="true"
                />

                <div className="mb-2 mt-2 flex items-center justify-center text-sm leading-6">
                  <label
                    htmlFor="input-file-upload"
                    className="relative cursor-pointer rounded-md font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500"
                  >
                    <button
                      type="button"
                      className="rounded bg-blue-600 px-2 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                      onClick={() => inputRef.current?.click()}
                    >
                      Select Files
                      <input
                        ref={inputRef}
                        type="file"
                        id="input-file-upload"
                        multiple={true}
                        onChange={handleChange}
                        accept={accept}
                        className="sr-only"
                      />
                    </button>
                  </label>
                </div>
                <p className="text-xs leading-5 text-gray-400">
                  <sup>*</sup>
                  {supportedFilesText}
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>

      <ul role="list" className="divide-y divide-gray-700">
        {files &&
          files.map((file, index) => (
            <li
              key={index}
              className="flex items-center justify-between gap-x-2 py-5"
            >
              <div className="flex items-start gap-x-2 truncate">
                <p className="text-sm font-semibold leading-6 truncate text-white">
                  {file.name}
                </p>
                <XCircleIcon
                  className="h-6 w-6 cursor-pointer text-gray-400 hover:text-red-400"
                  onClick={() => {
                    setFiles(files.filter((_, i) => i !== index));
                    if (inputRef.current) inputRef.current.value = "";
                  }}
                />
              </div>
            </li>
          ))}
      </ul>

      {files && files.length > 0 && (
        <div className="mt-6 space-y-4">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {uploading ? "Uploading..." : uploadButtonLabel}
          </button>

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Uploading files...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}

      {!uploading && uploadResults.length > 0 && (
        <div className="mt-4 space-y-3">
          <h4 className="text-sm font-semibold text-white">Upload Results:</h4>
          {uploadResults.map((result, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${
                result.success
                  ? "bg-green-900/20 border-green-700/30"
                  : "bg-red-900/20 border-red-700/30"
              }`}
            >
              {resultVariant === "chunks" ? (
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium text-white truncate"
                      title={result.filename}
                    >
                      {result.filename}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {result.successful_uploads} chunks uploaded successfully
                      {(result.failed_uploads ?? 0) > 0 &&
                        `, ${result.failed_uploads} failed`}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium flex-shrink-0 ${
                      result.success ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {result.success ? "✓ Success" : "✗ Failed"}
                  </span>
                </div>
              ) : result.success ? (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className="text-sm font-medium text-white truncate flex-1 min-w-0"
                      title={result.filename || "Upload"}
                    >
                      {result.filename || "File uploaded"}
                    </p>
                    <span className="text-xs font-medium text-green-400 flex-shrink-0">
                      ✓ Success
                    </span>
                  </div>
                  {result.message && (
                    <p className="text-xs text-gray-400 mt-1">{result.message}</p>
                  )}
                </>
              ) : (
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">
                      {result.filename || "File"}
                    </p>
                    <span className="text-xs font-medium text-red-400">
                      {result.error || "✗ Error on upload"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
