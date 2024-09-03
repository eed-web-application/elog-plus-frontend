import { fetchApplication } from "../api";
import { useQuery } from "@tanstack/react-query";

export default function useApplication<A extends boolean>(
  applicationId?: string,
  {
    critical = true,
    includeAuthorizations,
  }: {
    critical?: boolean;
    includeAuthorizations?: A;
    onError?: () => void;
  } = {},
) {
  const { data } = useQuery({
    queryKey: ["application", applicationId, includeAuthorizations],
    enabled: Boolean(applicationId),
    queryFn: () =>
      fetchApplication<A>(applicationId as string, includeAuthorizations),
    throwOnError: critical,
    staleTime: 5 * 60 * 1000,
    meta: {
      resource: "application",
    },
  });

  return data;
}
