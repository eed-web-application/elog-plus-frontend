import { useInfiniteQuery, useQueries } from "@tanstack/react-query";
import { Entry, fetchEntries, fetchEntry } from "../api";
import { useFavoritesStore } from "../favoritesStore";
import { useMemo } from "react";

const CONTEXT_SIZE = 6;
const ENTRIES_PER_PAGE = 25;

export type EntryQuery = {
  search: string;
  logbooks: string[];
  tags: string[];
  requireAllTags: boolean;
  shifts: string[];
  startDate: Date | null;
  endDate: Date | null;
  sortByLogDate: boolean;
  onlyFavorites: boolean;
};

export interface Params extends Partial<EntryQuery> {
  enabled?: boolean;
  /**
   * Entry ID to base the rest of the query on (i.e., the anchor is always
   * loaded and the rest of the entries loaded are before or after it)
   */
  anchor?: string;
  query: EntryQuery;
  onSpotlightFetched?: () => void;
}

function useFavoriteEntries({
  favorites,
  enabled,
  sortByLogDate,
}: {
  favorites: string[];
  enabled: boolean;
  sortByLogDate: boolean;
}) {
  const queries = useQueries({
    queries: favorites.map((entryId) => ({
      queryKey: ["entry", entryId],
      queryFn: () => fetchEntry(entryId as string),
      enabled,
    })),
  });

  const isLoading = queries.some(({ isLoading }) => isLoading);

  const entries = queries.flatMap(({ data }) => data || []);

  const sortBy = sortByLogDate
    ? (entry: Entry) => entry.loggedAt
    : (entry: Entry) => entry.eventAt;

  entries.sort((a, b) => sortBy(b).getTime() - sortBy(a).getTime());

  return {
    entries,
    isLoading,
    reachedBottom: false,
    getMoreEntries: () => undefined,
  };
}

/**
 * Manages fetching entries with filtering and anchoringsupporting
 * infnite scroll
 */
export default function useEntries({ enabled, anchor, query }: Params) {
  // Since we want to include all the entries in the same day of the date
  // and the backend only returns entries before the date, we make sure the
  // date is at the end of the day
  if (query.endDate) {
    query = { ...query };
    query.endDate = new Date(query.endDate as Date);
    query.endDate.setUTCHours(23, 59, 59, 999);
  }

  const favorites = useFavoritesStore(({ favorites }) => favorites);

  const favoriteEntriesQuery = useFavoriteEntries({
    favorites: [...favorites],
    enabled: query.onlyFavorites && Boolean(enabled),
    sortByLogDate: query.sortByLogDate,
  });

  const key = {
    ...query,
    anchor: anchor || undefined,
    favorites: query.onlyFavorites ? favorites : undefined,
  };

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      enabled: !query.onlyFavorites && Boolean(enabled),
      queryKey: ["entries", key] as const,
      queryFn: async ({ pageParam, queryKey }) => {
        const query = queryKey[1];

        const entries = await fetchEntries({
          ...query,
          startDate: query?.startDate || undefined,
          endDate: query?.endDate || undefined,
          anchor: pageParam || query.anchor,
          contextSize:
            pageParam === undefined && query.anchor ? CONTEXT_SIZE : 0,
          limit: ENTRIES_PER_PAGE,
        });

        if (query.favorites) {
          const favorites = query.favorites;
          return entries.filter((entry) => favorites.has(entry.id));
        }

        // FIXME: Waiting on https://github.com/eed-web-application/elog-plus/issues/285
        if (query.shifts.length > 0) {
          return entries.filter((entry) =>
            entry.shifts.some((shift) => query.shifts.includes(shift.id)),
          );
        }

        return entries;
      },
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => {
        // If last page isn't full, then there is no next page.
        if (lastPage.length < ENTRIES_PER_PAGE) {
          return;
        }

        return lastPage[lastPage.length - 1]?.id;
      },
      // Throwing on error, because if we can't get entries, something
      // is really wrong, and thus we don't want to show anything that may be
      // invalid.
      throwOnError: true,
    });

  const entries = useMemo(() => data?.pages.flat(), [data?.pages]);

  if (query.onlyFavorites) {
    return favoriteEntriesQuery;
  }

  return {
    entries,
    isLoading: isLoading || isFetchingNextPage,
    getMoreEntries: fetchNextPage,
    reachedBottom: !hasNextPage && !isFetchingNextPage,
  };
}
