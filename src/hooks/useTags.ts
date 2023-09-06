import { useTagUsageStore } from "../tagUsageStore";
import { LogbookSummary, ServerError, Tag, fetchTags } from "../api";
import reportServerError from "../reportServerError";
import { useQuery } from "@tanstack/react-query";

/**
 * Retrieve tags based on the logbooks provided. Will prefix tags with the
 * logbook name if there are multiple tags with the same name.
 */
export default function useTags({
  logbooks = [],
  enabled = true,
}: {
  logbooks?: LogbookSummary[];
  enabled?: boolean;
} = {}) {
  const bumpTag = useTagUsageStore((state) => state.bump);
  const sortTagsByMostRecent = useTagUsageStore(
    (state) => state.sortByMostRecent
  );

  const { data, isLoading } = useQuery({
    queryKey: ["tags", logbooks],
    queryFn: () => fetchTags({ logbooks: logbooks.map(({ id }) => id) }),
    enabled: enabled,
    staleTime: 5 * 60 * 1000,
    onError: (e) => {
      if (!(e instanceof ServerError)) {
        throw e;
      }
      reportServerError("Could not retrieve tags", e);
    },
    select: (tags) => {
      const tagMap = tags.reduce<Record<string, Tag>>((acc, tag) => {
        acc[tag.id] = tag;
        return acc;
      }, {});

      return { tags, tagMap };
    },
  });

  const tags = sortTagsByMostRecent(data?.tags || []);

  return {
    tags,
    tagMap: data?.tagMap || {},
    isLoading,
    bumpTag,
  };
}
