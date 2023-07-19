import { useCallback, useEffect, useState } from "react";
import { EntrySummary, fetchEntries } from "../api";
import { useEntriesStore } from "../entriesStore";

const ENTRIES_PER_FETCH = 25;

export interface EntryQuery {
  search: string;
  logbooks: string[];
  tags: string[];
  date: string;
}

export interface Params extends Partial<EntryQuery> {
  spotlight?: string;
  onSpotlightFetched?: () => void;
}

export default function useEntries({
  spotlight,
  search,
  logbooks,
  tags,
  date,
  onSpotlightFetched,
}: Params) {
  const [entries, setEntries] = useState<EntrySummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [reachedBottom, setReachedBottom] = useState<boolean>(false);
  const getOrFetch = useEntriesStore((state) => state.getOrFetch);

  const fetchSurroundingSpotlight = useCallback(async () => {
    setIsLoading(true);

    const spotlightEntry = await getOrFetch(spotlight as string);

    const anchorDate = spotlightEntry.logDate;
    const numberBeforeAnchor = ENTRIES_PER_FETCH;

    const newEntries = await fetchEntries({
      anchorDate,
      numberBeforeAnchor,
      numberAfterAnchor: ENTRIES_PER_FETCH,
    });

    setIsLoading(false);
    setEntries(newEntries);
  }, [spotlight, getOrFetch]);

  useEffect(() => {
    if (spotlight && entries.every((entry) => entry.id !== spotlight)) {
      fetchSurroundingSpotlight();
      onSpotlightFetched?.();
    }
  }, [fetchSurroundingSpotlight, spotlight, entries, onSpotlightFetched]);

  const refreshEntries = useCallback(async () => {
    console.log("test");
    setIsLoading(true);

    let dateDayEnd;
    if (date) {
      dateDayEnd = new Date(date);
      // Since we want to include all the entries in the same day of the date
      // and the backend only returns entries before the date, we make sure the
      // date is at the end of the day
      dateDayEnd.setUTCHours(23, 59, 59, 999);
      dateDayEnd = dateDayEnd.toISOString();
    }

    const newEntries = await fetchEntries({
      search,
      logbooks,
      tags,
      anchorDate: dateDayEnd,
      numberAfterAnchor: ENTRIES_PER_FETCH,
    });

    setIsLoading(false);
    setEntries(newEntries);

    if (newEntries.length !== ENTRIES_PER_FETCH) {
      setReachedBottom(true);
    }
  }, [search, logbooks, tags, date, setIsLoading, setEntries]);

  const getMoreEntries = useCallback(async () => {
    if (entries.length > 0 && !isLoading) {
      setIsLoading(true);

      const newEntries = await fetchEntries({
        logbooks,
        tags,
        search,
        anchorDate: entries[entries.length - 1].logDate,
        numberAfterAnchor: ENTRIES_PER_FETCH,
      });

      if (newEntries.length !== ENTRIES_PER_FETCH) {
        setReachedBottom(true);
      }

      setIsLoading(false);
      setEntries((entries) => entries.concat(newEntries));
    }
  }, [search, logbooks, tags, entries, isLoading]);

  useEffect(() => {
    refreshEntries();
    setReachedBottom(false);
  }, [refreshEntries]);

  return { entries, isLoading, refreshEntries, getMoreEntries, reachedBottom };
}
