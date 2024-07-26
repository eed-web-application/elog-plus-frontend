import { GroupOptions, ServerError, fetchGroup } from "../api";
import { useQuery } from "@tanstack/react-query";
import reportServerError from "../reportServerError";

export default function useGroup<A extends boolean, M extends boolean>(
  groupId?: string,
  {
    critical = true,
    onError,
    ...options
  }: {
    critical?: boolean;
    onError?: () => void;
  } & GroupOptions<A, M> = {},
) {
  const { data } = useQuery({
    queryKey: ["group", groupId, options],
    enabled: Boolean(groupId),
    queryFn: () => fetchGroup<A, M>(groupId as string, options),
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
