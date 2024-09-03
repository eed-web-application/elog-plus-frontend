import { fetchGroup } from "../api";
import { useQuery } from "@tanstack/react-query";

export default function useGroup(
  groupId?: string,
  {
    critical = true,
  }: {
    critical?: boolean;
  } = {},
) {
  const { data } = useQuery({
    queryKey: ["group", groupId],
    enabled: Boolean(groupId),
    queryFn: () => fetchGroup(groupId as string),
    useErrorBoundary: critical,
    staleTime: 5 * 60 * 1000,
    meta: {
      resource: "group",
    },
  });

  return data;
}
