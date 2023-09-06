import { ServerError, User, fetchUsers } from "../api";
import reportServerError from "../reportServerError";
import { useQuery } from "@tanstack/react-query";

export default function useUsers({
  search,
  enabled = true,
  critical = true,
}: {
  search: string;
  enabled?: boolean;
  critical?: boolean;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["users", search],
    queryFn: () => fetchUsers(search),
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
      const userMap = users.reduce<Record<string, User>>((acc, user) => {
        acc[user.uid] = user;
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
