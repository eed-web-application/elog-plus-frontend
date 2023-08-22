import { Tag } from "../api";

/**
 * Returns an array of tag names to display for a given array of tags.
 * If the logbook count is 1, then all the tag names are returned without
 * modification. If the logbook count is greater than 1, then the logbook name
 * is prepended to each tag name if the tag is not common among all logbooks.
 */
export default function useDisplayTags(
  tags: Tag[],
  logbookCount: number
): string[] {
  if (logbookCount === 1) {
    return tags.map((tag) => tag.name);
  }

  const tagNameCount: Record<string, number> = {};
  const tagNames = [];
  const displayedAlready = new Set();

  for (const tag of tags) {
    if (tag.name in tagNameCount) {
      tagNameCount[tag.name] += 1;
    } else {
      tagNameCount[tag.name] = 1;
    }
  }

  for (const tag of tags) {
    if (displayedAlready.has(tag.name)) {
      continue;
    }

    if (tagNameCount[tag.name] === logbookCount) {
      tagNames.push(tag.name);
      displayedAlready.add(tag.name);
    } else {
      tagNames.push(`${tag.logbook.name.toUpperCase()}:${tag.name}`);
    }
  }

  return tagNames;
}
