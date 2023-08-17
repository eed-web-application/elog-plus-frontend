import { useQueries } from "@tanstack/react-query";
import { fetchShiftSummary } from "../api";

export interface ShiftSummaryIdent {
  shiftId: string;
  date: string;
}

/**
 * Retrieves the IDs of shift summary given shift IDs and dates
 */
export default function useSummaries(shiftSummaries: ShiftSummaryIdent[]) {
  const queries = useQueries({
    queries: shiftSummaries.map(({ shiftId, date }) => ({
      queryKey: ["shiftSummary", shiftId, date],
      queryFn: async () =>
        (await fetchShiftSummary(shiftId as string, date as string)) || null,
    })),
  });

  const isLoading = queries.some(({ isLoading }) => isLoading);

  return { summaries: queries.map(({ data }) => data), isLoading };
}
