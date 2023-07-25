import { fetch } from ".";
import { Tag } from "./tags";

export interface Logbook {
  id: string;
  name: string;
  tags: Tag[];
}

export async function fetchLogbooks(): Promise<Logbook[]> {
  return await fetch("logbooks");
}
