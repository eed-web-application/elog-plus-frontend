import { fetch } from ".";

export interface Tag {
  id: string;
  name: string;
}

let memoizedTags: string[] | undefined;

export async function createTag(tag: string) {
  await fetch("tags", {
    method: "POST",
    body: { name: tag },
  });
}

export async function fetchTags(): Promise<string[]> {
  if (memoizedTags) {
    return memoizedTags;
  }

  const data = await fetch("tags");
  const tags = data.map((tag: Tag) => tag.name);
  memoizedTags = tags;
  return tags;
}
