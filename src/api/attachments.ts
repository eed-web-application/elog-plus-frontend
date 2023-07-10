import { ENDPOINT, fetch } from ".";

export interface Attachment {
  id: string;
  fileName: string;
  contentType: string;
  previewState:
    | "Waiting"
    | "Processing"
    | "Error"
    | "PreviewNotAvailable"
    | "Completed";
}

export function uploadAttachment(file: File) {
  const formData = new FormData();

  formData.append("uploadFile", file);

  return fetch("attachment", {
    method: "POST",
    formData,
  });
}

export function getAttachmentPreviewURL(id: string) {
  return `${ENDPOINT}/attachment/${id}/preview.jpg`;
}

export function getAttachmentDownloadURL(id: string) {
  return `${ENDPOINT}/attachment/${id}/download`;
}
