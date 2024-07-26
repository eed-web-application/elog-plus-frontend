import { useMemo } from "react";
import { Group, GroupOptions, ServerError, fetchGroups } from "../api";
import reportServerError from "../reportServerError";
import { useInfiniteQuery } from "@tanstack/react-query";

const GROUPS_PER_PAGE = 25;

export type GroupsQuery<A extends boolean, M extends boolean> = GroupOptions<
  A,
  M
> & {
  search: string;
};

export default function useGroups<A extends boolean, M extends boolean>({
  enabled = true,
  critical = true,
  ...query
}: {
  enabled?: boolean;
  critical?: boolean;
} & GroupsQuery<A, M>) {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isInitialLoading,
  } = useInfiniteQuery({
    queryKey: ["groups", query],
    queryFn: ({ pageParam, queryKey }) =>
      fetchGroups<A, M>({
        ...(queryKey[1] as GroupsQuery<A, M>),
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
