import { fetch } from ".";
import { MOCK_GROUPS } from "./groups";
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

export interface Permissions {
  read: boolean;
  write: boolean;
}

export interface GroupPermission {
  group: string;
  permissions: Permissions;
}

export type Permission = GroupPermission;

export interface Logbook extends LogbookSummary {
  tags: Tag[];
  shifts: Shift[];
  permissions: Permission[];
}

export interface LogbookUpdation extends Omit<Logbook, "tags" | "shifts"> {
  tags: (Pick<Tag, "name"> & Partial<Pick<Tag, "id">>)[];
  shifts: (Pick<Shift, "name" | "from" | "to"> & Partial<Pick<Shift, "id">>)[];
}

// FIXME:
function mockPermissions(logbook: Logbook): Logbook {
  logbook.permissions = [];
  for (let i = 0; i < 3; i++) {
    logbook.permissions.push({
      group: MOCK_GROUPS[i],
      permissions: { read: Math.random() > 0.5, write: Math.random() > 0.5 },
    });
  }

  return logbook;
}

export async function fetchLogbooks(): Promise<Logbook[]> {
  return (await fetch("v1/logbooks")).map(mockPermissions);
}

export async function updateLogbook(logbook: LogbookUpdation) {
  return await fetch(`v1/logbooks/${logbook.id}`, {
    method: "PUT",
    body: logbook,
  });
}

export async function createLogbook(name: string) {
  return await fetch(`v1/logbooks`, {
    method: "POST",
    body: { name },
  });
}
