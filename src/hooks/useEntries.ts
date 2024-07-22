import { useInfiniteQuery, useQueries } from "@tanstack/react-query";
import { Entry, fetchEntries, fetchEntry } from "../api";
import { useFavoritesStore } from "../favoritesStore";
import { useMemo } from "react";

const CONTEXT_SIZE = 6;
const ENTRIES_PER_PAGE = 10;

export type EntryQuery = {
  search: string;
  logbooks: string[];
  tags: string[];
  requireAllTags: boolean;
  startDate: Date | null;
  endDate: Date | null;
  sortByLogDate: boolean;
  onlyFavorites: boolean;
};

export interface Params extends Partial<EntryQuery> {
  spotlight?: string;
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

  const favorites = useFavoritesStore(({ favorites }) => favorites);

  const favoriteEntriesQuery = useFavoriteEntries({
    favorites: [...favorites],
    enabled: query.onlyFavorites,
    sortByLogDate: query.sortByLogDate,
  });

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isInitialLoading,
  } = useInfiniteQuery({
    enabled: !query.onlyFavorites,
    queryKey: ["entries", query, spotlight],
    queryFn: async ({ pageParam, queryKey }) => {
      const query = queryKey[1] as EntryQuery;
      const spotlight = queryKey[2];

      const entries = await fetchEntries({
        ...query,
        startDate: query?.startDate || undefined,
        endDate: query?.endDate || undefined,
        anchor: pageParam || spotlight,
        contextSize: pageParam === undefined && spotlight ? CONTEXT_SIZE : 0,
        limit: ENTRIES_PER_PAGE,
      });

      if (query.onlyFavorites) {
        return entries.filter((entry) => favorites.has(entry.id));
      }

      return entries;
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

  const entries = useMemo(() => data?.pages.flat(), [data?.pages]);

  if (query.onlyFavorites) {
    return favoriteEntriesQuery;
  }

  return {
    entries,
    isLoading: isLoading || isFetchingNextPage,
    getMoreEntries: fetchNextPage,
    reachedBottom: !hasNextPage && !isInitialLoading,
  };
}
