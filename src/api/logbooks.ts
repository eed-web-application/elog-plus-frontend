import { fetch } from ".";

let memoizedLogbooks: string[] | undefined;

export async function fetchLogbooks(): Promise<string[]> {
  // Since the logbooks should be static, we can memoize them
  if (memoizedLogbooks) {
    return memoizedLogbooks;
  }

  const data = await fetch("logbooks");
  memoizedLogbooks = data.logbook;
  return data.logbook;
}
