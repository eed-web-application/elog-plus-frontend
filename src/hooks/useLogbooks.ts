import { Logbook, ServerError, fetchLogbooks } from "../api";
import reportServerError from "../reportServerError";
import { useQuery } from "@tanstack/react-query";

export default function useLogbooks({
  enabled = true,
  critical = true,
}: {
  enabled?: boolean;
  critical?: boolean;
} = {}) {
  const { data, isLoading } = useQuery({
    queryKey: ["logbooks"],
    queryFn: () => fetchLogbooks(),
    enabled,
    useErrorBoundary: critical,
    staleTime: 5 * 60 * 1000,
    onError: (e) => {
      if (!(e instanceof ServerError)) {
        throw e;
      }

      reportServerError("Could not retrieve logbooks", e);
    },
    select: (logbooks) => {
      const logbookMap = logbooks.reduce<Record<string, Logbook>>(
        (acc, logbook) => {
          acc[logbook.id] = logbook;
          return acc;
        },
        {}
      );

      return { logbookMap, logbooks };
    },
  });

  return {
    logbooks: data?.logbooks || [],
    logbookMap: data?.logbookMap || {},
    isLoading,
  };
}
