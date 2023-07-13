import { fetch } from ".";

export interface Logbook {
  id: string;
  name: string;
}

let memoizedLogbooks: string[] | undefined;

export async function fetchLogbooks(): Promise<string[]> {
  // Since the logbooks should be static, we can memoize them
  if (memoizedLogbooks) {
    return memoizedLogbooks;
  }

  const data = await fetch("logbooks");
  const logbookNames = data.map((logbook: Logbook) => logbook.name);
  memoizedLogbooks = logbookNames;
  return logbookNames;
}
