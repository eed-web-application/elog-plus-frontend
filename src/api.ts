const ENDPOINT = "/api/v1";
// const ENDPOINT = "http://eed-fpga.slac.stanford.edu:8081/v1";

function fetch(url: string, options: RequestInit = {}) {
  return window.fetch(`${ENDPOINT}/${url}`, options);
}

let logbooks: string[] | undefined;

export interface EntrySummary {
  id: string;
  logbook: string;
  tags: string[];
  title: string;
  author: string;
  logDate: string;
}

export interface Entry extends EntrySummary {
  supersedeBy: string;
  text: string;
  attachments: string[];
}

export async function fetchLogbooks(): Promise<string[]> {
  // Since the logbooks should be static, we can memoize them
  if (logbooks) {
    return logbooks;
  }

  const res = await fetch("logbooks");
  const data = await res.json();
  logbooks = data.payload.logbook;
  return data.payload.logbook;
}

export async function fetchEntries(
  logbooks: string[] = []
): Promise<EntrySummary[]> {
  const res = await fetch(
    `logs?${new URLSearchParams({
      page: "1",
      size: "25",
      logbook: logbooks.join(","),
    }).toString()}`
  );
  const data = await res.json();
  return data.payload.content;
}

export async function fetchEntry(id: string): Promise<Entry> {
  const res = await fetch(`logs/${id}`);
  const data = await res.json();
  return data.payload;
}
