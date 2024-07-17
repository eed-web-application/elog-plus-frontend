import { ServerError, fetchGroups } from "../api";
import reportServerError from "../reportServerError";
import { useQuery } from "@tanstack/react-query";

export default function useGroups({
  search,
  enabled = true,
  critical = true,
}: {
  search: string;
  enabled?: boolean;
  critical?: boolean;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["groups", search],
    queryFn: () => fetchGroups({ search }),
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
