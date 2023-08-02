import { useEffect, useState } from "react";
import reportServerError from "../reportServerError";
import { Entry, ServerError } from "../api";
import { useEntriesStore } from "../entriesStore";

export default function useEntry(entryId?: string) {
  const [entry, setEntry] = useState<Entry | null>(null);
  const getOrFetch = useEntriesStore((state) => state.getOrFetch);

  useEffect(() => {
    async function fetch(entryId: string) {
      try {
        await getOrFetch(entryId).then(setEntry);
      } catch (e) {
        if (!(e instanceof ServerError)) {
          throw e;
        }
        reportServerError("Could not retrieve entry", e);
      }
    }

    if (!entry && entryId) {
      fetch(entryId);
    }
  }, [getOrFetch, entry, entryId]);

  return entry;
}
