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
    queryKey: ["trueMe"],
    enabled: enabled,
    queryFn: () => fetchTrueMe(),
    throwOnError: critical,
    staleTime: 5 * 60 * 1000,
    meta: {
      resource: "user",
    },
  });

  return data;
}
