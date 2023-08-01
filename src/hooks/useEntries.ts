import { useCallback, useEffect, useState } from "react";
import { EntrySummary, fetchEntries } from "../api";
import { useEntriesStore } from "../entriesStore";

const ENTRIES_PER_FETCH = 25;

export interface EntryQuery {
  // TODO: Instead of using sentinel values, use null
  search: string;
  logbooks: string[];
  tags: string[];
  startDate: Date | null;
  endDate: Date | null;
  sortByLogDate: boolean;
}

export interface Params extends Partial<EntryQuery> {
  spotlight?: string;
  onSpotlightFetched?: () => void;
}

/**
 * Manages fetching entries with filtering and spotlighting supporting
 * infnite scroll
 */
export default function useEntries({
  spotlight,
  search,
  logbooks,
  tags,
  startDate,
  endDate,
  sortByLogDate,
  onSpotlightFetched,
}: Params) {
  const [entries, setEntries] = useState<EntrySummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [reachedBottom, setReachedBottom] = useState<boolean>(false);
  const getOrFetch = useEntriesStore((state) => state.getOrFetch);

  const fetchSurroundingSpotlight = useCallback(async () => {
    setIsLoading(true);
    setEntries([]);

    const spotlightEntry = await getOrFetch(spotlight as string);

    const endDate = spotlightEntry.loggedAt;

    // TODO: Error handling
    const newEntries = await fetchEntries({
      startDate: startDate || undefined,
      endDate,
      contextSize: ENTRIES_PER_FETCH,
      limit: ENTRIES_PER_FETCH,
      sortBy: sortByLogDate ? "loggedAt" : undefined,
    });

    setIsLoading(false);
    setEntries(newEntries);
  }, [spotlight, getOrFetch, startDate, sortByLogDate]);

  useEffect(() => {
    if (
      spotlight &&
      !isLoading &&
      entries.every((entry) => entry.id !== spotlight)
    ) {
      fetchSurroundingSpotlight();
      onSpotlightFetched?.();
    }
  }, [
    fetchSurroundingSpotlight,
    isLoading,
    spotlight,
    entries,
    onSpotlightFetched,
  ]);

  const refreshEntries = useCallback(async () => {
    setIsLoading(true);
    setEntries([]);

    let dateDayEnd;
    if (endDate) {
      dateDayEnd = new Date(endDate);
      // Since we want to include all the entries in the same day of the date
      // and the backend only returns entries before the date, we make sure the
      // date is at the end of the day
      dateDayEnd.setUTCHours(23, 59, 59, 999);
    }

    const newEntries = await fetchEntries({
      search,
      logbooks,
      tags,
      startDate: startDate || undefined,
      endDate: dateDayEnd,
      limit: ENTRIES_PER_FETCH,
      sortBy: sortByLogDate ? "loggedAt" : undefined,
    });

    setIsLoading(false);
    setEntries(newEntries);

    if (newEntries.length !== ENTRIES_PER_FETCH) {
      setReachedBottom(true);
    }
  }, [
    search,
    logbooks,
    tags,
    startDate,
    endDate,
    sortByLogDate,
    setIsLoading,
    setEntries,
  ]);

  const getMoreEntries = useCallback(async () => {
    if (entries.length > 0 && !isLoading) {
      setIsLoading(true);

      const newEntries = await fetchEntries({
        logbooks,
        tags,
        search,
        endDate: entries[entries.length - 1].loggedAt,
        limit: ENTRIES_PER_FETCH,
        sortBy: sortByLogDate ? "loggedAt" : undefined,
      });

      if (newEntries.length !== ENTRIES_PER_FETCH) {
        setReachedBottom(true);
      }

      setIsLoading(false);
      setEntries((entries) => entries.concat(newEntries));
    }
  }, [search, logbooks, tags, sortByLogDate, entries, isLoading]);

  useEffect(() => {
    refreshEntries();
    setReachedBottom(false);
  }, [refreshEntries]);

  return { entries, isLoading, refreshEntries, getMoreEntries, reachedBottom };
}
