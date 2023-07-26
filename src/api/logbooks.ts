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

export async function fetchLogbooks(): Promise<Logbook[]> {
  return await fetch("logbooks");
}

export async function updateLogbookShifts(
  logbookId: string,
  shifts: (
    | Omit<Shift, "id">
    | (Partial<Omit<Shift, "id">> & Pick<Shift, "id">)
  )[]
): Promise<void> {
  return await fetch(`logbooks/${logbookId}/shifts`, {
    method: "PUT",
    body: shifts,
  });
}
