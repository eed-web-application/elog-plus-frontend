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
