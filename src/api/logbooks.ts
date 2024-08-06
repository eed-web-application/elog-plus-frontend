import { fetch } from ".";
import { Authorization } from "./authorizations";
import { Tag } from "./tags";

export interface Shift {
  id: string;
  name: string;
  from: string;
  to: string;
  logbook: LogbookSummary;
}

export interface LogbookSummary {
  id: string;
  name: string;
}

export interface Logbook extends LogbookSummary {
  tags: Tag[];
  shifts: Shift[];
}

export interface LogbookWithAuth extends Logbook {
  authorizations: Authorization[];
}

export interface LogbookUpdation extends Omit<Logbook, "tags" | "shifts"> {
  tags: (Pick<Tag, "name"> & Partial<Pick<Tag, "id">>)[];
  shifts: (Pick<Shift, "name" | "from" | "to"> & Partial<Pick<Shift, "id">>)[];
}

export async function fetchLogbooks<A extends boolean | undefined>({
  includeAuth = false,
  requireWrite = false,
}: {
  includeAuth?: A;
  requireWrite?: boolean;
} = {}): Promise<(A extends true ? LogbookWithAuth : Logbook)[]> {
  const params: Record<string, string> = {};

  if (includeAuth) {
    params.includeAuthorizations = "true";
  }

  params.filterForAuthorizationTypes = requireWrite ? "Write" : "Read";

  const logbooks = await fetch("v1/logbooks", {
    params,
  });

  return logbooks;
}

export function updateLogbook(logbook: LogbookUpdation) {
  return fetch(`v1/logbooks/${logbook.id}`, {
    method: "PUT",
    body: logbook,
  });
}

export function createLogbook(name: string) {
  return fetch(`v1/logbooks`, {
    method: "POST",
    body: { name },
  });
}
