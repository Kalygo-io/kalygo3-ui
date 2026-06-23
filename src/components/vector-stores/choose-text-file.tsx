import { Dispatch, SetStateAction } from "react";
import { vectorStoresService } from "@/services/vectorStoresService";
import { FileUpload, UploadResult } from "@/components/shared/forms/file-upload";

interface Props {
  indexName: string;
  namespace: string;
  files: File[] | null;
  setFiles: Dispatch<SetStateAction<File[] | null>>;
  onUploadSuccess?: () => void;
}

export function ChooseTextFile(props: Props) {
  return (
    <FileUpload
      files={props.files}
      setFiles={props.setFiles}
      onUploadSuccess={props.onUploadSuccess}
      uploadFn={(file) =>
        vectorStoresService.uploadTextFile(
          props.indexName,
          props.namespace,
          file
        ) as Promise<UploadResult>
      }
      accept=".txt,.md"
      acceptedExtensions={[".txt", ".md"]}
      acceptedMimeTypes={["text/plain", "text/markdown"]}
      supportedFilesText="Supports .txt and .md files"
      uploadButtonLabel="Upload to Knowledge Base"
      resultVariant="default"
    />
  );
}
