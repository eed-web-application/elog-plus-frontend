import { useQuery } from "@tanstack/react-query";
import { fetchShiftSummary } from "../api";

/**
 * Get or fetch the id of a shift summary. If `shiftId` or `date` are undefined,
 * will always return `undefined`.
 *
 * @returns `undefined` if loading, `null` if nothing found, or the id of the
 * summary otherwise.
 */
export default function useSummary(shiftId?: string, date?: string) {
  const { data } = useQuery({
    queryKey: ["shiftSummary", shiftId, date],
    queryFn: async () =>
      (await fetchShiftSummary(shiftId as string, date as string)) || null,
    enabled: shiftId !== undefined && date !== undefined,
  });

  return data;
}
