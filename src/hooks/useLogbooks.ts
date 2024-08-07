import { Logbook, LogbookWithAuth, ServerError, fetchLogbooks } from "../api";
import reportServerError from "../reportServerError";
import { useQuery } from "@tanstack/react-query";

export default function useLogbooks<A extends boolean>({
  enabled = true,
  critical = true,
  requireWrite = false,
  includeAuth,
}: {
  enabled?: boolean;
  critical?: boolean;
  requireWrite?: boolean;
  includeAuth?: A;
} = {}): {
  logbooks: (A extends true ? LogbookWithAuth : Logbook)[];
  logbookMap: Record<string, A extends true ? LogbookWithAuth : Logbook>;
  logbookNameMap: Record<string, A extends true ? LogbookWithAuth : Logbook>;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: ["logbooks", includeAuth, requireWrite],
    queryFn: () => fetchLogbooks<A>({ includeAuth, requireWrite }),
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
      const logbookMap = logbooks.reduce<
        Record<string, A extends true ? LogbookWithAuth : Logbook>
      >((acc, logbook) => {
        acc[logbook.id] = logbook;
        return acc;
      }, {});
      const logbookNameMap = logbooks.reduce<
        Record<string, A extends true ? LogbookWithAuth : Logbook>
      >((acc, logbook) => {
        acc[logbook.name] = logbook;
        return acc;
      }, {});

      return { logbookMap, logbookNameMap, logbooks };
    },
  });

  return {
    logbooks: data?.logbooks || [],
    logbookMap: data?.logbookMap || {},
    logbookNameMap: data?.logbookNameMap || {},
    isLoading,
  };
}
