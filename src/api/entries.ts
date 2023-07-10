import { Attachment, fetch } from ".";

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
  history?: EntrySummary[];
}

export interface EntryForm {
  title: string;
  text: string;
  logbook: string;
  tags: string[];
  attachments: string[];
}

// Java is weird and doesn't add the Z at the end of its dates, so this is
// what we gotta do
function normalizeEntry(entry: EntrySummary) {
  entry.logDate = entry.logDate + "Z";
  return entry;
}

export async function fetchEntries({
  logbooks = [],
  anchorDate,
  numberBeforeAnchor,
  numberAfterAnchor,
  search,
  tags = [],
}: {
  logbooks?: string[];
  anchorDate?: string;
  numberBeforeAnchor?: number;
  numberAfterAnchor: number;
  search?: string;
  tags?: string[];
}): Promise<EntrySummary[]> {
  const params: Record<string, string> = {
    logbook: logbooks.join(","),
    logsAfter: numberAfterAnchor.toString(),
    tags: tags.join(","),
  };

  if (anchorDate) {
    // Now, we have to remove the z added by normalizeEntry
    params.anchorDate = anchorDate.split("Z")[0];
  }
  if (numberBeforeAnchor) {
    params.logsBefore = numberBeforeAnchor.toString();
  }
  if (search) {
    params.textFilter = search;
  }

  const data = await fetch(`logs`, { params });
  return data.map(normalizeEntry);
}

export async function fetchEntry(id: string): Promise<Entry> {
  const data = await fetch(`logs/${id}`, {
    params: { includeFollowUps: "true", includeHistory: "true" },
  });

  data.followUp = data.followUp.map(normalizeEntry);
  return data;
}

export function createEntry(entry: EntryForm): Promise<string> {
  return fetch("logs", {
    method: "POST",
    body: entry,
  });
}

export function followUp(
  followingUp: string,
  entry: EntryForm
): Promise<string> {
  return fetch(`logs/${followingUp}/follow-up`, {
    method: "POST",
    body: entry,
  });
}

export function supersede(
  superseding: string,
  entry: EntryForm
): Promise<string> {
  return fetch(`logs/${superseding}/supersede`, {
    method: "POST",
    body: entry,
  });
}
