import { ServerError, fetchApplication } from "../api";
import { useQuery } from "@tanstack/react-query";
import reportServerError from "../reportServerError";

export default function useApplication<A extends boolean>(
  applicationId?: string,
  {
    critical = true,
    includeAuthorizations,
    onError,
  }: {
    critical?: boolean;
    includeAuthorizations?: A;
    onError?: () => void;
  } = {},
) {
  const { data } = useQuery({
    queryKey: ["application", applicationId, includeAuthorizations],
    enabled: Boolean(applicationId),
    queryFn: () =>
      fetchApplication<A>(applicationId as string, includeAuthorizations),
    useErrorBoundary: critical,
    staleTime: 5 * 60 * 1000,
    onError: (e) => {
      if (!(e instanceof ServerError)) {
        throw e;
      }

      reportServerError("Could not retrieve application", e);
      onError?.();
    },
  });

  return data;
}
