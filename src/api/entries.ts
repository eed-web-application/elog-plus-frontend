import {
  Attachment,
  LogbookSummary,
  NotFoundError,
  Shift,
  Tag,
  fetch,
} from ".";
import serializeParams, { ParamsObject } from "../utils/serializeParams";

interface EntrySummary {
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

export interface EntryFull
  extends Omit<EntrySummary, "followingUp" | "referencedBy"> {
  supersedeBy: string;
  text: string;
  followUps: Entry[];
  history?: Entry[];
  followingUp?: Entry;
  referencedBy?: Entry[];
  referencesInBody: boolean;
}

export type Entry = EntrySummary | EntryFull;

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

function normalizeEntry<E extends Entry>(entry: E): E {
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

export type EntriesQuery = {
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
};

export async function fetchEntries(
  query: EntriesQuery
): Promise<EntrySummary[]> {
  console.log(query);
  const params: ParamsObject = Object.assign(
    {
      sortByLogDate: false,
      logbooks: [],
      tags: [],
    },
    query
  );

  // Remove Z (see normalizeEntry function)
  if (query.startDate) {
    params.startDate = query.startDate.toISOString().slice(0, -1);
  }
  if (query.endDate) {
    params.endDate = query.endDate.toISOString().slice(0, -1);
  }

  const data = await fetch("v1/entries", { params: serializeParams(params) });
  return data.map(normalizeEntry);
}

export async function fetchEntry(id: string): Promise<EntryFull> {
  const data = (await fetch(`v1/entries/${id}`, {
    params: {
      includeFollowUps: "true",
      includeHistory: "true",
      includeFollowingUps: "true",
      includeReferencedBy: "true",
    },
  })) as EntryFull;

  const entry = normalizeEntry(data);
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
