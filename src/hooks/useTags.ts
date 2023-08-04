import { useCallback, useEffect, useState } from "react";
import { useTagUsageStore } from "../tagUsageStore";
import { ServerError, fetchTags } from "../api";
import reportServerError from "../reportServerError";

export default function useTags({
  logbooks = [],
  lazy = false,
}: {
  logbooks?: string[];
  lazy?: boolean;
}) {
  const [tagsLoaded, setTagsLoaded] = useState<Record<string, string[]>>({});
  const [bumpTag, sortTagsByMostRecent] = useTagUsageStore((state) => [
    state.bump,
    state.sortByMostRecent,
  ]);

  const logbooksAsKey = logbooks.join(",");
  const hasTagsLoaded = logbooksAsKey in tagsLoaded;
  const tags = [...new Set(tagsLoaded[logbooksAsKey])];

  const fetch = useCallback(async () => {
    try {
      const tags = await fetchTags({ logbooks });

      setTagsLoaded((tagsLoaded) => ({
        ...tagsLoaded,
        [logbooksAsKey]: tags,
      }));
    } catch (e) {
      if (!(e instanceof ServerError)) {
        throw e;
      }
      reportServerError("Could not retrieve tags", e);
    }
  }, [logbooksAsKey, logbooks]);

  useEffect(() => {
    if (!lazy && !hasTagsLoaded) {
      fetch();
    }
  }, [fetch, lazy, hasTagsLoaded]);

  const loadInitial = useCallback(() => {
    if (!hasTagsLoaded) {
      fetch();
    }
  }, [hasTagsLoaded, fetch]);

  return {
    bumpTag,
    tags: sortTagsByMostRecent(tags),
    loadInitial,
    refresh: fetch,
  };
}
