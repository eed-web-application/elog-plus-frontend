import { ServerError, fetchGroups } from "../api";
import reportServerError from "../reportServerError";
import { useQuery } from "@tanstack/react-query";

export default function useGroups({
  enabled = true,
  critical = true,
}: {
  enabled?: boolean;
  critical?: boolean;
} = {}) {
  const { data, isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: () => fetchGroups(),
    enabled,
    useErrorBoundary: critical,
    staleTime: 5 * 60 * 1000,
    onError: (e) => {
      if (!(e instanceof ServerError)) {
        throw e;
      }
      reportServerError("Could not retrieve groups", e);
    },
  });

  return {
    groups: data,
    isLoading,
  };
}
