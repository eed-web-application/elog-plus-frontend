import { Logbook, LogbookWithAuth, Permission, fetchLogbooks } from "../api";
import { useQuery } from "@tanstack/react-query";

export default function useLogbooks<A extends boolean>({
  enabled = true,
  critical = true,
  requirePermission = "Read",
  includeAuth,
}: {
  enabled?: boolean;
  critical?: boolean;
  requirePermission?: Permission;
  includeAuth?: A;
} = {}): {
  logbooks: (A extends true ? LogbookWithAuth : Logbook)[];
  logbookMap: Record<string, A extends true ? LogbookWithAuth : Logbook>;
  logbookNameMap: Record<string, A extends true ? LogbookWithAuth : Logbook>;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: ["logbooks", includeAuth, requirePermission],
    queryFn: () => fetchLogbooks<A>({ includeAuth, requirePermission }),
    enabled,
    useErrorBoundary: critical,
    staleTime: 5 * 60 * 1000,
    meta: {
      resource: "logbooks",
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
