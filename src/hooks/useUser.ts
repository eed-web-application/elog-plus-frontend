import { fetchUser } from "../api";
import { useQuery } from "@tanstack/react-query";

export default function useUser<A extends boolean>(
  userId?: string,
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
    queryKey: ["user", userId, includeAuthorizations],
    enabled: Boolean(userId),
    queryFn: () => fetchUser<A>(userId as string, includeAuthorizations),
    throwOnError: critical,
    staleTime: 5 * 60 * 1000,
    meta: {
      resource: "user",
    },
  });

  return data;
}
