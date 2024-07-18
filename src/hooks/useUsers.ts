import { ServerError, User, UserWithAuth, fetchUsers } from "../api";
import reportServerError from "../reportServerError";
import { useQuery } from "@tanstack/react-query";

export default function useUsers<A extends boolean>({
  search,
  includeAuthorizations,
  enabled = true,
  critical = true,
}: {
  search: string;
  includeAuthorizations?: A;
  enabled?: boolean;
  critical?: boolean;
}): {
  users: (A extends true ? UserWithAuth : User)[];
  userMap: Record<string, A extends true ? UserWithAuth : User>;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: ["users", search],
    queryFn: () => fetchUsers<A>({ search, includeAuthorizations }),
    enabled,
    useErrorBoundary: critical,
    staleTime: 5 * 60 * 1000,
    onError: (e) => {
      if (!(e instanceof ServerError)) {
        throw e;
      }

      reportServerError("Could not retrieve users", e);
    },
    select: (users) => {
      const userMap = users.reduce<
        Record<string, A extends true ? UserWithAuth : User>
      >((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {});

      return { users, userMap };
    },
  });

  return {
    users: data?.users || [],
    userMap: data?.userMap || {},
    isLoading,
  };
}
