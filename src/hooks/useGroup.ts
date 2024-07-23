import { ServerError, fetchGroup } from "../api";
import { useQuery } from "@tanstack/react-query";
import reportServerError from "../reportServerError";

export default function useGroup<A extends boolean>(
  groupId?: string,
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
    queryKey: ["group", groupId, includeAuthorizations],
    enabled: Boolean(groupId),
    queryFn: () => fetchGroup<A>(groupId as string, includeAuthorizations),
    useErrorBoundary: critical,
    staleTime: 5 * 60 * 1000,
    onError: (e) => {
      if (!(e instanceof ServerError)) {
        throw e;
      }

      reportServerError("Could not retrieve group", e);
      onError?.();
    },
  });

  return data;
}
