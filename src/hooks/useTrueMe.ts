import { fetchTrueMe } from "../api";
import { useQuery } from "@tanstack/react-query";

export default function useTrueMe({
  critical = true,
  enabled = true,
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
    meta: {
      resource: "user",
    },
  });

  return data;
}
