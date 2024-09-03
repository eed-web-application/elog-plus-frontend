import { useMemo } from "react";
import { GroupSummary, ResourceQuery, fetchGroups } from "../api";
import { useInfiniteQuery } from "@tanstack/react-query";

const GROUPS_PER_PAGE = 25;

export default function useGroups({
  enabled = true,
  critical = true,
  ...query
}: {
  enabled?: boolean;
  critical?: boolean;
} & ResourceQuery) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["groups", query],
      queryFn: ({ pageParam, queryKey }) =>
        fetchGroups({
          ...(queryKey[1] as ResourceQuery),
          anchor: pageParam,
          limit: GROUPS_PER_PAGE,
        }),
      enabled,
      throwOnError: critical,
      staleTime: 5 * 60 * 1000,
      meta: {
        resource: "groups",
      },
      initialPageParam: undefined as string | undefined,
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
      groups.reduce<Record<string, GroupSummary>>((acc, group) => {
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
    reachedBottom: !hasNextPage && !isFetchingNextPage,
  };
}
