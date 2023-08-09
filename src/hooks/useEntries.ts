import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchEntries } from "../api";

const ENTRIES_PER_PAGE = 25;

export interface EntryQuery {
  search: string;
  logbooks: string[];
  tags: string[];
  startDate: Date | null;
  endDate: Date | null;
  sortByLogDate: boolean;
}

export interface Params extends Partial<EntryQuery> {
  spotlight?: string;
  query: EntryQuery;
  onSpotlightFetched?: () => void;
}

/**
 * Manages fetching entries with filtering and spotlighting supporting
 * infnite scroll
 */
export default function useEntries({ spotlight, query }: Params) {
  // Since we want to include all the entries in the same day of the date
  // and the backend only returns entries before the date, we make sure the
  // date is at the end of the day
  if (query.endDate) {
    query = { ...query };
    query.endDate = new Date(query.endDate as Date);
    query.endDate.setUTCHours(23, 59, 59, 999);
  }

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isInitialLoading,
  } = useInfiniteQuery({
    queryKey: ["entries", query, spotlight],
    queryFn: async ({ pageParam, queryKey }) => {
      const query = queryKey[1] as EntryQuery;
      const spotlight = queryKey[2];

      return fetchEntries({
        ...query,
        startDate: query?.startDate || undefined,
        endDate: query?.endDate || undefined,
        anchorId: pageParam || spotlight,
        contextSize:
          pageParam === undefined && spotlight ? ENTRIES_PER_PAGE : 0,
        limit: ENTRIES_PER_PAGE,
      });
    },
    getNextPageParam: (lastPage) => {
      // If last page isn't full, then there is no next page.
      if (lastPage.length < ENTRIES_PER_PAGE) {
        return;
      }

      return lastPage[lastPage.length - 1]?.id;
    },
    // Using error boundary, because if we can't get entries, something
    // is really wrong, and thus we don't want to show anything that may be
    // invalid.
    useErrorBoundary: true,
  });

  return {
    entries: data?.pages.flat(),
    isLoading: isLoading || isFetchingNextPage,
    getMoreEntries: fetchNextPage,
    reachedBottom: !hasNextPage && !isInitialLoading,
  };
}
