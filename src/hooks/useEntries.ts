import { useCallback, useEffect, useMemo, useState } from "react";
import { EntrySummary, ServerError, fetchEntries } from "../api";
import reportServerError from "../reportServerError";

const ENTRIES_PER_FETCH = 25;
const POLL_EVERY = 1000 * 60;

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
  autoRefresh?: boolean;
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
  autoRefresh,
  onSpotlightFetched,
}: Params) {
  const [entries, setEntries] = useState<EntrySummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [reachedBottom, setReachedBottom] = useState<boolean>(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number | null>(
    null
  );

  // Since we want to include all the entries in the same day of the date
  // and the backend only returns entries before the date, we make sure the
  // date is at the end of the day
  const endOfEndDate = useMemo(() => {
    let endOfEndDate: Date | null = null;
    if (endDate) {
      endOfEndDate = new Date(endDate);
      endOfEndDate.setUTCHours(23, 59, 59, 999);
    }
    return endOfEndDate;
  }, [endDate]);

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

  const firstEntryId = entries[0]?.id;
  const numberOfEntries = entries.length;

  // Undefined if firstEntryId is falsy, because it doesn't make sense to update
  // entries if we don't have any
  const update = useMemo(() => {
    if (!firstEntryId) {
      return;
    }

    return async () => {
      // We set the anchor to the first entry and set the limit to the number
      // of entries already fetched minus one (since the anchor is not included
      // in the limit count), so we update only the entries we've already
      // fetched, and new entries, those before the anchor, are added as desired
      // and are not included in the limit count but instead the contextSize,
      // which is limited to `ENTRIES_PER_FETCH` new entries per poll.
      const updatedEntries = await fetchEntries({
        logbooks,
        tags,
        search,
        sortByLogDate,
        startDate: startDate || undefined,
        endDate: endOfEndDate || undefined,
        anchorId: firstEntryId,
        contextSize: ENTRIES_PER_FETCH + 1,
        limit: numberOfEntries - 1,
      });

      setEntries(updatedEntries);
    };
  }, [
    logbooks,
    tags,
    search,
    sortByLogDate,
    startDate,
    endOfEndDate,
    firstEntryId,
    numberOfEntries,
  ]);

  useEffect(() => {
    refreshEntries();
    setReachedBottom(false);
  }, [refreshEntries]);

  useEffect(() => {
    if (autoRefresh && update && autoRefreshInterval === null) {
      const id = setInterval(update, POLL_EVERY);
      setAutoRefreshInterval(id);
    }
  }, [autoRefreshInterval, autoRefresh, update]);

  return { entries, isLoading, refreshEntries, getMoreEntries, reachedBottom };
}
