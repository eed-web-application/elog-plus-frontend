import { fetch } from ".";
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

export type AuthorizationPermission = "Read" | "Write" | "Admin";

export interface LogbookAuthorization {
  id: string;
  permission: AuthorizationPermission;
  owner: string;
  ownerType: "User" | "Group" | "Application";
}

export interface Logbook extends LogbookSummary {
  tags: Tag[];
  shifts: Shift[];
}

export interface LogbookWithAuth extends Logbook {
  authorizations: LogbookAuthorization[];
}

export interface LogbookUpdation extends Omit<Logbook, "tags" | "shifts"> {
  tags: (Pick<Tag, "name"> & Partial<Pick<Tag, "id">>)[];
  shifts: (Pick<Shift, "name" | "from" | "to"> & Partial<Pick<Shift, "id">>)[];
  authorization: (Pick<
    LogbookAuthorization,
    "owner" | "ownerType" | "permission"
  > &
    Partial<Pick<LogbookAuthorization, "id">>)[];
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

  return await fetch("v1/logbooks", {
    params,
  });
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
