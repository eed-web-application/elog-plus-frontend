import { useMemo } from "react";
import { Application, ApplicationWithAuth, fetchApplications } from "../api";
import { useInfiniteQuery } from "@tanstack/react-query";

const APPLICATIONS_PER_PAGE = 25;

export type ApplicationsQuery<A extends boolean> = {
  search: string;
  includeAuthorizations?: A;
};

export default function useApplications<A extends boolean>({
  enabled = true,
  critical = true,
  ...query
}: {
  enabled?: boolean;
  critical?: boolean;
} & ApplicationsQuery<A>) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["applications", query],
      queryFn: ({ pageParam, queryKey }) =>
        fetchApplications<A>({
          ...(queryKey[1] as ApplicationsQuery<A>),
          anchor: pageParam,
          limit: APPLICATIONS_PER_PAGE,
        }),
      initialPageParam: undefined as string | undefined,
      enabled,
      throwOnError: critical,
      staleTime: 5 * 60 * 1000,
      meta: {
        resource: "applications",
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
    reachedBottom: !hasNextPage && !isFetchingNextPage,
  };
}
