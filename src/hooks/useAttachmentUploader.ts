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
  const [uploading, setUploading] = useState<Record<string, LocalAttachment>>(
    {}
  );

  const upload = useCallback(
    async (file: File): Promise<LocalUploadedAttachment | undefined> => {
      setUploading((attachments) => ({
        ...attachments,
        [file.name]: { fileName: file.name, contentType: file.type },
      }));

      let id;
      try {
        id = await uploadAttachment(file);
      } catch (e) {
        if (!(e instanceof ServerError)) {
          throw e;
        }

        reportServerError("Could not upload attachment", e);
      }

      setUploading(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ({ [file.name]: _removed, ...uploading }) => uploading
      );
      if (id) {
        return { fileName: file.name, contentType: file.type, id };
      }
    },
    [setUploading]
  );

  const cancel = useCallback(
    (filename: string) => {
      setUploading(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ({ [filename]: _removed, ...uploading }) => uploading
      );
    },
    [setUploading]
  );

  return { uploading: Object.values(uploading), upload, cancel };
}
