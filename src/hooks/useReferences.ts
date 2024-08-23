import { fetchReferences } from "../api";
import { useQuery } from "@tanstack/react-query";

export default function useReferences(
  entryId?: string,
  { critical = true }: { critical?: boolean; onError?: () => void } = {},
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
    meta: {
      resource: "entry references",
    },
  });

  return data;
}
