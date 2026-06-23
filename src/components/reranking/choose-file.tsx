import { Dispatch, SetStateAction } from "react";
import { callUploadRerankingData } from "@/services/callUploadRerankingData";
import { FileUpload, UploadResult } from "@/components/shared/forms/file-upload";

interface Props {
  files: File[] | null;
  setFiles: Dispatch<SetStateAction<File[] | null>>;
  onUploadSuccess?: () => void;
}

export function ChooseFile(props: Props) {
  return (
    <FileUpload
      files={props.files}
      setFiles={props.setFiles}
      onUploadSuccess={props.onUploadSuccess}
      uploadFn={(file) =>
        callUploadRerankingData(file) as unknown as Promise<UploadResult>
      }
      accept=".txt,.md"
      acceptedExtensions={[".txt", ".md"]}
      acceptedMimeTypes={["text/plain", "text/markdown"]}
      supportedFilesText="Supports .txt and .md files"
      uploadButtonLabel="Upload to Reranking Database"
      resultVariant="chunks"
    />
  );
}
