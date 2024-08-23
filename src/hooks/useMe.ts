import { fetchMe } from "../api";
import { useQuery } from "@tanstack/react-query";

export default function useMe({
  critical = true,
  enabled = true,
}: {
  critical?: boolean;
  enabled?: boolean;
  onError?: () => void;
} = {}) {
  const { data } = useQuery({
    queryKey: ["user", "me"],
    enabled: enabled,
    queryFn: () => fetchMe(),
    useErrorBoundary: critical,
    staleTime: 5 * 60 * 1000,
    meta: {
      resource: "user",
    },
  });

  return data;
}
