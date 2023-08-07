import { ServerError, fetchLogbooks } from "../api";
import reportServerError from "../reportServerError";
import { useQuery } from "@tanstack/react-query";

export default function useLogbooks({
  enabled = true,
  critical = true,
}: {
  enabled?: boolean;
  critical?: boolean;
} = {}) {
  const { data } = useQuery({
    queryKey: ["logbooks"],
    queryFn: () => fetchLogbooks(),
    enabled,
    useErrorBoundary: critical,
    staleTime: 5 * 60 * 1000,
    onError: (e) => {
      if (!(e instanceof ServerError)) {
        throw e;
      }
      reportServerError("Could not retrieve logbooks", e);
    },
  });

  return data;
}
