import { ServerError, fetchApplications, Application } from "../api";
import reportServerError from "../reportServerError";
import { useQuery } from "@tanstack/react-query";

export default function useApplications({
  enabled = true,
  critical = true,
}: {
  enabled?: boolean;
  critical?: boolean;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: () => fetchApplications(),
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
      const appMap = applications.reduce<Record<string, Application>>(
        (acc, app) => {
          acc[app.id] = app;
          return acc;
        },
        {},
      );

      return { applications, appMap };
    },
  });

  return {
    applications: data?.applications || [],
    appMap: data?.appMap || {},
    isLoading,
  };
}
