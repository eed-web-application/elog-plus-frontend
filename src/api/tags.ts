import { LogbookSummary, fetch } from ".";

export interface Tag {
  id: string;
  name: string;
  logbook: LogbookSummary;
}

export async function fetchTags(
  {
    logbooks,
  }: {
    logbooks: string[];
  } = { logbooks: [] }
): Promise<Tag[]> {
  return fetch("v1/tags", {
    params: {
      logbooks: logbooks.join(","),
    },
  });
}

export async function createTag(logbookId: string, name: string) {
  return fetch(`v1/logbooks/${logbookId}/tags`, {
    method: "POST",
    body: {
      name,
    },
  });
}
