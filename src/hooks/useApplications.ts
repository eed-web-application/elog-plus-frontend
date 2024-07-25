import { useMemo } from "react";
import {
  Application,
  ApplicationWithAuth,
  ServerError,
  fetchApplications,
} from "../api";
import reportServerError from "../reportServerError";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

const APPLICATIONS_PER_PAGE = 25;

export default function useApplications<A extends boolean>({
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
    queryKey: ["applications", search],
    queryFn: ({ pageParam, queryKey }) =>
      fetchApplications<A>({
        search,
        includeAuthorizations,
        anchor: pageParam,
        limit: APPLICATIONS_PER_PAGE,
      }),
    enabled,
    useErrorBoundary: critical,
    staleTime: 5 * 60 * 1000,
    onError: (e) => {
      if (!(e instanceof ServerError)) {
        throw e;
      }

      reportServerError("Could not retrieve applications", e);
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length < APPLICATIONS_PER_PAGE) {
        return undefined;
      }

      return lastPage[lastPage.length - 1].id;
    },
  });

  const applications = useMemo(() => data?.pages.flat() || [], [data?.pages]);
  const applicationMap = useMemo(
    () =>
      applications.reduce<
        Record<string, A extends true ? ApplicationWithAuth : Application>
      >((acc, application) => {
        acc[application.id] = application;
        return acc;
      }, {}),
    [applications],
  );

  return {
    applications,
    applicationMap,
    isLoading: isLoading || isFetchingNextPage,
    getMoreApplications: fetchNextPage,
    reachedBottom: !hasNextPage && !isInitialLoading,
  };
}
