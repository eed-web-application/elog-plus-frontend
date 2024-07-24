import { useMemo } from "react";
import { User, UserWithAuth, ServerError, fetchUsers } from "../api";
import reportServerError from "../reportServerError";
import { useInfiniteQuery } from "@tanstack/react-query";

const USERS_PER_PAGE = 25;

export default function useUsers<A extends boolean>({
  search,
  includeAuthorizations,
  enabled = true,
  critical = true,
}: {
  search: string;
  includeAuthorizations?: A;
  enabled?: boolean;
  critical?: boolean;
}) {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isInitialLoading,
  } = useInfiniteQuery({
    queryKey: ["users", search],
    queryFn: ({ pageParam, queryKey }) =>
      fetchUsers<A>({
        search,
        includeAuthorizations,
        anchor: pageParam,
        limit: USERS_PER_PAGE,
      }),
    enabled,
    useErrorBoundary: critical,
    staleTime: 5 * 60 * 1000,
    onError: (e) => {
      if (!(e instanceof ServerError)) {
        throw e;
      }

      reportServerError("Could not retrieve users", e);
    },
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
          acc[user.id] = user;
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
    reachedBottom: !hasNextPage && !isInitialLoading,
  };
}
