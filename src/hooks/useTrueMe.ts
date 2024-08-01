import { ServerError, fetchTrueMe } from "../api";
import { useQuery } from "@tanstack/react-query";
import reportServerError from "../reportServerError";

export default function useTrueMe({
  critical = true,
  enabled = true,
  onError,
}: {
  critical?: boolean;
  enabled?: boolean;
  onError?: () => void;
} = {}) {
  const { data } = useQuery({
    queryKey: ["user", "trueMe"],
    enabled: enabled,
    queryFn: () => fetchTrueMe(),
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
