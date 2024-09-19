import { Tag } from "../api";

/**
 * Returns an array of tag labels to display for a given array of tags.
 * If the logbook count is 1, then all the tag names are returned without
 * modification. If the logbook count is greater than 1, then the logbook name
 * is prepended to each tag name if the tag is not common among all logbooks.
 */
export default function useDisplayTags(
  tags: Tag[],
  logbookCount: number,
): { label: string; ids: string[] }[] {
  if (logbookCount === 1) {
    return tags.map((tag) => ({ label: tag.name, ids: [tag.id] }));
  }

  const tagNameCount: Record<string, string[]> = {};
  const tagNames = [];
  const displayedAlready = new Set();

  for (const tag of tags) {
    if (tag.name in tagNameCount) {
      tagNameCount[tag.name].push(tag.id);
    } else {
      tagNameCount[tag.name] = [tag.id];
    }
  }

  for (const tag of tags) {
    if (displayedAlready.has(tag.name)) {
      continue;
    }

    if (tagNameCount[tag.name].length === logbookCount) {
      tagNames.push({ label: tag.name, ids: tagNameCount[tag.name] });
      displayedAlready.add(tag.name);
    } else {
      tagNames.push({
        label: `${tag.logbook.name.toUpperCase()}:${tag.name}`,
        ids: [tag.id],
      });
    }
  }

  return tagNames;
}
