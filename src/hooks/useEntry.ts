import { ServerError, fetchEntry } from "../api";
import { useQuery } from "@tanstack/react-query";
import reportServerError from "../reportServerError";

export default function useEntry(entryId?: string, onError?: () => void) {
  const { data } = useQuery({
    queryKey: ["entry", entryId],
    enabled: Boolean(entryId),
    queryFn: () => fetchEntry(entryId as string),
    useErrorBoundary: (e) => !(e instanceof ServerError),
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
