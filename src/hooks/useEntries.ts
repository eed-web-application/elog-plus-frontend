import { useCallback, useEffect, useState } from "react";
import { EntrySummary, ServerError, fetchEntries } from "../api";
import reportServerError from "../reportServerError";

const ENTRIES_PER_FETCH = 25;

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
  onSpotlightFetched?: () => void;
  hideSummaries?: boolean;
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
  hideSummaries,
}: Params) {
  const [entries, setEntries] = useState<EntrySummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [reachedBottom, setReachedBottom] = useState<boolean>(false);

  // Since we want to include all the entries in the same day of the date
  // and the backend only returns entries before the date, we make sure the
  // date is at the end of the day
  let endOfEndDate: Date | null = null;
  if (endDate) {
    endOfEndDate = new Date(endDate);
    endOfEndDate.setUTCHours(23, 59, 59, 999);
  }

  const fetchSurroundingSpotlight = useCallback(async () => {
    setIsLoading(true);
    setEntries([]);

    const newEntries = await fetchEntries({
      anchorId: spotlight,
      contextSize: ENTRIES_PER_FETCH,
      limit: ENTRIES_PER_FETCH,
    });

    setIsLoading(false);
    setEntries(newEntries);
  }, [spotlight]);

  useEffect(() => {
    if (
      spotlight &&
      !isLoading &&
      entries.every((entry) => entry.id !== spotlight)
    ) {
      fetchSurroundingSpotlight()
        .then(onSpotlightFetched)
        .catch((e) => {
          if (!(e instanceof ServerError)) {
            throw e;
          }

          reportServerError("Could not retrieve entry", e);

          // Rollback
          setIsLoading(false);
          setEntries(entries);
        });
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

    const newEntries = await fetchEntries({
      search,
      logbooks,
      tags,
      startDate: startDate || undefined,
      endDate: endOfEndDate || undefined,
      limit: ENTRIES_PER_FETCH,
      sortByLogDate,
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
    endOfEndDate,
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
        startDate: startDate || undefined,
        endDate: endOfEndDate || undefined,
        anchorId: entries[entries.length - 1].id,
        limit: ENTRIES_PER_FETCH,
        sortByLogDate,
      });

      if (newEntries.length !== ENTRIES_PER_FETCH) {
        setReachedBottom(true);
      }

      setIsLoading(false);
      setEntries((entries) => entries.concat(newEntries));
    }
  }, [
    search,
    logbooks,
    tags,
    sortByLogDate,
    startDate,
    endOfEndDate,
    entries,
    isLoading,
  ]);

  useEffect(() => {
    refreshEntries();
    setReachedBottom(false);
  }, [refreshEntries]);

  return { entries, isLoading, refreshEntries, getMoreEntries, reachedBottom };
}
