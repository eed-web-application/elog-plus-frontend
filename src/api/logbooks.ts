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

export interface Logbook extends LogbookSummary {
  tags: Tag[];
  shifts: Shift[];
}

export interface LogbookUpdation extends Omit<Logbook, "tags" | "shifts"> {
  tags: (Pick<Tag, "name"> & Partial<Pick<Tag, "id">>)[];
  shifts: (Pick<Shift, "name" | "from" | "to"> & Partial<Pick<Shift, "id">>)[];
}

export async function fetchLogbooks(): Promise<Logbook[]> {
  return await fetch("v1/logbooks");
}

export async function updateLogbook(logbook: LogbookUpdation) {
  return await fetch(`v1/logbooks/${logbook.id}`, {
    method: "PUT",
    body: logbook,
  });
}
