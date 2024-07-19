import { Authorization, fetch } from ".";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface UserWithAuth extends User {
  authorizations: Authorization[];
}

export function updateUser(user: UserWithAuth) {
  return fetch(`v1/users/${user.id}`, {
    method: "PUT",
    body: user,
  });
}

export async function fetchUsers<A extends boolean | undefined>({
  search,
  includeAuthorizations,
}: {
  search: string;
  includeAuthorizations?: A;
}): Promise<(A extends true ? UserWithAuth : User)[]> {
  const params: Record<string, string> = { search };

  if (includeAuthorizations) {
    params.includeAuthorizations = "true";
  }

  const users = (await fetch("v1/auth/users", {
    params,
  })) as any[];

  // FIXME: Remove this when the proper API is implemented
  return users.map((user) => ({
    id: user.uid,
    name: user.gecos,
    email: user.mail,
    authorizations: !includeAuthorizations
      ? []
      : [
          {
            id: "1",
            permission: "Write",
            ownerId: user.uid,
            ownerType: "User",
            ownerLabel: user.gecos,
            resourceId: "66958c2ee81b14088ef1228f",
            resourceType: "Logbook",
            resouceLabel: "ACCEL",
          },
          {
            id: "2",
            permission: "Read",
            ownerType: "User",
            ownerId: user.uid,
            ownerLabel: user.gecos,
            resourceId: "66958c2ee81b14088ef12290",
            resourceType: "Logbook",
            resouceLabel: "PEP",
          },
        ],
  }));
}

export function fetchMe(): Promise<User> {
  return fetch("v1/auth/me");
}
