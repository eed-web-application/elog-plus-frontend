import { Attachment, fetch } from ".";

export interface EntrySummary {
  id: string;
  logbook: string;
  tags: string[];
  title: string;
  loggedBy: string;
  loggedAt: Date;
  eventAt: Date;
  shift: string;
}

export interface Entry extends EntrySummary {
  supersedeBy: string;
  text: string;
  attachments: Attachment[];
  followUps: EntrySummary[];
  history?: EntrySummary[];
  followingUp?: EntrySummary;
}

export interface EntryNew {
  title: string;
  text: string;
  logbook: string;
  tags: string[];
  attachments: string[];
  eventAt?: Date;
  summarizes?: {
    shift: string;
    date: string;
  };
}

function normalizeEntry<E extends Entry | EntrySummary>(entry: E): E {
  // Java is weird and doesn't add the Z at the end of its dates, so this is
  // what we gotta do
  entry.loggedAt = new Date(entry.loggedAt + "Z");
  entry.eventAt = new Date(entry.eventAt + "Z");

  if ("text" in entry) {
    if (entry.followUps) {
      entry.followUps = entry.followUps.map(normalizeEntry);
    }
    entry.history = entry.history
      ? entry.history.map(normalizeEntry)
      : undefined;
    entry.followingUp = entry.followingUp
      ? normalizeEntry(entry.followingUp)
      : undefined;
  }

  return entry;
}

export async function fetchEntries({
  startDate,
  endDate,
  limit,
  contextSize,
  search,
  sortByLogDate = false,
  logbooks = [],
  tags = [],
  anchorId,
}: {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  contextSize?: number;
  search?: string;
  sortByLogDate?: boolean;
  logbooks?: string[];
  tags?: string[];
  anchorId?: string;
}): Promise<EntrySummary[]> {
  const params: Record<string, string> = {
    logbooks: logbooks.join(","),
    tags: tags.join(","),
  };

  if (startDate) {
    params.startDate = startDate.toISOString().slice(0, -1);
  }
  if (endDate) {
    params.endDate = endDate.toISOString().slice(0, -1);
  }
  if (limit) {
    params.limit = limit.toString();
  }
  if (contextSize) {
    params.contextSize = contextSize.toString();
  }
  if (search) {
    params.search = search;
  }
  if (sortByLogDate) {
    params.sortByLogDate = "true";
  }
  if (anchorId) {
    params.anchorId = anchorId;
  }
  const data = await fetch("v1/entries", { params });
  return data.map(normalizeEntry);
}

export async function fetchEntry(id: string): Promise<Entry> {
  const data = await fetch(`v1/entries/${id}`, {
    params: {
      includeFollowUps: "true",
      includeHistory: "true",
      includeFollowingUps: "true",
    },
  });

  const entry: Entry = normalizeEntry(data);
  return entry;
}

export function createEntry(entry: EntryNew): Promise<string> {
  return fetch("v1/entries", {
    method: "POST",
    body: entry.eventAt
      ? { ...entry, eventAt: entry.eventAt.toISOString() }
      : entry,
  });
}

export function followUp(
  followingUp: string,
  entry: EntryNew
): Promise<string> {
  return fetch(`v1/entries/${followingUp}/follow-ups`, {
    method: "POST",
    body: entry,
  });
}

export function supersede(
  superseding: string,
  entry: EntryNew
): Promise<string> {
  return fetch(`v1/entries/${superseding}/supersede`, {
    method: "POST",
    body: entry,
  });
}
