import { useTagUsageStore } from "../tagUsageStore";
import { ServerError, Tag, fetchTags } from "../api";
import reportServerError from "../reportServerError";
import { useQuery } from "@tanstack/react-query";

export default function useTags({
  logbooks = [],
  enabled = true,
}: {
  logbooks?: string[];
  enabled?: boolean;
}) {
  const [bumpTag, sortTagsByMostRecent] = useTagUsageStore((state) => [
    state.bump,
    state.sortByMostRecent,
  ]);

  const { data, isLoading } = useQuery({
    queryKey: ["tags", logbooks],
    queryFn: () => fetchTags({ logbooks }),
    enabled: enabled,
    staleTime: 5 * 60 * 1000,
    onError: (e) => {
      if (!(e instanceof ServerError)) {
        throw e;
      }
      reportServerError("Could not retrieve tags", e);
    },
    select: (tags) => {
      const tagMap = tags.reduce<Record<string, Tag>>((acc, logbook) => {
        acc[logbook.id] = logbook;
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
