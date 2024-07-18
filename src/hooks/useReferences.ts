import { ServerError, fetchReferences } from "../api";
import { useQuery } from "@tanstack/react-query";
import reportServerError from "../reportServerError";

export default function useReferences(
  entryId?: string,
  {
    critical = true,
    onError,
  }: { critical?: boolean; onError?: () => void } = {},
) {
  const { data } = useQuery({
    // Not nesting (e.g., ["entry", "references", ...]) because this data is
    // independent.
    queryKey: ["entryReferences", entryId],
    enabled: Boolean(entryId),
    queryFn: () => fetchReferences(entryId as string),
    useErrorBoundary: critical,
    // This data should be static
    staleTime: Infinity,
    onError: (e) => {
      if (!(e instanceof ServerError)) {
        throw e;
      }

      reportServerError("Could not retrieve entry's references", e);
      onError?.();
    },
  });

  return data;
}
