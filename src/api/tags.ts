import { fetch } from ".";

export interface Tag {
  id: string;
  name: string;
}

export async function fetchTags(
  {
    logbooks,
  }: {
    logbooks: string[];
  } = { logbooks: [] }
): Promise<string[]> {
  const data = await fetch("v1/tags", {
    params: {
      logbooks: logbooks.join(","),
    },
  });
  const tags = data.map((tag: Tag) => tag.name);

  return tags;
}
