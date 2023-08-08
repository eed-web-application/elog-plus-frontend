import { ServerError, fetchEntry } from "../api";
import { useQuery } from "@tanstack/react-query";
import reportServerError from "../reportServerError";

export default function useEntry(
  entryId?: string,
  {
    critical = true,
    onError,
  }: { critical?: boolean; onError?: () => void } = {}
) {
  const { data } = useQuery({
    queryKey: ["entry", entryId],
    enabled: Boolean(entryId),
    queryFn: () => fetchEntry(entryId as string),
    useErrorBoundary: critical,
    // This is here specifically, because the entry loader prefetches the
    // entries to be used here, so we set the staleTime to something small.
    staleTime: 100,
    onError: (e) => {
      if (!(e instanceof ServerError)) {
        throw e;
      }

      reportServerError("Could not retrieve entry", e);
      onError?.();
    },
  });

  return data;
}
