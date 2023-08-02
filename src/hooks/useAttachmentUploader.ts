import { useCallback, useState } from "react";
import { LocalUploadedAttachment } from "../draftsStore";
import { ServerError, uploadAttachment } from "../api";
import reportServerError from "../reportServerError";

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

      let id;
      try {
        id = await uploadAttachment(file);
      } catch (e) {
        if (!(e instanceof ServerError)) {
          throw e;
        }

        reportServerError("Could not upload attachment", e);
      }

      setUploading((attachments) =>
        attachments.filter((attachment) => attachment.fileName !== file.name)
      );
      if (id) {
        return { fileName: file.name, contentType: file.type, id };
      }
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
