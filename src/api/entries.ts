import { Attachment, fetch } from ".";

export interface EntrySummary {
  id: string;
  logbook: string;
  tags: string[];
  title: string;
  loggedBy: string;
  loggedAt: string;
  eventAt: string;
  shift: string;
}

export interface Entry extends EntrySummary {
  supersedeBy: string;
  text: string;
  attachments: Attachment[];
  followUp: EntrySummary[];
  history?: EntrySummary[];
  followingUp?: EntrySummary;
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
  entry.loggedAt = entry.loggedAt + "Z";
  entry.eventAt = entry.eventAt + "Z";

  if (
    new Date(entry.loggedAt).getTime() <
    new Date("2023-07-20T21:55:38.205Z").getTime()
  ) {
    entry.shift = "Morning shift";
  } else {
    entry.shift = "Day shift";
  }
  return entry;
}

export async function fetchEntries({
  startDate,
  endDate,
  limit,
  contextSize,
  search,
  logbooks = [],
  tags = [],
}: {
  startDate?: string;
  endDate?: string;
  limit?: number;
  contextSize?: number;
  search?: string;
  logbooks?: string[];
  tags?: string[];
}): Promise<EntrySummary[]> {
  const params: Record<string, string> = {
    logbooks: logbooks.join(","),
    tags: tags.join(","),
  };

  if (startDate) {
    // Now, we have to remove the z added by normalizeEntry
    params.startDate = startDate.split("Z")[0];
  }
  if (endDate) {
    params.endDate = endDate.split("Z")[0];
  }
  if (limit) {
    params.limit = limit.toString();
  }
  if (contextSize) {
    params.contextSize = contextSize.toString();
  }
  if (search) {
    params.textFilter = search;
  }

  const data = await fetch("entries", { params });
  return data.map(normalizeEntry);
}

export async function fetchEntry(id: string): Promise<Entry> {
  const data = await fetch(`entries/${id}`, {
    params: {
      includeFollowUps: "true",
      includeHistory: "true",
      includeFollowingUps: "true",
    },
  });

  data.followUp = data.followUp.map(normalizeEntry);
  return data;
}

export function createEntry(entry: EntryForm): Promise<string> {
  return fetch("entries", {
    method: "POST",
    body: entry,
  });
}

export function followUp(
  followingUp: string,
  entry: EntryForm
): Promise<string> {
  return fetch(`entries/${followingUp}/follow-ups`, {
    method: "POST",
    body: entry,
  });
}

export function supersede(
  superseding: string,
  entry: EntryForm
): Promise<string> {
  return fetch(`entries/${superseding}/supersede`, {
    method: "POST",
    body: entry,
  });
}
