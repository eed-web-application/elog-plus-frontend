import { Group, GroupWithAuth, ServerError, fetchGroups } from "../api";
import reportServerError from "../reportServerError";
import { useQuery } from "@tanstack/react-query";

export default function useGroups<A extends boolean>({
  search,
  includeAuthorizations,
  enabled = true,
  critical = true,
}: {
  search: string;
  includeAuthorizations?: A;
  enabled?: boolean;
  critical?: boolean;
}): {
  groups: (A extends true ? GroupWithAuth : Group)[];
  groupMap: Record<string, A extends true ? GroupWithAuth : Group>;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: ["groups", search],
    queryFn: () => fetchGroups<A>({ search, includeAuthorizations }),
    enabled,
    useErrorBoundary: critical,
    staleTime: 5 * 60 * 1000,
    onError: (e) => {
      if (!(e instanceof ServerError)) {
        throw e;
      }

      reportServerError("Could not retrieve groups", e);
    },
    select: (groups) => {
      const groupMap = groups.reduce<
        Record<string, A extends true ? GroupWithAuth : Group>
      >((acc, group) => {
        acc[group.id] = group;
        return acc;
      }, {});

      return { groups, groupMap };
    },
  });

  return {
    groups: data?.groups || [],
    groupMap: data?.groupMap || {},
    isLoading,
  };
}
