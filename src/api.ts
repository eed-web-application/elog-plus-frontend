const ENDPOINT = "/api/v1";
// const ENDPOINT = "http://eed-fpga.slac.stanford.edu:8081/v1";

function fetch(url: string, options: RequestInit = {}) {
  return window.fetch(`${ENDPOINT}/${url}`, options);
}

let memoizedLogbooks: string[] | undefined;
let memoizedTags: string[] | undefined;

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

export interface EntrySummary {
  id: string;
  logbook: string;
  tags: string[];
  title: string;
  author: string;
  logDate: string;
}

export interface Entry extends EntrySummary {
  supersedeBy: string;
  text: string;
  attachments: Attachment[];
  followUp: EntrySummary[];
}

export interface EntryForm {
  title: string;
  text: string;
  logbook: string;
  tags: string[];
  attachments: string[];
}

// Java is weird and doesn't add the z at the end of its dates, so this is
// what we gotta do
function normalizeEntry(entry: EntrySummary) {
  entry.logDate = entry.logDate + "Z";
  return entry;
}

export async function fetchLogbooks(): Promise<string[]> {
  // Since the logbooks should be static, we can memoize them
  if (memoizedLogbooks) {
    return memoizedLogbooks;
  }

  const res = await fetch("logbooks");
  const data = await res.json();
  memoizedLogbooks = data.payload.logbook;
  return data.payload.logbook;
}

export async function fetchTags(): Promise<string[]> {
  if (memoizedTags) {
    return memoizedTags;
  }

  const res = await fetch("logs/tags");
  const data = await res.json();
  memoizedTags = data.payload;
  return data.payload;
}

export async function fetchEntries({
  logbooks = [],
  anchorDate,
  numberBeforeAnchor,
  numberAfterAnchor,
}: {
  logbooks?: string[];
  anchorDate?: string;
  numberBeforeAnchor?: number;
  numberAfterAnchor: number;
}): Promise<EntrySummary[]> {
  const params: Record<string, string> = {
    logbook: logbooks.join(","),
    logsAfter: numberAfterAnchor.toString(),
  };

  if (anchorDate) {
    // Now, we have to remove the z added by normalizeEntry
    params.anchorDate = anchorDate.split("Z")[0];
  }
  if (numberBeforeAnchor) {
    params.logsBefore = numberBeforeAnchor.toString();
  }

  const res = await fetch(`logs?${new URLSearchParams(params).toString()}`);
  const data = await res.json();
  console.log(data.payload);
  return data.payload.map(normalizeEntry);
}

export async function fetchEntry(id: string): Promise<Entry> {
  const res = await fetch(`logs/${id}?includeFollowUps=true`);
  const data = await res.json();
  data.payload.followUp = data.payload?.followUp.map(normalizeEntry);
  return data.payload;
}

export async function createEntry(entry: EntryForm): Promise<string> {
  const res = await fetch("logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  const data = await res.json();
  return data.payload;
}

export async function followUp(
  followingUp: string,
  entry: EntryForm
): Promise<string> {
  const res = await fetch(`logs/${followingUp}/follow-up`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  const data = await res.json();
  return data.payload;
}

export async function supersede(
  superseding: string,
  entry: EntryForm
): Promise<string> {
  const res = await fetch(`logs/${superseding}/supersede`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  const data = await res.json();
  return data.payload;
}

export async function uploadAttachment(file: File) {
  const formData = new FormData();

  formData.append("uploadFile", file);

  const res = await fetch("attachment", {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  return data.payload;
}

export function getAttachmentPreviewURL(id: string) {
  return `${ENDPOINT}/attachment/${id}/preview.jpg`;
}

export function getAttachmentDownloadURL(id: string) {
  return `${ENDPOINT}/attachment/${id}/download`;
}
