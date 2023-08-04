import { useEffect, useState } from "react";
import { useSummariesStore } from "../summariesStore";

/**
 * Get or fetch the id of a shift summary. If `shiftId` or `date` are undefined,
 * will always return `undefined`.
 *
 * @returns `undefined` if loading, `null` if nothing found, or the id of the
 * summary otherwise.
 */
export default function useSummary(shiftId?: string, date?: string) {
  const [summaryId, setSummaryId] = useState<string | null | undefined>(
    undefined
  );
  const getOrFetch = useSummariesStore((state) => state.getOrFetch);

  useEffect(() => {
    if (summaryId === undefined && shiftId && date) {
      getOrFetch(shiftId, date).then((summaryId) =>
        setSummaryId(summaryId || null)
      );
    }
  }, [summaryId, setSummaryId, date, getOrFetch, shiftId]);

  return summaryId;
}
