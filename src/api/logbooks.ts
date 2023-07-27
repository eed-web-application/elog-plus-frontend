import { fetch } from ".";
import { Tag } from "./tags";

export interface Shift {
  id: string;
  name: string;
  from: string;
  to: string;
}

export interface Logbook {
  id: string;
  name: string;
  tags: Tag[];
  shifts: Shift[];
}

export interface LogbookUpdation extends Omit<Logbook, "tags" | "shifts"> {
  tags: (Omit<Tag, "id"> & Partial<Pick<Tag, "id">>)[];
  shifts: (Omit<Shift, "id"> & Partial<Pick<Shift, "id">>)[];
}

export async function fetchLogbooks(): Promise<Logbook[]> {
  return await fetch("logbooks");
}

export async function updateLogbook(logbook: LogbookUpdation) {
  return await fetch(`logbooks/${logbook.id}`, {
    method: "PUT",
    body: logbook,
  });
}
