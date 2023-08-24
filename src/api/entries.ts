import {
  Attachment,
  LogbookSummary,
  NotFoundError,
  Shift,
  Tag,
  fetch,
} from ".";

export interface EntrySummary {
  id: string;
  logbooks: LogbookSummary[];
  tags: Tag[];
  title: string;
  loggedBy: string;
  loggedAt: Date;
  eventAt: Date;
  attachments: Attachment[];
  shifts: Shift[];
  followingUp?: string;
  references: string[];
  referencedBy: string[];
}

export interface Entry
  extends Omit<EntrySummary, "followingUp" | "referencedBy"> {
  supersedeBy: string;
  text: string;
  followUps: EntrySummary[];
  history?: EntrySummary[];
  followingUp?: EntrySummary;
  referencedBy?: EntrySummary[];
  referencesInBody: boolean;
}

export interface EntryNew {
  title: string;
  text: string;
  logbooks: string[];
  tags: string[];
  attachments: string[];
  eventAt?: Date;
  summarizes?: {
    shiftId: string;
    date: string;
  };
}

function normalizeEntry<E extends Entry | EntrySummary>(entry: E): E {
  // Java is weird and doesn't add the Z at the end of its dates, so this is
  // what we gotta do
  entry.loggedAt = new Date(entry.loggedAt + "Z");
  entry.eventAt = new Date(entry.eventAt + "Z");

  entry.attachments = entry.attachments || [];

  if ("text" in entry) {
    if (entry.followUps) {
      entry.followUps = entry.followUps.map(normalizeEntry);
    }
    entry.history = entry.history
      ? entry.history.map(normalizeEntry)
      : undefined;
    entry.referencedBy = entry.referencedBy
      ? entry.referencedBy.map(normalizeEntry)
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
  requireAllTags,
  anchorId,
  hideSummaries,
}: {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  contextSize?: number;
  search?: string;
  sortByLogDate?: boolean;
  logbooks?: string[];
  tags?: string[];
  requireAllTags?: boolean;
  anchorId?: string;
  hideSummaries?: boolean;
}): Promise<EntrySummary[]> {
  // await new Promise((res) => setTimeout(res, 1000));
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
  if (hideSummaries) {
    params.hideSummaries = "true";
  }
  if (requireAllTags) {
    params.requireAllTags = "true";
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
      includeReferencedBy: "true",
    },
  });

  const entry: Entry = normalizeEntry(data);
  return entry;
}

export async function fetchReferences(id: string): Promise<EntrySummary[]> {
  const entries = await fetch(`v1/entries/${id}/references`);

  return entries.map(normalizeEntry);
}

export function fetchShiftSummary(
  shiftId: string,
  date: string
): Promise<string | undefined> {
  return fetch(`v1/entries/${shiftId}/summaries/${date}`).catch((e) => {
    if (e instanceof NotFoundError) {
      return;
    }
    throw e;
  });
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
