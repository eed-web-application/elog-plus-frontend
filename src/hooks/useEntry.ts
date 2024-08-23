import { fetchEntry } from "../api";
import { useQuery } from "@tanstack/react-query";

export default function useEntry(
  entryId?: string,
  { critical = true }: { critical?: boolean; onError?: () => void } = {},
) {
  const { data } = useQuery({
    queryKey: ["entry", entryId],
    enabled: Boolean(entryId),
    queryFn: () => fetchEntry(entryId as string),
    useErrorBoundary: critical,
    // This is here specifically, because the entry loader prefetches the
    // entries to be used here, so we set the staleTime to something small.
    staleTime: 100,
    meta: {
      resource: "entry",
    },
  });

  return data;
}
