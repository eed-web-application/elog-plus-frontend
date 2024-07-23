import { ServerError, fetchUser } from "../api";
import { useQuery } from "@tanstack/react-query";
import reportServerError from "../reportServerError";

export default function useUser<A extends boolean>(
  userId?: string,
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
    queryKey: ["user", userId, includeAuthorizations],
    enabled: Boolean(userId),
    queryFn: () => fetchUser<A>(userId as string, includeAuthorizations),
    useErrorBoundary: critical,
    staleTime: 5 * 60 * 1000,
    onError: (e) => {
      if (!(e instanceof ServerError)) {
        throw e;
      }

      reportServerError("Could not retrieve user", e);
      onError?.();
    },
  });

  return data;
}
