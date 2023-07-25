import { useCallback, useState } from "react";
import { LocalUploadedAttachment } from "../draftsStore";
import { uploadAttachment } from "../api";

/**
 * Attachment that hasn't been uploaded to the server yet (basically a file)
 */
export type LocalAttachment = {
  id?: string;
} & Omit<LocalUploadedAttachment, "id">;

export default function useAttachmentUploader() {
  const [uploading, setUploading] = useState<LocalAttachment[]>([]);

  const upload = useCallback(
    async (file: File): Promise<LocalUploadedAttachment | undefined> => {
      if (uploading.some((attachment) => attachment.fileName === file.name)) {
        // TODO: Don't use alert
        alert("Can't upload two files with the same name at the same time");
        return;
      }

      setUploading((attachments) => [
        ...attachments,
        { fileName: file.name, contentType: file.type },
      ]);

      const id = await uploadAttachment(file);

      setUploading((attachments) =>
        attachments.filter((attachment) => attachment.fileName !== file.name)
      );
      return { fileName: file.name, contentType: file.type, id };
    },
    [uploading, setUploading]
  );

  const cancel = useCallback(
    (filename: string) => {
      setUploading((uploading) =>
        uploading.filter((attachment) => attachment.fileName !== filename)
      );
    },
    [setUploading]
  );

  return { uploading, upload, cancel };
}
