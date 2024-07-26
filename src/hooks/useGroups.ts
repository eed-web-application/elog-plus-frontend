import { useMemo } from "react";
import { Group, GroupOptions, ServerError, fetchGroups } from "../api";
import reportServerError from "../reportServerError";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

const GROUPS_PER_PAGE = 25;

export default function useGroups<A extends boolean, M extends boolean>({
  search,
  includeAuthorizations,
  includeMembers,
  enabled = true,
  critical = true,
}: {
  search: string;
  enabled?: boolean;
  critical?: boolean;
} & GroupOptions<A, M>) {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isInitialLoading,
  } = useInfiniteQuery({
    queryKey: ["groups", search],
    queryFn: ({ pageParam, queryKey }) =>
      fetchGroups<A, M>({
        search,
        includeAuthorizations,
        includeMembers,
        anchor: pageParam,
        limit: GROUPS_PER_PAGE,
      }),
    enabled,
    useErrorBoundary: critical,
    staleTime: 5 * 60 * 1000,
    onError: (e) => {
      if (!(e instanceof ServerError)) {
        throw e;
      }

      reportServerError("Could not retrieve groups", e);
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length < GROUPS_PER_PAGE) {
        return undefined;
      }

      return lastPage[lastPage.length - 1].id;
    },
  });

  const groups = useMemo(() => data?.pages.flat() || [], [data?.pages]);
  const groupMap = useMemo(
    () =>
      groups.reduce<Record<string, Group<A, M>>>((acc, group) => {
        acc[group.id] = group;
        return acc;
      }, {}),
    [groups],
  );

  return {
    groups,
    groupMap,
    isLoading: isLoading || isFetchingNextPage,
    getMoreGroups: fetchNextPage,
    reachedBottom: !hasNextPage && !isInitialLoading,
  };
}
