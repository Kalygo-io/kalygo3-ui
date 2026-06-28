import { Dispatch, SetStateAction } from "react";
import { vectorStoresService } from "@/services/vectorStoresService";
import { FileUpload, UploadResult } from "@/components/shared/forms/file-upload";

interface Props {
  indexName: string;
  namespace: string;
  ownerAccountId?: number;
  files: File[] | null;
  setFiles: Dispatch<SetStateAction<File[] | null>>;
  onUploadSuccess?: () => void;
}

export function ChooseCsvFile(props: Props) {
  return (
    <FileUpload
      files={props.files}
      setFiles={props.setFiles}
      onUploadSuccess={props.onUploadSuccess}
      uploadFn={(file) =>
        vectorStoresService.uploadCsvFile(
          props.indexName,
          props.namespace,
          file,
          undefined,
          undefined,
          props.ownerAccountId
        ) as Promise<UploadResult>
      }
      accept=".csv"
      acceptedExtensions={[".csv"]}
      supportedFilesText="Supports .csv files"
      uploadButtonLabel="Upload to Knowledge Base"
      resultVariant="default"
    />
  );
}
