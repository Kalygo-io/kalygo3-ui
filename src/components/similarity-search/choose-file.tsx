import { Dispatch, SetStateAction } from "react";
import { callUploadKnowledgeForSimilaritySearch } from "@/services/callUploadKnowledgeForSimilaritySearch";
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
        callUploadKnowledgeForSimilaritySearch(
          file
        ) as unknown as Promise<UploadResult>
      }
      accept=".csv"
      acceptedExtensions={[".csv"]}
      supportedFilesText="Supports .csv files"
      uploadButtonLabel="Upload to Knowledge Base"
      resultVariant="default"
    />
  );
}
