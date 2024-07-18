import {
  Application,
  ApplicationWithAuth,
  ServerError,
  fetchApplications,
} from "../api";
import reportServerError from "../reportServerError";
import { useQuery } from "@tanstack/react-query";

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
}): {
  applications: (A extends true ? ApplicationWithAuth : Application)[];
  applicationMap: Record<
    string,
    A extends true ? ApplicationWithAuth : Application
  >;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: ["applications", search],
    queryFn: () => fetchApplications<A>({ search, includeAuthorizations }),
    enabled,
    useErrorBoundary: critical,
    staleTime: 5 * 60 * 1000,
    onError: (e) => {
      if (!(e instanceof ServerError)) {
        throw e;
      }

      reportServerError("Could not retrieve applications", e);
    },
    select: (applications) => {
      const applicationMap = applications.reduce<
        Record<string, A extends true ? ApplicationWithAuth : Application>
      >((acc, application) => {
        acc[application.id] = application;
        return acc;
      }, {});

      return { applications, applicationMap };
    },
  });

  return {
    applications: data?.applications || [],
    applicationMap: data?.applicationMap || {},
    isLoading,
  };
}
