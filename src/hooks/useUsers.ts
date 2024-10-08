import { useMemo } from "react";
import { User, UserWithAuth, fetchUsers } from "../api";
import { useInfiniteQuery } from "@tanstack/react-query";

const USERS_PER_PAGE = 25;

export type UsersQuery<A extends boolean> = {
  search: string;
  includeAuthorizations?: A;
};

export default function useUsers<A extends boolean>({
  enabled = true,
  critical = true,
  ...query
}: {
  enabled?: boolean;
  critical?: boolean;
} & UsersQuery<A>) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["users", query],
      queryFn: ({ pageParam, queryKey }) =>
        fetchUsers<A>({
          ...(queryKey[1] as UsersQuery<A>),
          anchor: pageParam,
          limit: USERS_PER_PAGE,
        }),
      enabled,
      throwOnError: critical,
      staleTime: 5 * 60 * 1000,
      meta: {
        resource: "users",
      },
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => {
        if (lastPage.length < USERS_PER_PAGE) {
          return undefined;
        }

        return lastPage[lastPage.length - 1].id;
      },
    });

  const users = useMemo(() => data?.pages.flat() || [], [data?.pages]);
  const userMap = useMemo(
    () =>
      users.reduce<Record<string, A extends true ? UserWithAuth : User>>(
        (acc, user) => {
          acc[user.email] = user;
          return acc;
        },
        {},
      ),
    [users],
  );

  return {
    users,
    userMap,
    isLoading: isLoading || isFetchingNextPage,
    getMoreUsers: fetchNextPage,
    reachedBottom: !hasNextPage && !isFetchingNextPage,
  };
}
